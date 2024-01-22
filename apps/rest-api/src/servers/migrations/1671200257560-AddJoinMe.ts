import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddJoinMe1671200257560 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'show_join_me',
        type: 'tinyint',
        default: true,
      }),
    );

    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'allow_join_me',
        type: 'tinyint',
        default: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_servers', 'show_join_me');
    await queryRunner.dropColumn('userserver_servers', 'allow_join_me');
  }
}
