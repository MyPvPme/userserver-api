import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import {
  AllowedTokens,
  NoUserContext,
  UserserverApiAuthGuard,
  UserserverApiSystemToken,
} from '@mypvp/userserver-api-auth';
import { GetUser } from './get-user.decorator';
import { User } from './user.entity';
import { HasContext } from '../common/has-context.decorator';
import { Server } from '../servers/server.entity';
import { UsersService } from './users.service';
import { ServerDomainRecord } from '../server-domains/server-domain-record.entity';
import { ThrowsExceptions } from '../common/throws-exceptions.decorator';
import { GetOwnServersQueryDto } from './dto/get-own-servers-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPurchasesDto } from './dto/update-user-purchases.dto';

@ApiTags('users')
@Controller('users')
@ApiCookieAuth()
@ApiBearerAuth()
@UseGuards(UserserverApiAuthGuard())
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('current')
  @HasContext()
  getCurrentUser(@GetUser() user: User): User {
    return user;
  }

  @Patch('current')
  @HasContext()
  updateCurrentUser(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(user.uuid, updateUserDto);
  }

  @Get('current/domain-records')
  @ThrowsExceptions()
  @HasContext()
  getDomainRecordsOfCurrentUser(
    @GetUser() user: User,
  ): Promise<ServerDomainRecord[]> {
    return ServerDomainRecord.find({ where: { ownerUuid: user.uuid } });
  }

  @Get('servers')
  @HasContext()
  getAllServersOfUser(
    @GetUser() user: User,
    @Query() filter: GetOwnServersQueryDto,
  ): Promise<Server[]> {
    return this.usersService.getAllServersOfUser(user, filter);
  }

  @Post(':userUuid/purchases')
  @NoUserContext()
  @AllowedTokens(UserserverApiSystemToken)
  addUserPurchases(
    @Param('userUuid') uuid: string,
    @Body() updateUserPurchasesDto: UpdateUserPurchasesDto,
  ): Promise<User> {
    return this.usersService.addUserPurchases(uuid, updateUserPurchasesDto);
  }
}
