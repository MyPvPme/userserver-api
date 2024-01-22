import { ExtensionFileInterface } from '@userserver-api/services';

export interface ExtensionVersionInterface {
  id: number;
  files: ExtensionFileInterface[];
}
