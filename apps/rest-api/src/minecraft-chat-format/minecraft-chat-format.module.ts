import { Module } from '@nestjs/common';
import { MinecraftChatFormatService } from './minecraft-chat-format.service';

@Module({
  providers: [MinecraftChatFormatService],
  exports: [MinecraftChatFormatService],
})
export class MinecraftChatFormatModule {}
