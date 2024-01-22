import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreatServerVersionsTable1633855655764
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_versions',
        columns: [
          new TableColumn({
            name: 'name',
            type: 'varchar',
            isPrimary: true,
          }),
          new TableColumn({
            name: 'image',
            type: 'varchar',
          }),
          new TableColumn({
            name: 'file',
            type: 'varchar',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('userserver_versions');
  }
}
