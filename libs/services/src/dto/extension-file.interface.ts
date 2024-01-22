import { FileTypeEnum } from '@userserver-api/services/enums';

export interface ExtensionFileInterface {
  filename: string;
  destination: string;
  type: FileTypeEnum;
}
