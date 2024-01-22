import { Long } from '@grpc/proto-loader';

export interface PluginInterface {
  fileName: string;
  pluginYml: string;
  comment: string;
  crc: Long;
}
