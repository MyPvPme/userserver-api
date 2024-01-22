import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddNodes1684056098860 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('userserver_servers', [
      new TableColumn({
        name: 'runner_node_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'storage_node_id',
        type: 'varchar',
        isNullable: false,
        default: '"MYPVP-USERSERVER-2"',
      }),
    ]);

    await queryRunner.createForeignKey(
      'userserver_servers',
      new TableForeignKey({
        name: 'FK_SERVER_RUNNER_NODE',
        columnNames: ['runner_node_id'],
        referencedTableName: 'userserver_runner_nodes',
        referencedColumnNames: ['id'],
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_servers',
      new TableForeignKey({
        name: 'FK_SERVER_STORAGE_NODE',
        columnNames: ['storage_node_id'],
        referencedTableName: 'userserver_storage_nodes',
        referencedColumnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'userserver_servers',
      'FK_SERVER_RUNNER_NODE',
    );
    await queryRunner.dropForeignKey(
      'userserver_servers',
      'FK_SERVER_STORAGE_NODE',
    );

    await queryRunner.dropColumns('userserver_servers', [
      'storage_node_id',
      'runner_node_id',
    ]);
  }
}
