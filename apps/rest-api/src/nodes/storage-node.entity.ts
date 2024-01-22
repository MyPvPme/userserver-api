import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Optional } from '@nestjs/common';
import { Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { RunnerNodeStorageNode } from './runner-node-storage-node.entity';
import { Server } from '../servers/server.entity';

@Entity({ name: 'userserver_storage_nodes' })
export class StorageNode {
  @PrimaryColumn()
  @IsString()
  id: string;

  @Type(() => Server)
  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(() => Server, (server) => server.storageNode)
  servers: Server[];

  @Type(() => RunnerNodeStorageNode)
  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(
    () => RunnerNodeStorageNode,
    (runnerNodeStorageNode) => runnerNodeStorageNode.storageNode,
  )
  runnerNodeStorageNodes: RunnerNodeStorageNode[];
}
