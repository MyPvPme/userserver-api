import {
  EventTypeEnum,
  getRequiredPermissionForEvent,
} from './event-type.enum';
import { IsArray, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../servers/server.entity';

export class Event {
  /**
   * The type of the event
   */
  @IsEnum(EventTypeEnum)
  type: EventTypeEnum;

  /**
   * The UUID of the user or SYSTEM
   */
  @IsString()
  producer: string;

  /**
   * The scope of the Event (serverId, uuid)
   */
  @IsString()
  scope?: string;

  /**
   * All users who have the permission to see this event
   * only visible for system tokens
   */
  @IsString({ each: true })
  @IsArray()
  receivers?: string[];

  @ApiProperty({
    type: Object,
    additionalProperties: {
      type: 'string',
    },
  })
  attributes: {
    [key: string]: string;
  };

  constructor(
    type: EventTypeEnum,
    producer: string,
    scope?: string | number,
    attributes?: { [key: string]: string },
  ) {
    this.type = type;
    this.producer = producer;

    if (scope) {
      this.scope = scope.toString();
    }

    this.attributes = attributes || {};
  }

  addReceivers(...receivers: string[]): Event {
    if (!this.receivers) {
      this.receivers = [];
    }
    this.receivers.push(...receivers);

    return this;
  }

  addAttributesFromServer(server: Server): Event {
    this.attributes.serverName = server.name;
    this.attributes.serverAlias = server.alias;

    return this;
  }

  addReceiversFromServer(server: Server): Event {
    const permission = getRequiredPermissionForEvent(this.type);

    if (permission) {
      this.addReceivers(
        ...server.permissions
          .filter(
            (p) => p.permission === permission || p.permission === 'NOTIFY',
          )
          .map((p) => p.userUuid),
        server.ownerUuid,
      );
    }

    return this;
  }
}
