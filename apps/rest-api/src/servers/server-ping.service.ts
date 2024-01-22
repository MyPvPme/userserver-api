import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import * as Sentry from '@sentry/node';
import { Interval } from '@nestjs/schedule';
import { Buffer } from 'buffer';

@Injectable()
export class ServerPingService {
  private readonly logger = new Logger(ServerPingService.name);
  private servers = new Map<number, ServerPing>();
  private handshakeBuffer = Uint8Array.from([
    // Length
    0x13,
    // Packet ID
    0x00,
    // -1
    0xff, 0xff, 0xff, 0xff, 0x0f,
    // localhost
    0x09, 0x31, 0x32, 0x37, 0x2e, 0x30, 0x2e, 0x30, 0x2e, 0x31,
    // Short Port
    0x63, 0xdd,
    // Next state
    0x01,
  ]);
  private serverListRequest = Uint8Array.from([0x01, 0x00]);

  addServer(id: number, config: ServerPingConfig): void {
    if (!this.servers.get(id)) {
      this.servers.set(id, {
        ...config,
        added: new Date(),
      });
    }
  }

  removeServer(id: number): void {
    this.servers.delete(id);
  }

  @Interval(1000)
  private async pingServers(): Promise<void> {
    for (const serverPing of this.servers) {
      if (
        serverPing[1].added.getTime() <
        new Date().getTime() - serverPing[1].timeout
      ) {
        this.servers.delete(serverPing[0]);
        serverPing[1].timeoutCallBack();
        continue;
      }

      try {
        await this.checkStatus(serverPing[1].host, serverPing[1].port);
        serverPing[1].callback();
        this.servers.delete(serverPing[0]);
      } catch (e) {
        this.logger.debug(e);
      }
    }
  }

  checkStatus(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Ping ${host} on port ${port}`);

      const timer = setTimeout(() => {
        socket.end();
        reject('Socket timeout');
      }, +process.env.USERSERVER_PING_SOCKET_TIMEOUT || 600);

      const socket = new net.Socket();

      socket.setEncoding('hex');

      socket.on('error', (e) => {
        clearTimeout(timer);
        this.logger.debug(e);
        reject();
      });

      try {
        socket.connect({
          host: host,
          port: port,
        });
      } catch (e) {
        reject(e);
        return;
      }

      try {
        socket.on('data', (data: string) => {
          this.logger.debug(`Received data from ${host}:${port} ${data}`);
          const buffer = Buffer.from(data, 'hex');
          try {
            let offset = 0;
            const sizeVarInt = this.readVarInt(buffer);
            offset += sizeVarInt.length;

            const packetId = buffer.readInt8(offset);
            offset += 1;

            if (packetId !== 0) return;

            let stringLength: { value: number; length: number };

            try {
              stringLength = this.readVarInt(buffer, offset);
            } catch (e) {
              this.logger.error(e);
              Sentry.captureException(e);
              clearTimeout(timer);
              socket.end();
              reject(e);
              return;
            }

            if (!stringLength) return;

            offset += stringLength.length;

            const json = buffer.toString('utf-8', offset, buffer.length);

            JSON.parse(json);

            clearTimeout(timer);
            socket.end();
            resolve();
          } catch (e) {
            this.logger.error(e);
            Sentry.captureException(e);
            socket.end();
            clearTimeout(timer);
            reject(e);
          }
        });
      } catch (e) {
        this.logger.debug(e);
        clearTimeout(timer);
        reject(e);
        return;
      }

      try {
        socket.write(this.handshakeBuffer);
        socket.write(this.serverListRequest);
      } catch (e) {
        socket.end();
        clearTimeout(timer);
        reject(e);
        return;
      }
    });
  }

  private readVarInt(
    buffer: Buffer,
    offset = 0,
  ): { value: number; length: number } {
    let value = 0;
    let length = 0;
    let currentByte;

    while (true) {
      currentByte = buffer.readInt8(offset + length);
      value |= (currentByte & 0x7f) << (length * 7);

      length += 1;
      if (length > 5) {
        throw new Error('VarInt is too big');
      }

      if ((currentByte & 0x80) === 0) {
        break;
      }
    }
    return { value, length };
  }
}

type ServerPingConfig = {
  host: string;
  port: number;
  timeout: number;
  callback: () => void;
  timeoutCallBack: () => void;
};

type ServerPing = {
  added: Date;
} & ServerPingConfig;
