import { OperationStatusResponseInterface } from '@userserver-api/services/dto/operation-status-response.interface';

export interface StartContainerResponseInterface
  extends OperationStatusResponseInterface {
  containerId?: string;
}
