import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFilesPermission1682721373007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_server_permissions',
      'permission',
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
          'FILES',
        ],
        isPrimary: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_server_permissions',
      'permission',
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
    );
  }
}
