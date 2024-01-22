import { ServerPermissions } from '../server-permissions/server-permissions.enum';

export enum EventTypeEnum {
  //Files
  /**
   * scope: serverID
   * Attributes:
   * path: the path of the file
   */
  FILE_CREATED = 'FILE_CREATED',
  /**
   * scope: serverID
   * Attributes:
   * path: the path of the file
   */
  FILE_DELETED = 'FILE_DELETED',
  /**
   * scope: serverID
   * Attributes:
   * path: the path of the file
   */
  FILE_UPDATED = 'FILE_UPDATED',
  /**
   * scope: serverID
   * Attributes:
   * path: the path of the file
   * name: new name of file
   */
  FILE_RENAMED = 'FILE_RENAMED',
  /**
   * scope: serverID
   * Attributes:
   * path: the path of the folder
   */
  FOLDER_CREATED = 'FOLDER_CREATED',
  /**
   * scope: serverID
   * Attributes:
   * path: the path of the folder
   */
  FOLDER_DELETED = 'FOLDER_DELETED',
  /**
   * scope: serverID
   * Attributes:
   * path: the path of the folder
   */
  FOLDER_RENAMED = 'FOLDER_RENAMED',

  //USERSERVERS
  /**
   * scope: serverID
   * Attributes:
   * owner: The owner of the userserver
   */
  USERSERVER_CREATED = 'USERSERVER_CREATED',
  /**
   * scope: serverID
   * Attributes:
   * owner: The owner of the userserver
   */
  USERSERVER_DELETED = 'USERSERVER_DELETED',
  /**
   * scope: serverID
   * Attributes:
   * owner: The owner of the userserver
   */
  USERSERVER_UPDATED = 'USERSERVER_UPDATED',

  /**
   * scope: serverID
   * Attributes:
   * owner: The owner of the userserver
   */
  USERSERVER_RESET = 'USERSERVER_RESET',

  /**
   * scope: serverID
   * Attributes:
   * count: The player count
   */
  USERSERVER_PLAYER_COUNT_UPDATE = 'USERSERVER_PLAYER_COUNT_UPDATE',

  /**
   * scope: serverID
   * Attributes:
   * owner: The owner of the userserver
   * status: The new status {@link ServerStatus}
   * serverName: The name of the server
   */
  USERSERVER_STATUS_CHANGED = 'USERSERVER_STATUS_CHANGED',
  /**
   * scope: serverID
   * Attributes:
   * owner: The owner of the userserver
   * extensionVersionId: The extension version id who is installed
   */
  USERSERVER_EXTENSION_INSTALLED = 'USERSERVER_EXTENSION_INSTALLED',
  /**
   * scope: serverID
   * Attributes:
   * owner: The owner of the userserver
   * extensionVersionId: The extension version id who is uninstalled
   */
  USERSERVER_EXTENSION_UNINSTALLED = 'USERSERVER_EXTENSION_UNINSTALLED',

  /**
   * scope: domainID
   */
  USERSERVER_DOMAIN_ADDED = 'USERSERVER_DOMAIN_ADDED',

  /**
   * scope: domainID
   */
  USERSERVER_DOMAIN_DELETED = 'USERSERVER_DOMAIN_DELETED',

  /**
   * scope: domainID
   */
  USERSERVER_DOMAIN_EDITED = 'USERSERVER_DOMAIN_EDITED',

  /**
   * scope: domainID
   */
  USERSERVER_DOMAIN_RECORD_CREATED = 'USERSERVER_DOMAIN_RECORD_CREATED',

  /**
   * scope: domainID
   */
  USERSERVER_DOMAIN_RECORD_DELETED = 'USERSERVER_DOMAIN_RECORD_DELETED',

  /**
   * scope: domainRecordId
   * Attributes:
   * serverId: the id of the server
   */
  USERSERVER_DOMAIN_RECORD_CONNECTED = 'USERSERVER_DOMAIN_RECORD_CONNECTED',

  /**
   * scope: domainID
   * Attributes:
   * serverId: the id of the server
   */
  USERSERVER_DOMAIN_RECORD_DISCONNECTED = 'USERSERVER_DOMAIN_RECORD_DISCONNECTED',
  USERSERVER_DOMAIN_RECORD_TRANSFERRED = 'USERSERVER_DOMAIN_RECORD_TRANSFERRED',

  /**
   * scope: serverId
   * Attributes:
   * userUuid: the uuid of the server
   */
  USERSERVER_JOIN_REQUEST = 'USERSERVER_JOIN_REQUEST',

  /**
   * scope: serverId
   * Attributes:
   * permission: The created permission
   */
  USERSERVER_PERMISSION_ADDED = 'USERSERVER_PERMISSION_ADDED',

  /**
   * scope: serverId
   * Attributes:
   * permission: the permission delete dto
   */
  USERSERVER_PERMISSION_REMOVED = 'USERSERVER_PERMISSION_REMOVED',
}

export function getRequiredPermissionForEvent(
  event: EventTypeEnum,
): ServerPermissions | undefined {
  switch (event) {
    case EventTypeEnum.FILE_CREATED:
    case EventTypeEnum.FILE_DELETED:
    case EventTypeEnum.FILE_UPDATED:
    case EventTypeEnum.FILE_RENAMED:
    case EventTypeEnum.FOLDER_CREATED:
    case EventTypeEnum.FOLDER_DELETED:
    case EventTypeEnum.FOLDER_RENAMED:
      return ServerPermissions.PLUGINS;
    case EventTypeEnum.USERSERVER_EXTENSION_UNINSTALLED:
    case EventTypeEnum.USERSERVER_EXTENSION_INSTALLED:
      return ServerPermissions.PLUGINS;
    case EventTypeEnum.USERSERVER_PERMISSION_ADDED:
    case EventTypeEnum.USERSERVER_PERMISSION_REMOVED:
      return ServerPermissions.PERMISSIONS;
    case EventTypeEnum.USERSERVER_DOMAIN_RECORD_TRANSFERRED:
    case EventTypeEnum.USERSERVER_DOMAIN_RECORD_CONNECTED:
    case EventTypeEnum.USERSERVER_DOMAIN_RECORD_DELETED:
    case EventTypeEnum.USERSERVER_DOMAIN_RECORD_CREATED:
      return ServerPermissions.NOTIFY;
    case EventTypeEnum.USERSERVER_STATUS_CHANGED:
      return ServerPermissions.NOTIFY;
    default:
      return undefined;
  }
}
