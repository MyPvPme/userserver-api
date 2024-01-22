import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddShortDescription1660470231970 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'short_description',
        type: 'varchar',
        length: '59',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_servers', 'short_description');
  }
}
