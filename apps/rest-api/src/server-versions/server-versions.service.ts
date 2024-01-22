import { Injectable } from '@nestjs/common';
import { ServerVersion } from './server-version.entity';
import { ServerVersionNotFoundException } from './exceptions/server-version-not-found.exception';
import { CreateServerVersionDto } from './dto/create-server-version.dto';
import { ServerVersionAlreadyExistsException } from './exceptions/server-version-already-exists.exception';
import { EditServerVersionDto } from './dto/edit-server-version.dto';

@Injectable()
export class ServerVersionsService {
  async getVersionByName(name: string): Promise<ServerVersion> {
    const version = await ServerVersion.findOneBy({ name });

    if (!version) {
      throw new ServerVersionNotFoundException(`Version ${name} not found`);
    }

    return version;
  }

  async createServerVersion(
    createServerVersionDto: CreateServerVersionDto,
  ): Promise<ServerVersion> {
    const version = await ServerVersion.findOneBy({
      name: createServerVersionDto.name,
    });

    if (version) {
      throw new ServerVersionAlreadyExistsException(
        `Version ${version.name} already exists`,
      );
    }

    const newVersion = createServerVersionDto.toServerVersion();

    return newVersion.save();
  }

  async editServerVersion(
    name: string,
    editServerVersionDto: EditServerVersionDto,
  ): Promise<ServerVersion> {
    const serverVersion = await this.getVersionByName(name);

    serverVersion.startCommand = editServerVersionDto.startCommand;
    serverVersion.image = editServerVersionDto.image;

    return serverVersion.save();
  }

  getAll(): Promise<ServerVersion[]> {
    return ServerVersion.find();
  }
}
