import { OperationStatusEnum } from '@userserver-api/services/enums';

export interface OperationStatusResponseInterface {
  operationStatus: OperationStatusEnum;
  sentryEventId?: string;
}
