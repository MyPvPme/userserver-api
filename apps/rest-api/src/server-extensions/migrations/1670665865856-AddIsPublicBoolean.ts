import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsPublicBoolean1670665865856 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_extensions',
      new TableColumn({
        name: 'is_public',
        type: 'tinyint',
        default: '0',
      }),
    );

    await queryRunner.query(
      'UPDATE userserver_extensions SET is_public = 1 WHERE is_public = 0',
    );

    await queryRunner.addColumn(
      'userserver_extension_versions',
      new TableColumn({
        name: 'is_public',
        type: 'tinyint',
        default: '0',
      }),
    );

    await queryRunner.query(
      'UPDATE userserver_extension_versions SET is_public = true WHERE is_public = 0',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_extensions', 'is_public');
  }
}
