import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveIp1649361595758 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_servers', 'ip');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'ip',
        type: 'varchar',
        length: '24',
        isNullable: true,
        default: null,
      }),
    );
  }
}
