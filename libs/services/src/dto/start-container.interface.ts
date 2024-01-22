import * as Long from 'long';

export interface StartContainerInterface {
  serverId: number;
  ram?: Long;
  startCommand: string;
  image: string;
  env: { [key: string]: string };
  storageNode: string;
}
