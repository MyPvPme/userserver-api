export enum ServerStatus {
  QUEUED = 'QUEUED',
  ONLINE = 'ONLINE',
  STARTING = 'STARTING',
  STOPPING = 'STOPPING',
  OFFLINE = 'OFFLINE',
  ARCHIVING = 'ARCHIVING',
  ARCHIVED = 'ARCHIVED',
  RESTORING = 'RESTORING',
}

export const AllServerStatus = Object.keys(ServerStatus) as ServerStatus[];
