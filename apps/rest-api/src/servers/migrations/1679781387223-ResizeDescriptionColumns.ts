import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ResizeDescriptionColumns1679781387223
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_servers',
      'short_description',
      new TableColumn({
        name: 'short_description',
        type: 'varchar',
        length: '1024',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'userserver_servers',
      'description',
      new TableColumn({
        name: 'description',
        isNullable: true,
        default: null,
        type: 'text',
        length: '32768',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_servers',
      'short_description',
      new TableColumn({
        name: 'short_description',
        type: 'varchar',
        length: '59',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'userserver_servers',
      'description',
      new TableColumn({
        name: 'description',
        isNullable: true,
        default: null,
        type: 'text',
        length: '256',
      }),
    );
  }
}
