import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ChangeStartCommandLength1673197734321
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_versions',
      'start_command',
      new TableColumn({
        name: 'start_command',
        type: 'varchar',
        default:
          '"java -Xms{ram}M -Xmx{ram}M -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -Dfile.encoding=UTF-8 -Dcom.mojang.eula.agree=true -jar ../server.jar nogui"',
        length: '1024',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'userserver_versions',
      'start_command',
      new TableColumn({
        name: 'start_command',
        type: 'varchar',
        default:
          '"java -Xmx{ram}}M -Xms512M -Dfile.encoding=UTF8 -Dlog4j.configurationFile=config.xml -XX:ParallelGCThreads=2 -XX:+AlwaysPreTouch -XX:+DisableExplicitGC -XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:MaxGCPauseMillis=45 -XX:TargetSurvivorRatio=90 -XX:G1NewSizePercent=50 -XX:G1MaxNewSizePercent=80 -XX:InitiatingHeapOccupancyPercent=10 -XX:G1MixedGCLiveThresholdPercent=50 -jar server.jar"',
        length: '512',
      }),
    );
  }
}
