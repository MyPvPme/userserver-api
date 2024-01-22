import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemovePort1649361655957 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_servers', 'port');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'port',
        type: 'int',
        isNullable: true,
        default: null,
        unsigned: true,
      }),
    );
  }
}
