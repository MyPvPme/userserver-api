import { Long } from '@grpc/proto-loader';

export interface ContainerStatsInterface {
  ram: Long;
  cpu: number;
}
