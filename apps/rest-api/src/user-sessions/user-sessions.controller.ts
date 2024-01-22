import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import {
  AllowedTokens,
  UserserverApiAuthGuard,
  UserserverApiSystemToken,
} from '@mypvp/userserver-api-auth';
import { HasContext } from '../common/has-context.decorator';
import { UserSessionsService } from './user-sessions.service';
import { GetUser } from '../users/get-user.decorator';
import { User } from '../users/user.entity';
import { UserSessionsPaginationDto } from './dto/user-sessions-pagination.dto';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { CreateUserSessionDto } from './dto/create-user-session.dto';
import { UserPlaytimePaginationDto } from './dto/user-playtime-pagination.dto';
import { UserPlaytimeSortingDto } from './dto/user-playtime-sorting.dto';

@Controller('users')
@ApiTags('user-sessions')
@ApiCookieAuth()
@ApiBearerAuth()
@UseGuards(UserserverApiAuthGuard())
export class UserSessionsController {
  constructor(private readonly userSessionsService: UserSessionsService) {}

  @Get('current/sessions')
  @HasContext()
  getSessionsOfCurrentUser(
    @GetUser() user: User,
    @Query() pagination: PaginationQueryDto,
  ): Promise<UserSessionsPaginationDto> {
    return this.userSessionsService.getSessionsForUser(user.uuid, pagination);
  }

  @Get('current/playtime')
  @HasContext()
  getPlaytimeOfCurrentUser(
    @GetUser() user: User,
    @Query() pagination: PaginationQueryDto,
    @Query() sorting: UserPlaytimeSortingDto,
  ): Promise<UserPlaytimePaginationDto> {
    return this.userSessionsService.getPlaytimeForUser(
      user.uuid,
      pagination,
      sorting,
    );
  }

  @Post('current/sessions')
  @HasContext()
  @AllowedTokens(UserserverApiSystemToken)
  async createSession(
    @Body() userSessionDto: CreateUserSessionDto,
    @GetUser() user: User,
  ): Promise<void> {
    await this.userSessionsService.createSession(user.uuid, userSessionDto);
  }
}
