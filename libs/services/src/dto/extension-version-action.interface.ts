import {
  ExtensionVersionInterface,
  ServerIdInterface,
} from '@userserver-api/services';

export interface ExtensionVersionActionInterface {
  serverId: ServerIdInterface;
  extensionVersion: ExtensionVersionInterface;
}
