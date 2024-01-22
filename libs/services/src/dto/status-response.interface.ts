import {
  ContainerStatsInterface,
  StatusChangeInterface,
} from '@userserver-api/services';

export interface StatusResponseInterface {
  serverId: number;
  statusChange?: StatusChangeInterface;
  stats?: ContainerStatsInterface;
}
