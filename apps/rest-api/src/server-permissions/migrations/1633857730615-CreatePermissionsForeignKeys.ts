import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class CreatePermissionsForeignKeys1633857730615
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      'userserver_server_permissions',
      new TableForeignKey({
        name: 'FK_SERVER_PERMISSIONS_USERS',
        columnNames: ['user_uuid'],
        referencedTableName: 'userserver_users',
        referencedColumnNames: ['uuid'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_server_permissions',
      new TableForeignKey({
        name: 'FK_SERVER_PERMISSIONS_SERVERS',
        columnNames: ['server_id'],
        referencedTableName: 'userserver_servers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'userserver_server_permissions',
      'FK_SERVER_PERMISSIONS_USERS',
    );
    await queryRunner.dropForeignKey(
      'userserver_server_permissions',
      'FK_SERVER_PERMISSIONS_SERVERS',
    );
  }
}
