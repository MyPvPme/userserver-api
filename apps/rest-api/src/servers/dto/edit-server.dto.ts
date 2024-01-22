import { PartialType } from '@nestjs/swagger';
import { CreateServerDto } from './create-server.dto';

export class EditServerDto extends PartialType(CreateServerDto) {}
