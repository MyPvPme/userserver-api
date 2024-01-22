import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetServerFilePath } from './get-server-file-path.decorator';
import { ReturnFileDto } from './dto/return-file.dto';
import { Response } from 'express';
import { RenameFileDto } from './dto/rename-file.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserserverApiAuthGuard } from '@mypvp/userserver-api-auth';
import { FileDoseNotExistsException } from './exceptions/file-dose-not-exists.exception';
import { FileOperationIsNotAllowedException } from './exceptions/file-operation-is-not-allowes.exception';
import { FileAlreadyExistsException } from './exceptions/file-already-exists.exception';
import { ThrowsExceptions } from '../common/throws-exceptions.decorator';
import { ServerIdCouldNotBeExtractedException } from '../servers/exceptions/server-id-could-not-be-extracted.exception';
import { HasServerPermission } from '../server-permissions/has-server-permission.decorator';
import { HasContext } from '../common/has-context.decorator';
import { GetServer } from '../servers/get-server.decorator';
import { Server } from '../servers/server.entity';
import { ServerPermissions } from '../server-permissions/server-permissions.enum';
import { GetUser } from '../users/get-user.decorator';
import { User } from '../users/user.entity';
import { PlainBodyDecorator } from '../common/plain-body.decorator';
import { LoadServerInterceptor } from '../servers/server.interceptor';
import { UploadFileDto } from './dto/upload-file.dto';
import { ServerIdOrAliasParam } from '../servers/server-id-or-alias-param.decorator';
import { OptionalUserContext } from '@mypvp/userserver-api-auth/dist/optional-user-context.decorator';
import * as Multer from 'multer';

@ApiTags('files')
@ApiCookieAuth()
@ApiBearerAuth()
@Controller(':serverIdOrAlias/files')
@UseGuards(UserserverApiAuthGuard())
@UseInterceptors(LoadServerInterceptor)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ServerIdOrAliasParam()
  @ApiQuery({ name: 'path', type: String, required: false })
  async getFiles(
    @GetServerFilePath({ mustExists: true, type: 'FOLDER' }) path: string,
    @GetServer() server: Server,
  ): Promise<ReturnFileDto[]> {
    return this.filesService.getFilesFromPath(server, path);
  }

  @Patch('file')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
    FileOperationIsNotAllowedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ServerIdOrAliasParam()
  @ApiQuery({ name: 'path', type: String, required: false })
  async renameFile(
    @GetServerFilePath({ type: 'FILE', methode: 'EDIT', mustExists: true })
    path: string,
    @GetServer() server: Server,
    @Body() renameFileDto: RenameFileDto,
  ): Promise<void> {
    await this.filesService.renameFile(
      path,
      renameFileDto.name,
      server.id,
      server.owner,
    );
  }

  @Get('file')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiQuery({ name: 'path', type: String, required: false })
  @ApiQuery({ name: 'start', type: Number, required: false })
  @ApiResponse({ status: 200, schema: { type: 'string', format: 'binary' } })
  @ApiProduces('application/octet-stream')
  @ServerIdOrAliasParam()
  async getFile(
    @GetServerFilePath({ type: 'FILE', methode: 'VIEW' }) path: string,
    @GetServer() server: Server,
    @GetUser() user: User,
    @Res() response: Response,
    @Query('start') start?: string,
  ): Promise<void> {
    if (start && !isNaN(+start) && +start > 0) {
      await this.filesService.sendFile(server, path, response, +start);
      return;
    }

    await this.filesService.sendFile(server, path, response);
  }

  @Get('folder')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiQuery({ name: 'path', type: String, required: false })
  @ApiResponse({ status: 200, schema: { type: 'string', format: 'binary' } })
  @ApiProduces('application/octet-stream')
  @ServerIdOrAliasParam()
  async getFolder(
    @GetServerFilePath({ type: 'FOLDER', mustExists: true }) path: string,
    @GetServer() server: Server,
    @GetUser() user: User,
    @Res() response: Response,
  ): Promise<void> {
    await this.filesService.sendFolder(server, path, response);
  }

  @Delete('file')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiQuery({ name: 'path', type: String, required: false })
  @ServerIdOrAliasParam()
  async deleteFile(
    @GetServer() server: Server,
    @GetUser() user: User,
    @GetServerFilePath({ mustExists: true, type: 'FILE', methode: 'DELETE' })
    path: string,
  ): Promise<void> {
    await this.filesService.deleteFile(server, path);
  }

  @Get('info')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiQuery({ name: 'path', type: String, required: false })
  @ServerIdOrAliasParam()
  getFileInfo(
    @GetServer() server: Server,
    @GetUser() user: User,
    @GetServerFilePath({ mustExists: true, type: 'ANY' })
    path: string,
  ): Promise<ReturnFileDto> {
    return this.filesService.getFileInfo(server, path);
  }

  @Post()
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
    FileAlreadyExistsException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiQuery({ name: 'path', type: String, required: false })
  @ServerIdOrAliasParam()
  async createFile(
    @GetServerFilePath({ mustExists: false, type: 'FILE', methode: 'VIEW' })
    path: string,
    @GetUser() user: User,
    @GetServer() server: Server,
  ): Promise<void> {
    await this.filesService.createFile(server, path);
  }

  @Put()
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiConsumes('text/plain')
  @ApiBody({ schema: { format: 'binary', type: 'string' } })
  @ApiQuery({ name: 'path', type: String, required: false })
  @ServerIdOrAliasParam()
  async updateFile(
    @GetServerFilePath({ mustExists: true, type: 'FILE', methode: 'EDIT' })
    path: string,
    @GetUser() user: User,
    @PlainBodyDecorator() body: string,
    @GetServer() server: Server,
  ): Promise<void> {
    await this.filesService.updateFile(server, user, path, body);
  }

  @Post('upload')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @UseInterceptors(
    FilesInterceptor('file', 1, { storage: Multer.memoryStorage() }),
  )
  @HasContext()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        relativePath: {
          type: 'string',
        },
        filename: {
          type: 'string',
        },
        identifier: {
          type: 'string',
          pattern: '^[0-9A-Z\\-]+$',
        },
        totalSize: {
          type: 'int',
        },
        chunkSize: {
          type: 'int',
        },
        totalChunks: {
          type: 'int',
        },
        chunkNumber: {
          type: 'int',
        },
      },
    },
  })
  @ServerIdOrAliasParam()
  async uploadFiles(
    @UploadedFiles() file: Express.Multer.File[],
    @Body() body: UploadFileDto,
    @GetUser() user: User,
    @GetServer() server: Server,
  ): Promise<void> {
    await this.filesService.uploadFileToDestination(
      server.owner,
      body,
      file[0],
      server.id,
      user,
    );
  }

  @Patch('folder')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiQuery({ name: 'path', type: String, required: false })
  @ServerIdOrAliasParam()
  async renameFolder(
    @GetServerFilePath({ mustExists: true, type: 'FOLDER' }) path: string,
    @Body() renameFileDto: RenameFileDto,
    @GetServer() server: Server,
  ): Promise<void> {
    await this.filesService.renameFolder(path, renameFileDto.name, server.id);
  }

  @Post('folder')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiQuery({ name: 'path', type: String, required: false })
  @ServerIdOrAliasParam()
  async createFolder(
    @GetServerFilePath({
      mustExists: false,
      type: 'FOLDER',
      shouldNotExist: true,
    })
    path: string,
    @GetServer() server: Server,
  ): Promise<void> {
    await this.filesService.createFolder(server, path);
  }

  @Delete('folder')
  @ThrowsExceptions(
    FileDoseNotExistsException,
    ServerIdCouldNotBeExtractedException,
  )
  @HasServerPermission(ServerPermissions.FILES)
  @HasContext()
  @ApiQuery({ name: 'path', type: String, required: false })
  @ServerIdOrAliasParam()
  deleteFolder(
    @GetServerFilePath({ type: 'FOLDER' }) path: string,
    @GetServer() server: Server,
  ): Promise<void> {
    return this.filesService.deleteFolder(server, path);
  }

  @Get('server-icon')
  @ThrowsExceptions()
  @HasContext(true)
  @OptionalUserContext()
  @ServerIdOrAliasParam()
  @Header('Cache-Control', 'max-age=3600')
  @Header('Content-Type', 'image/png')
  @ApiResponse({
    status: 200,
    schema: { type: 'string', format: 'binary' },
  })
  @ApiProduces('image/png', 'application/json')
  async getServerIcon(
    @GetServer() server: Server,
    @Res() response: Response,
  ): Promise<void> {
    response.end(await this.filesService.getServerIconOrDefault(server.id));
  }
}
