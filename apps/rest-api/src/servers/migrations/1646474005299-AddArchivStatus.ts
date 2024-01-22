import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddArchivStatus1646474005299 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_servers',
      'status',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: [
          'QUEUED',
          'ONLINE',
          'STARTING',
          'STOPPING',
          'OFFLINE',
          'ARCHIVING',
          'ARCHIVED',
          'RESTORING',
        ],
        default: "'OFFLINE'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_servers',
      'status',
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
    );
  }
}
