import { Long } from '@grpc/proto-loader';

export interface NodeStatsInterface {
  totalRam: Long;
  freeRam: Long;
  cpuUsage: Long;
}
