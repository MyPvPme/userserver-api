import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddServerSettings1650376644860 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'public_status_announce',
        type: 'tinyint',
        default: false,
      }),
    );
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'standby',
        type: 'tinyint',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'userserver_servers',
      'public_status_announce',
    );
    await queryRunner.dropColumn('userserver_servers', 'standby');
  }
}
