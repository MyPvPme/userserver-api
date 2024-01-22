import { Injectable } from '@nestjs/common';
import { ServersService } from './servers.service';
import { OnEvent } from '@nestjs/event-emitter';
import { EventTypeEnum } from '../events/event-type.enum';
import { Event } from '../events/event.entity';
import { Interval } from '@nestjs/schedule';
import { ServerStatus } from './server-status.enum';

@Injectable()
export class ServerStopService {
  private readonly serversWithZeroPlayers = new Map<number, number>();

  constructor(private readonly serversService: ServersService) {}

  @OnEvent('server.' + EventTypeEnum.USERSERVER_PLAYER_COUNT_UPDATE)
  public async onPlayerCountChange(event: Event): Promise<void> {
    const serverId = +event.scope;

    if (event.attributes.playerCount === '0') {
      this.serversWithZeroPlayers.set(serverId, Date.now() + 5 * 60 * 1000);
    } else {
      if (this.serversWithZeroPlayers.has(serverId)) {
        this.serversWithZeroPlayers.delete(serverId);
      }
    }
  }

  @OnEvent('server.' + EventTypeEnum.USERSERVER_STATUS_CHANGED)
  public async onStatusChanged(event: Event): Promise<void> {
    const serverId = +event.scope;

    if (event.attributes.status !== ServerStatus.ONLINE) {
      if (this.serversWithZeroPlayers.has(serverId)) {
        this.serversWithZeroPlayers.delete(serverId);
      }
    }

    if (event.attributes.status === ServerStatus.ONLINE) {
      if (!this.serversWithZeroPlayers.has(serverId)) {
        this.serversWithZeroPlayers.set(serverId, Date.now() + 5 * 60 * 1000);
      }
    }
  }

  @Interval(10000)
  public async checkServerWithZeroPlayers(): Promise<void> {
    for (const [serverId, stopDate] of this.serversWithZeroPlayers.entries()) {
      if (stopDate <= Date.now()) {
        await this.serversService.stopServer({ id: serverId });
      }
    }
  }
}
