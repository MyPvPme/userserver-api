import { PartialType } from '@nestjs/swagger';
import { CreateServerDomainDto } from './create-server-domain.dto';

export class EditServerDomainDto extends PartialType(CreateServerDomainDto) {}
