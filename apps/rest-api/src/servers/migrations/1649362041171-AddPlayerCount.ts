import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPlayerCount1649362041171 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'player_count',
        type: 'int',
        default: 0,
        unsigned: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_servers', 'player_count');
  }
}
