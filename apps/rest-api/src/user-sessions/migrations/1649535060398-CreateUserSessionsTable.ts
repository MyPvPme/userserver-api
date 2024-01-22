import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateUserSessionsTable1649535060398
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_user_sessions',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'int',
            unsigned: true,
            generationStrategy: 'increment',
            isPrimary: true,
            isGenerated: true,
          }),
          new TableColumn({
            name: 'server_id',
            type: 'int',
            unsigned: true,
          }),
          new TableColumn({
            name: 'user_uuid',
            type: 'varchar',
            length: '36',
          }),
          new TableColumn({
            name: 'start_date',
            type: 'datetime',
          }),
          new TableColumn({
            name: 'end_date',
            type: 'datetime',
          }),
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_user_sessions',
      new TableForeignKey({
        name: 'FK_USERSERVER_USER_SESSIONS_USER',
        columnNames: ['user_uuid'],
        onDelete: 'CASCADE',
        referencedTableName: 'userserver_users',
        referencedColumnNames: ['uuid'],
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_user_sessions',
      new TableForeignKey({
        name: 'FK_USERSERVER_USER_SESSIONS_SERVER',
        columnNames: ['server_id'],
        onDelete: 'CASCADE',
        referencedTableName: 'userserver_servers',
        referencedColumnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'userserver_user_sessions',
      'FK_USERSERVER_USER_SESSIONS_USER',
    );
    await queryRunner.dropForeignKey(
      'userserver_user_sessions',
      'FK_USERSERVER_USER_SESSIONS_SERVER',
    );
    await queryRunner.dropTable('userserver_user_sessions');
  }
}
