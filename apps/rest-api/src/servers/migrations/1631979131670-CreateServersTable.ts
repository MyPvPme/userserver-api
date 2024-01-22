import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreateServersTable1631979131670 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_servers',
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
            name: 'status',
            type: 'enum',
            enum: [
              'STANDBY',
              'QUEUED',
              'ONLINE',
              'STARTING',
              'STOPPING',
              'OFFLINE',
            ],
            default: "'OFFLINE'",
          }),
          new TableColumn({
            name: 'container_id',
            type: 'varchar',
            isNullable: true,
            default: null,
          }),
          new TableColumn({
            name: 'ip',
            type: 'varchar',
            length: '24',
            isNullable: true,
            default: null,
          }),
          new TableColumn({
            name: 'port',
            type: 'int',
            isNullable: true,
            default: null,
            unsigned: true,
          }),
          new TableColumn({
            name: 'slots',
            default: 5,
            type: 'int',
            unsigned: true,
          }),
          new TableColumn({
            name: 'ram',
            default: 512,
            type: 'int',
            unsigned: true,
          }),
          new TableColumn({
            name: 'name',
            type: 'varchar',
            default: "'MyServer'",
            length: '32',
          }),
          new TableColumn({
            name: 'icon_item',
            type: 'varchar',
            default: "'GRASS:0'",
            length: '24',
          }),
          new TableColumn({
            name: 'description',
            isNullable: true,
            default: null,
            type: 'text',
            length: '256',
          }),
          new TableColumn({
            name: 'alias',
            isNullable: true,
            default: null,
            type: 'varchar',
            length: '16',
          }),
          new TableColumn({
            name: 'created',
            type: 'timestamp',
            default: 'now()',
          }),
          new TableColumn({
            name: 'last_start',
            type: 'timestamp',
            isNullable: true,
            default: null,
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('userserver_servers');
  }
}
