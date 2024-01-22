import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStartCommandColumn1642929681757 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'userserver_versions',
      new TableColumn({
        name: 'start_command',
        type: 'varchar',
        default:
          '"java -Xmx{ram}}M -Xms512M -Dfile.encoding=UTF8 -Dlog4j.configurationFile=config.xml -XX:ParallelGCThreads=2 -XX:+AlwaysPreTouch -XX:+DisableExplicitGC -XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:MaxGCPauseMillis=45 -XX:TargetSurvivorRatio=90 -XX:G1NewSizePercent=50 -XX:G1MaxNewSizePercent=80 -XX:InitiatingHeapOccupancyPercent=10 -XX:G1MixedGCLiveThresholdPercent=50 -jar server.jar"',
        length: '512',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('userserver_versions', 'start_command');
  }
}
