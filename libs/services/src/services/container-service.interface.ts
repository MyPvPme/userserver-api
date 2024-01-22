import { Observable } from 'rxjs';
import {
  ContainersListInterface,
  ExecCommandToContainerInterface,
  OperationStatusResponseInterface,
  StartContainerInterface,
  StartContainerResponseInterface,
  StatusResponseInterface,
  StopContainerInterface,
  ConsoleDataInterface,
  NodeStatsInterface,
} from '@userserver-api/services';
import { Metadata } from '@grpc/grpc-js';

export interface ContainersServiceInterface {
  getStatus(): Observable<StatusResponseInterface>;

  startContainer(
    startContainer: StartContainerInterface,
  ): StartContainerResponseInterface;

  stopContainer(
    stopContainer: StopContainerInterface,
  ): OperationStatusResponseInterface;

  execCommandToContainer(
    execCommandToContainer: ExecCommandToContainerInterface,
  ): OperationStatusResponseInterface;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRunningContainers(any: any): ContainersListInterface;

  attachToContainer(
    data: Observable<ConsoleDataInterface>,
    metadata: Metadata,
  ): Observable<ConsoleDataInterface>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getNodeStats(any: any): NodeStatsInterface;
}
