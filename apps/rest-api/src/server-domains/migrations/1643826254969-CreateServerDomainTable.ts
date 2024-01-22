import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreateServerDomainTable1643826254969
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_domains',
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
            name: 'domain',
            type: 'varchar',
          }),
          new TableColumn({
            name: 'permission',
            type: 'varchar',
          }),
          new TableColumn({
            name: 'created',
            type: 'timestamp',
            default: 'now()',
          }),
          new TableColumn({
            name: 'deleted',
            type: 'timestamp',
            isNullable: true,
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('userserver_domains');
  }
}
