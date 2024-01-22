import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ChangeIconMaterial1673706132328 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_servers',
      'icon_item',
      new TableColumn({
        name: 'icon_item',
        type: 'varchar',
        default: "'GRASS_BLOCK'",
        length: '40',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_servers',
      'icon_item',
      new TableColumn({
        name: 'icon_item',
        type: 'varchar',
        default: "'GRASS:0'",
        length: '24',
      }),
    );
  }
}
