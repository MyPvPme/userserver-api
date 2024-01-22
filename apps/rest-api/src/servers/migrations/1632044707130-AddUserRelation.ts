import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddUserRelation1632044707130 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_servers',
      new TableColumn({
        name: 'owner_uuid',
        type: 'varchar',
        length: '36',
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_servers',
      new TableForeignKey({
        name: 'FK_SERVERS_USERS',
        columnNames: ['owner_uuid'],
        referencedTableName: 'userserver_users',
        referencedColumnNames: ['uuid'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_servers', 'owner_uuid');
    await queryRunner.dropForeignKey(
      'userserver_servers',
      'FK_USERSERVER_SERVERS_USERS',
    );
  }
}
