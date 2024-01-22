import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreateUsersTable1632044423537 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_users',
        columns: [
          new TableColumn({
            name: 'uuid',
            type: 'varchar',
            isPrimary: true,
            length: '36',
          }),
          new TableColumn({
            name: 'purchased_ram',
            type: 'int',
            unsigned: true,
            default: 0,
          }),
          new TableColumn({
            name: 'purchased_slots',
            type: 'int',
            unsigned: true,
            default: 0,
          }),
          new TableColumn({
            name: 'blocked',
            type: 'boolean',
            default: 0,
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('userserver_users');
  }
}
