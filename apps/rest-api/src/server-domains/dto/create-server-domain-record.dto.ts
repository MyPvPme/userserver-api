import { PickType } from '@nestjs/swagger';
import { ServerDomainRecord } from '../server-domain-record.entity';

export class CreateServerDomainRecordDto extends PickType(ServerDomainRecord, [
  'record',
  'domainId',
]) {
  toServerDomainRecord(): ServerDomainRecord {
    const record = new ServerDomainRecord();
    record.record = this.record;
    record.domainId = this.domainId;

    return record;
  }
}
