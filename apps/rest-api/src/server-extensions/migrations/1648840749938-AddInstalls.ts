import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddInstalls1648840749938 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_extension_versions',
      new TableColumn({
        name: 'installs',
        type: 'int',
        default: '0',
        unsigned: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_extension_versions', 'installs');
  }
}
