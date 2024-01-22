import { MigrationInterface, QueryRunner } from 'typeorm';

export class TokenCreation1602966744729 implements MigrationInterface {
  name = 'TokenCreation1602966744729';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `userserver_api_tokens` (`token` varchar(255) NOT NULL, `uuid` varchar(255) NOT NULL, `created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`token`)) ENGINE=InnoDB',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `userserver_api_tokens`');
  }
}
