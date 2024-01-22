import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Request } from 'express';
import { FilesService } from './files.service';
import { ServerIdCouldNotBeExtractedException } from '../servers/exceptions/server-id-could-not-be-extracted.exception';
import { Server } from '../servers/server.entity';
import { User } from '../users/user.entity';

// Return decorator with validation pipe

export function GetServerFilePath(
  options: FilePathOptions | FolderPathOptions | AnyPathOptions,
): ParameterDecorator {
  return GetServerFilePathDecorator(options, FilePathValidationPipe);
}

// Decorator for the option extraction

const GetServerFilePathDecorator = createParamDecorator<
  FilePathOptions | FolderPathOptions | AnyPathOptions
>(async (data, ctx: ExecutionContext): Promise<ValidationOptions> => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const path: string = (request.query.path as string) || '';

  const serverId: number = request.server.id;
  if (!serverId)
    throw new ServerIdCouldNotBeExtractedException('Server id not provided');

  const userserver = (request as { server: Server }).server as Server;

  return {
    path: path,
    options: data,
    owner: userserver.owner,
    serverId: serverId,
  };
});

// Pipe for the validation

@Injectable()
export class FilePathValidationPipe implements PipeTransform {
  constructor(private readonly filesService: FilesService) {}

  async transform(value: ValidationOptions): Promise<string> {
    const fullPath = await this.filesService.getFullPath(
      value.path,
      value.serverId,
      value.options.mustExists,
      value.options.type,
      value.options.shouldNotExist,
    );

    if (value.options.type === 'FILE' && value.options.methode) {
      this.filesService.checkPermissionsForFile(
        value.owner,
        fullPath,
        value.options.methode,
      );
    }

    return fullPath;
  }
}

// Types for the Options

type ValidationOptions = {
  path: string;
  owner: User;
  serverId: number;
  options: FilePathOptions | FolderPathOptions | AnyPathOptions;
};

type FilePathOptions = {
  mustExists?: boolean;
  shouldNotExist?: boolean;
  type: 'FILE';
  methode: 'VIEW' | 'EDIT' | 'CREATE' | 'DELETE';
};

type FolderPathOptions = {
  mustExists?: boolean;
  shouldNotExist?: boolean;
  type: 'FOLDER';
};

type AnyPathOptions = {
  mustExists?: boolean;
  shouldNotExist?: boolean;
  type: 'ANY';
};
