import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveFileColumn1642929673504 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_versions', 'file');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_versions',
      new TableColumn({
        name: 'file',
        type: 'varchar',
      }),
    );
  }
}
