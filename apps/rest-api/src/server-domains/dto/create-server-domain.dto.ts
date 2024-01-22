import { PickType } from '@nestjs/swagger';
import { ServerDomain } from '../server-domain.entity';

export class CreateServerDomainDto extends PickType(ServerDomain, [
  'domain',
  'permission',
]) {
  toServerDomain(): ServerDomain {
    const serverDomain = new ServerDomain();

    serverDomain.domain = this.domain;
    serverDomain.permission = this.permission;

    return serverDomain;
  }
}
