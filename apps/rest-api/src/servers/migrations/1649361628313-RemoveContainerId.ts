import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveContainerId1649361628313 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_servers', 'container_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'container_id',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }
}
