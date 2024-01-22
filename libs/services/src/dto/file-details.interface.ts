import { FileTypeEnum } from '@userserver-api/services/enums';
import { Long } from '@grpc/proto-loader';

export interface FileDetailsInterface {
  exists: boolean;
  size: Long;
  name: string;
  path: string;
  fileType: FileTypeEnum;
  /**
   * Is zero if no date was provided
   */
  changed: Long;
  /**
   * Is zero if no date was provided
   */
  created: Long;
}
