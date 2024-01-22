import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddVersionRelation1633861664159 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'version_name',
        type: 'varchar',
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_servers',
      new TableForeignKey({
        name: 'FK_SERVERS_VERSIONS',
        columnNames: ['version_name'],
        referencedTableName: 'userserver_versions',
        referencedColumnNames: ['name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'userserver_servers',
      'FK_SERVERS_VERSIONS',
    );
  }
}
