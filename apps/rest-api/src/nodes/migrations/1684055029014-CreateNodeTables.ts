import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateNodeTables1684055029014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_runner_nodes',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'userserver_storage_nodes',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'userserver_runner_nodes_storage_nodes',
        columns: [
          new TableColumn({
            name: 'storage_node_id',
            type: 'varchar',
            isPrimary: true,
          }),
          new TableColumn({
            name: 'runner_node_id',
            type: 'varchar',
            isPrimary: true,
          }),
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_runner_nodes_storage_nodes',
      new TableForeignKey({
        name: 'FK_USERSERVER_RUNNER_NODES_STORAGE_NODES_STORAGE_NODES',
        columnNames: ['storage_node_id'],
        referencedTableName: 'userserver_storage_nodes',
        referencedColumnNames: ['id'],
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_runner_nodes_storage_nodes',
      new TableForeignKey({
        name: 'FK_USERSERVER_RUNNER_NODES_STORAGE_NODES_RUNNER_NODES',
        columnNames: ['runner_node_id'],
        referencedTableName: 'userserver_runner_nodes',
        referencedColumnNames: ['id'],
      }),
    );

    await queryRunner.query(
      'INSERT INTO userserver_storage_nodes (id) VALUES (?)',
      ['MYPVP-USERSERVER-2'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'userserver_runner_nodes_storage_nodes',
      'FK_USERSERVER_RUNNER_NODES_STORAGE_NODES_STORAGE_NODES',
    );
    await queryRunner.dropForeignKey(
      'userserver_runner_nodes_storage_nodes',
      'FK_USERSERVER_RUNNER_NODES_STORAGE_NODES_RUNNER_NODES',
    );

    await queryRunner.dropTable('userserver_runner_nodes_storage_nodes');
    await queryRunner.dropTable('userserver_storage_nodes');
    await queryRunner.dropTable('userserver_runner_nodes');
  }
}
