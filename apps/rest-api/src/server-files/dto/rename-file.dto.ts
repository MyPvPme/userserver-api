import { IsString, Validate } from 'class-validator';
import { NoSlashValidator } from '../validation/no-slash.validator';

export class RenameFileDto {
  /**
   * The new file name
   */
  @Validate(NoSlashValidator)
  @IsString()
  name: string;
}
