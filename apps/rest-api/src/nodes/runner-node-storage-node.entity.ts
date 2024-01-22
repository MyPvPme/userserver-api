import { IsString } from 'class-validator';
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Type } from 'class-transformer';
import { StorageNode } from './storage-node.entity';
import { RunnerNode } from './runner-node.entity';

@Entity({ name: 'userserver_runner_nodes_storage_nodes' })
export class RunnerNodeStorageNode extends BaseEntity {
  @IsString()
  @PrimaryColumn()
  storageNodeId: string;

  @ManyToOne(
    () => StorageNode,
    (storageNode) => storageNode.runnerNodeStorageNodes,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'storage_node_id' })
  @Type(() => User)
  storageNode: StorageNode;

  @IsString()
  @PrimaryColumn()
  runnerNodeId: string;

  @ManyToOne(
    () => RunnerNode,
    (runnerNode) => runnerNode.runnerNodeStorageNodes,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'runner_node_id' })
  @Type(() => User)
  runnerNode: RunnerNode;
}
