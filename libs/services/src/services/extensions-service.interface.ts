import {
  ExtensionVersionActionInterface,
  OperationStatusResponseInterface,
  PluginsInterface,
  ServerIdInterface,
} from '@userserver-api/services';

export interface ExtensionsServiceInterface {
  installExtensionVersion(
    extensionVersion: ExtensionVersionActionInterface,
  ): OperationStatusResponseInterface;
  uninstallExtensionVersion(
    extensionVersion: ExtensionVersionActionInterface,
  ): OperationStatusResponseInterface;
  getAllSpigotPlugins(serverId: ServerIdInterface): PluginsInterface;
}
