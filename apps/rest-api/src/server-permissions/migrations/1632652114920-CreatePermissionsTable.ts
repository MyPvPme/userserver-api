import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreatePermissionsTable1632652114920 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_server_permissions',
        columns: [
          new TableColumn({
            name: 'user_uuid',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          }),
          new TableColumn({
            name: 'server_id',
            type: 'int',
            unsigned: true,
            isPrimary: true,
          }),

          new TableColumn({
            name: 'permission',
            type: 'enum',
            enum: [
              'START',
              'STOP',
              'KILL',
              'VIEW',
              'ALIAS',
              'DESCRIPTION',
              'ICON',
              'NAME',
              'NOTIFY',
              'PERMISSIONS',
              'PLUGINS',
              'SERVER_PROPERTIES',
              'TERMINAL',
            ],
            isPrimary: true,
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('userserver_server_permissions');
  }
}
