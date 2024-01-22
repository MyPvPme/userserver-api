import { IsUUID } from 'class-validator';

export class TransferServerDomainRecordDto {
  @IsUUID()
  receiverUuid: string;
}
