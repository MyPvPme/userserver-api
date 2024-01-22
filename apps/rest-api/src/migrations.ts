import { CreateUsersTable1632044423537 } from './users/migrations/1632044423537-CreateUsersTable';
import { CreateServersTable1631979131670 } from './servers/migrations/1631979131670-CreateServersTable';
import { AddUserRelation1632044707130 } from './servers/migrations/1632044707130-AddUserRelation';
import { AddVersionRelation1633861664159 } from './servers/migrations/1633861664159-AddVersionRelation';
import { CreatServerVersionsTable1633855655764 } from './server-versions/migrations/1633855655764-CreatServerVersionsTable';
import { CreatePermissionsTable1632652114920 } from './server-permissions/migrations/1632652114920-CreatePermissionsTable';
import { CreatePermissionsForeignKeys1633857730615 } from './server-permissions/migrations/1633857730615-CreatePermissionsForeignKeys';
import { CreateExtensionsTables1634375201251 } from './server-extensions/migrations/1634375201251-CreateExtensionsTables';
import { TokenCreation1602966744729 } from './auth/migrations/1602966744729-TokenCreation';
import { RemoveFileColumn1642929673504 } from './server-versions/migrations/1642929673504-RemoveFileColumn';
import { AddStartCommandColumn1642929681757 } from './server-versions/migrations/1642929681757-AddStartCommandColumn';
import { CreateServerDomainTable1643826254969 } from './server-domains/migrations/1643826254969-CreateServerDomainTable';
import { CreateServerDomainRecordTable1643826785360 } from './server-domains/migrations/1643826785360-CreateServerDomainRecordTable';
import { AddArchivStatus1646474005299 } from './servers/migrations/1646474005299-AddArchivStatus';
import { AddInstalls1648840749938 } from './server-extensions/migrations/1648840749938-AddInstalls';
import { AddPlayerCount1649362041171 } from './servers/migrations/1649362041171-AddPlayerCount';
import { RemoveContainerId1649361628313 } from './servers/migrations/1649361628313-RemoveContainerId';
import { RemoveIp1649361595758 } from './servers/migrations/1649361595758-RemoveIp';
import { RemovePort1649361655957 } from './servers/migrations/1649361655957-RemovePort';
import { AddDeletedAtColumn1649416081842 } from './servers/migrations/1649416081842-AddDeletedAtColumn';
import { CreateUserSessionsTable1649535060398 } from './user-sessions/migrations/1649535060398-CreateUserSessionsTable';
import { AddServerSettings1650376644860 } from './servers/migrations/1650376644860-AddServerSettings';
import { AddShortDescription1660470231970 } from './servers/migrations/1660470231970-AddShortDescription';
import { AddJoinMe1671200257560 } from './servers/migrations/1671200257560-AddJoinMe';
import { ChangeStartCommandLength1673197734321 } from './server-versions/migrations/1673197734321-ChangeStartCommandLength';
import { ChangeIconMaterial1673706132328 } from './servers/migrations/1673706132328-ChangeIconMaterial';
import { AddIsPublicBoolean1670665865856 } from './server-extensions/migrations/1670665865856-AddIsPublicBoolean';
import { ResizeDescriptionColumns1679781387223 } from './servers/migrations/1679781387223-ResizeDescriptionColumns';
import { AddAllowDomainRecordTransfer1682109342908 } from './users/migrations/1682109342908-AddAllowDomainRecordTransfer';
import { AddFilesPermission1682721373007 } from './server-permissions/migrations/1682721373007-AddFilesPermission';
import { CreateNodeTables1684055029014 } from './nodes/migrations/1684055029014-CreateNodeTables';
import { AddNodes1684056098860 } from './servers/migrations/1684056098860-AddNodes';

export const migrations = [
  CreateUsersTable1632044423537,
  CreateServersTable1631979131670,
  AddUserRelation1632044707130,
  AddVersionRelation1633861664159,
  CreatServerVersionsTable1633855655764,
  CreatePermissionsTable1632652114920,
  CreatePermissionsForeignKeys1633857730615,
  CreateExtensionsTables1634375201251,
  TokenCreation1602966744729,
  RemoveFileColumn1642929673504,
  AddStartCommandColumn1642929681757,
  CreateServerDomainTable1643826254969,
  CreateServerDomainRecordTable1643826785360,
  AddArchivStatus1646474005299,
  AddInstalls1648840749938,
  RemoveContainerId1649361628313,
  RemoveIp1649361595758,
  RemovePort1649361655957,
  AddPlayerCount1649362041171,
  AddDeletedAtColumn1649416081842,
  CreateUserSessionsTable1649535060398,
  AddServerSettings1650376644860,
  AddShortDescription1660470231970,
  AddJoinMe1671200257560,
  ChangeStartCommandLength1673197734321,
  ChangeIconMaterial1673706132328,
  AddIsPublicBoolean1670665865856,
  ResizeDescriptionColumns1679781387223,
  AddAllowDomainRecordTransfer1682109342908,
  AddFilesPermission1682721373007,
  CreateNodeTables1684055029014,
  AddNodes1684056098860,
];
