import { Module } from '@nestjs/common';
import { ServerDomainsController } from './server-domains.controller';
import { ServerDomainsService } from './server-domains.service';

@Module({
  controllers: [ServerDomainsController],
  providers: [ServerDomainsService],
})
export class ServerDomainsModule {}
