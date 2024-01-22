import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateServerDomainRecordTable1643826785360
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_domain_records',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'int',
            unsigned: true,
            isGenerated: true,
            generationStrategy: 'increment',
            isPrimary: true,
          }),
          new TableColumn({
            name: 'record',
            type: 'varchar',
          }),
          new TableColumn({
            name: 'owner_uuid',
            type: 'varchar',
          }),
          new TableColumn({
            name: 'connected_server_id',
            type: 'int',
            unsigned: true,
            isNullable: true,
          }),
          new TableColumn({
            name: 'domain_id',
            type: 'int',
            unsigned: true,
          }),
          new TableColumn({
            name: 'created',
            type: 'timestamp',
            default: 'now()',
          }),
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_domain_records',
      new TableForeignKey({
        name: 'FK_DOMAIN_RECORD_USER',
        columnNames: ['owner_uuid'],
        referencedTableName: 'userserver_users',
        referencedColumnNames: ['uuid'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_domain_records',
      new TableForeignKey({
        name: 'FK_DOMAIN_RECORD_SERVER',
        columnNames: ['connected_server_id'],
        referencedTableName: 'userserver_servers',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_domain_records',
      new TableForeignKey({
        name: 'FK_DOMAIN_RECORD_DOMAIN',
        columnNames: ['domain_id'],
        referencedTableName: 'userserver_domains',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'userserver_domain_records',
      'FK_DOMAIN_RECORD_USER',
    );
    await queryRunner.dropForeignKey(
      'userserver_domain_records',
      'FK_DOMAIN_RECORD_SERVER',
    );
    await queryRunner.dropForeignKey(
      'userserver_domain_records',
      'FK_DOMAIN_RECORD_DOMAIN',
    );

    await queryRunner.dropTable('userserver_domain_records');
  }
}
