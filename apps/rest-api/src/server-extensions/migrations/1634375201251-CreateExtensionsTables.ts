import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateExtensionsTables1634375201251 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userserver_extensions',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'int',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          }),
          new TableColumn({
            name: 'name',
            type: 'varchar',
          }),
          new TableColumn({
            name: 'type',
            type: 'enum',
            enum: ['SYSTEM', 'WORLDEDITING', 'SKRIPT', 'MINI_GAME'],
          }),
          new TableColumn({
            name: 'permission',
            type: 'varchar',
            default: '"default"',
          }),
          new TableColumn({
            name: 'menu_item',
            type: 'varchar',
            default: '"STONE:0"',
          }),
          new TableColumn({
            name: 'deprecated_thru_id',
            type: 'int',
            isNullable: true,
            unsigned: true,
          }),
          new TableColumn({
            name: 'deleted_at',
            type: 'timestamp',
            default: 'NULL',
            isNullable: true,
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'userserver_extensions_versions_versions',
        columns: [
          new TableColumn({
            name: 'version_name',
            type: 'varchar',
            isPrimary: true,
          }),
          new TableColumn({
            name: 'extension_version_id',
            type: 'int',
            unsigned: true,
            isPrimary: true,
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'userserver_extension_versions',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'int',
            generationStrategy: 'increment',
            isPrimary: true,
            unsigned: true,
            isGenerated: true,
          }),
          new TableColumn({
            name: 'version',
            type: 'varchar',
          }),
          new TableColumn({
            name: 'server_extension_id',
            type: 'int',
            unsigned: true,
          }),
          new TableColumn({
            name: 'released',
            type: 'timestamp',
            default: 'now()',
          }),
          new TableColumn({
            name: 'deleted_at',
            type: 'timestamp',
            default: 'NULL',
            isNullable: true,
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'userserver_extension_files',
        columns: [
          new TableColumn({
            name: 'name',
            type: 'varchar',
            isPrimary: true,
          }),
          new TableColumn({
            name: 'extension_version_id',
            type: 'int',
            unsigned: true,
            isPrimary: true,
          }),
          new TableColumn({
            name: 'type',
            type: 'enum',
            enum: ['FILE', 'FOLDER'],
          }),
          new TableColumn({
            name: 'path',
            type: 'varchar',
          }),
          new TableColumn({
            name: 'checksum',
            type: 'int',
            unsigned: true,
            isNullable: true,
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'userserver_extension_version_depends',
        columns: [
          new TableColumn({
            name: 'extension_version',
            type: 'int',
            unsigned: true,
            isPrimary: true,
          }),
          new TableColumn({
            name: 'depend_extension_version',
            type: 'int',
            unsigned: true,
            isPrimary: true,
          }),
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'userserver_extension_version_depends',
      new TableForeignKey({
        name: 'FK_USERSERVER_EXTENSION_VERSION_DEPENDS_VERSION',
        columnNames: ['extension_version'],
        referencedColumnNames: ['id'],
        referencedTableName: 'userserver_extension_versions',
      }),
    );
    await queryRunner.createForeignKey(
      'userserver_extension_version_depends',
      new TableForeignKey({
        name: 'FK_USERSERVER_EXTENSION_VERSION_DEPENDS_VERSION_DEPEND',
        columnNames: ['depend_extension_version'],
        referencedColumnNames: ['id'],
        referencedTableName: 'userserver_extension_versions',
      }),
    );
    await queryRunner.createForeignKey(
      'userserver_extension_files',
      new TableForeignKey({
        name: 'FK_USERSERVER_EXTENSION_FILE_EXTENSION_VERSION',
        columnNames: ['extension_version_id'],
        referencedTableName: 'userserver_extension_versions',
        referencedColumnNames: ['id'],
      }),
    );
    await queryRunner.createForeignKey(
      'userserver_extensions',
      new TableForeignKey({
        name: 'FK_USERSERVER_EXTENSIONS_DEPRECATED_THRU',
        columnNames: ['deprecated_thru_id'],
        referencedTableName: 'userserver_extensions',
        referencedColumnNames: ['id'],
      }),
    );
    await queryRunner.createForeignKey(
      'userserver_extensions_versions_versions',
      new TableForeignKey({
        name: 'FK_USERSERVER_EXTENSIONS_VERSIONS_VERSIONS',
        columnNames: ['extension_version_id'],
        referencedTableName: 'userserver_extension_versions',
        referencedColumnNames: ['id'],
      }),
    );
    await queryRunner.createForeignKey(
      'userserver_extensions_versions_versions',
      new TableForeignKey({
        name: 'FK_USERSERVER_EXTENSIONS_VERSIONS_VERSION',
        columnNames: ['version_name'],
        referencedTableName: 'userserver_versions',
        referencedColumnNames: ['name'],
      }),
    );
    await queryRunner.createForeignKey(
      'userserver_extension_versions',
      new TableForeignKey({
        name: 'FK_USERSERVER_EXTENSION_VERSIONS_EXTENSIONS',
        columnNames: ['server_extension_id'],
        referencedTableName: 'userserver_extensions',
        referencedColumnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'userserver_extension_version_depends',
      'FK_USERSERVER_EXTENSION_VERSION_DEPENDS_VERSION',
    );
    await queryRunner.dropForeignKey(
      'userserver_extension_version_depends',
      'FK_USERSERVER_EXTENSION_VERSION_DEPENDS_VERSION_DEPEND',
    );
    await queryRunner.dropForeignKey(
      'userserver_extension_files',
      'FK_USERSERVER_EXTENSION_FILE_EXTENSION_VERSION',
    );
    await queryRunner.dropForeignKey(
      'userserver_extensions',
      'FK_USERSERVER_EXTENSIONS_DEPRECATED_THRU',
    );
    await queryRunner.dropForeignKey(
      'userserver_extensions_versions',
      'FK_USERSERVER_EXTENSIONS_VERSIONS_EXTENSION',
    );
    await queryRunner.dropForeignKey(
      'userserver_extensions_versions',
      'FK_USERSERVER_EXTENSIONS_VERSIONS_VERSION',
    );
    await queryRunner.dropForeignKey(
      'userserver_extension_versions',
      'FK_USERSERVER_EXTENSION_VERSIONS_EXTENSIONS',
    );

    await queryRunner.dropTable('userserver_extension_version_depends');
    await queryRunner.dropTable('userserver_extension_files');
    await queryRunner.dropTable('userserver_extension_versions');
    await queryRunner.dropTable('userserver_extensions_versions');
    await queryRunner.dropTable('userserver_extensions');
  }
}
