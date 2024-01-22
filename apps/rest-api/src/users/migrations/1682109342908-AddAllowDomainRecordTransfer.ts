import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAllowDomainRecordTransfer1682109342908
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_users',
      new TableColumn({
        name: 'allow_domain_record_transfer',
        type: 'boolean',
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'userserver_users',
      'allow_domain_record_transfer',
    );
  }
}
