import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConnectServerDomainRecordDto } from './dto/connect-server-domain-record.dto';
import { ServerDomainsService } from './server-domains.service';
import { GetUser } from '../users/get-user.decorator';
import { User } from '../users/user.entity';
import { ServerDomainRecord } from './server-domain-record.entity';
import { CreateServerDomainRecordDto } from './dto/create-server-domain-record.dto';
import { ServerDomain } from './server-domain.entity';
import { CreateServerDomainDto } from './dto/create-server-domain.dto';
import { EditServerDomainDto } from './dto/edit-server-domain.dto';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AllowedTokens,
  NoUserContext,
  UserserverApiAuthGuard,
  UserserverApiSystemToken,
} from '@mypvp/userserver-api-auth';
import { HasContext } from '../common/has-context.decorator';
import { HasPermission } from '../users/has-permission.decorator';
import { ThrowsExceptions } from '../common/throws-exceptions.decorator';
import { UserDoesNotHaveThePermissionException } from '../users/exceptions/user-does-not-have-the-permission.exception';
import { UserserverDomainRecordAlreadyExistsException } from './exceptions/userserver-domain-record-already-exists.exception';
import { UserserverDomainRecordNotFoundException } from './exceptions/userserver-domain-record-not-found.exception';
import { UserserverDomainNotFoundException } from './exceptions/userserver-domain-not-found.exception';
import { OptionalUserContext } from '@mypvp/userserver-api-auth/dist/optional-user-context.decorator';
import { TransferServerDomainRecordDto } from './dto/transfer-server-domain-record.dto';

@Controller('servers')
@ApiTags('server-domains')
@ApiCookieAuth()
@ApiBearerAuth()
@UseGuards(UserserverApiAuthGuard())
export class ServerDomainsController {
  constructor(private readonly serverDomainsService: ServerDomainsService) {}

  @Patch('domains/records/:recordId')
  @HasContext()
  @ThrowsExceptions(UserDoesNotHaveThePermissionException)
  connectDomainRecord(
    @Body() connectServerDomainDto: ConnectServerDomainRecordDto,
    @Param('recordId', ParseIntPipe) recordId: number,
    @GetUser() user: User,
  ): Promise<ServerDomainRecord> {
    if (
      !connectServerDomainDto.serverIdOrAlias &&
      !connectServerDomainDto.serverId
    ) {
      throw new BadRequestException('Neither id or alias was provided');
    }

    return this.serverDomainsService.connectDomainRecord(
      connectServerDomainDto.serverIdOrAlias ||
        connectServerDomainDto.serverId.toString(),
      recordId,
      user,
    );
  }

  @Post('domains/records/:recordId/disconnect')
  @HasContext()
  @ThrowsExceptions(UserDoesNotHaveThePermissionException)
  async disconnectDomainRecord(
    @Param('recordId', ParseIntPipe) recordId: number,
    @GetUser() user: User,
  ): Promise<void> {
    await this.serverDomainsService.disconnectDomainRecord(recordId, user);
  }

  @Post('domains/records/:recordId/transfer')
  @HasContext()
  @ThrowsExceptions(UserDoesNotHaveThePermissionException)
  async transferDomainRecord(
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() transferServerDomainRecordDto: TransferServerDomainRecordDto,
    @GetUser() user: User,
  ): Promise<void> {
    await this.serverDomainsService.transferDomainRecord(
      recordId,
      user,
      transferServerDomainRecordDto,
    );
  }

  @Post('domains/records')
  @HasContext()
  @ThrowsExceptions(
    UserserverDomainRecordAlreadyExistsException,
    UserserverDomainRecordNotFoundException,
    UserserverDomainNotFoundException,
  )
  registerDomainRecord(
    @Body() createServerDomainRecord: CreateServerDomainRecordDto,
    @GetUser() user: User,
  ): Promise<ServerDomainRecord> {
    return this.serverDomainsService.registerDomainRecord(
      createServerDomainRecord,
      user,
    );
  }

  @Delete('domains/records/:recordId')
  @HasContext()
  @ThrowsExceptions(
    UserserverDomainRecordNotFoundException,
    UserserverDomainNotFoundException,
  )
  deleteDomainRecord(
    @Param('recordId', ParseIntPipe) recordId: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.serverDomainsService.deleteDomainRecord(recordId, user);
  }

  @Get('domains')
  @HasContext(true)
  @ThrowsExceptions()
  @OptionalUserContext()
  getAllDomains(): Promise<ServerDomain[]> {
    return this.serverDomainsService.getAllDomains();
  }

  @Post('domains')
  @HasContext()
  @HasPermission('userserver.admin.domains.add')
  createDomain(
    @Body() createServerDomainDto: CreateServerDomainDto,
  ): Promise<ServerDomain> {
    return this.serverDomainsService.createDomain(createServerDomainDto);
  }

  @Patch('domains/:domainId')
  @HasContext()
  @HasPermission('userserver.admin.domains.delete')
  @ThrowsExceptions(UserserverDomainNotFoundException)
  editDomain(
    @Body() editServerDomainDto: EditServerDomainDto,
    @Param('domainId', ParseIntPipe) domainId: number,
  ): Promise<ServerDomain> {
    return this.serverDomainsService.editDomain(editServerDomainDto, domainId);
  }

  @Delete('domains/:domainId')
  @HasContext()
  @HasPermission('userserver.admin.domains.remove')
  @ThrowsExceptions(UserserverDomainNotFoundException)
  deleteDomain(
    @Param('domainId', ParseIntPipe) domainId: number,
  ): Promise<void> {
    return this.serverDomainsService.deleteDomain({ id: domainId });
  }

  @Get('domains/:domainId/records/:record')
  @AllowedTokens(UserserverApiSystemToken)
  @ApiParam({ name: 'domainId' })
  @ApiParam({
    name: 'record',
    type: 'string',
    description: 'Record id or record "name"',
  })
  @NoUserContext()
  getDomainRecord(
    @Param('domainId', ParseIntPipe) domainId: number,
    @Param('record') record: string,
  ): Promise<ServerDomainRecord> {
    return this.serverDomainsService.getDomainRecord(domainId, record);
  }
}
