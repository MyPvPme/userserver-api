import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateUserPurchasesTable1687554387654
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_user_purchases',
        columns: [
          new TableColumn({
            type: 'int',
            isPrimary: true,
            name: 'id',
            unsigned: true,
            isGenerated: true,
          }),
          new TableColumn({
            type: 'varchar',
            name: 'user_uuid',
            length: '36',
          }),
          new TableColumn({
            type: 'enum',
            name: 'type',
            enum: ['RAM'],
          }),
          new TableColumn({
            type: 'int',
            name: 'amount',
          }),
          new TableColumn({
            type: 'datetime',
            name: 'created_at',
            default: 'NOW()',
          }),
          new TableColumn({
            type: 'datetime',
            name: 'expires_at',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'userserver_user_purchases',
      new TableForeignKey({
        name: 'FK_USER_PURCHASES_USER',
        columnNames: ['user_uuid'],
        referencedTableName: 'userserver_users',
        referencedColumnNames: ['uuid'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'userserver_user_purchases',
      'FK_USER_PURCHASES_USER',
    );

    await queryRunner.dropTable('userserver_user_purchases');
  }
}
