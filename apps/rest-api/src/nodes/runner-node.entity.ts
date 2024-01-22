import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Server } from '../servers/server.entity';
import { Optional } from '@nestjs/common';
import { BaseEntity, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { RunnerNodeStorageNode } from './runner-node-storage-node.entity';

@Entity({ name: 'userserver_runner_nodes' })
export class RunnerNode extends BaseEntity {
  @PrimaryColumn()
  @IsString()
  id: string;

  @Type(() => Server)
  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(() => Server, (server) => server.runnerNode)
  servers: Server[];

  @Type(() => RunnerNodeStorageNode)
  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(
    () => RunnerNodeStorageNode,
    (runnerNodeStorageNode) => runnerNodeStorageNode.runnerNode,
  )
  runnerNodeStorageNodes: RunnerNodeStorageNode[];
}
