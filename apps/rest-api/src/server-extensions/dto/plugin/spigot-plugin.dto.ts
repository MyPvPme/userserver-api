import { SpigotPluginYml } from './spigot-plugin-yml.dto';
import { SpigotPluginCommentDto } from './spigot-plugin-comment.dto';

export class SpigotPlugin {
  name?: string;

  fileName?: string;

  version?: string;

  pluginYml?: SpigotPluginYml;

  comment?: SpigotPluginCommentDto;

  extensionId?: number;

  extensionVersionId?: number;

  isInSystem: boolean;
}
