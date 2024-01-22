import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  AllowedTokens,
  NoUserContext,
  UserserverApiAuthGuard,
  UserserverApiSystemToken,
} from '@mypvp/userserver-api-auth';
import { AuthDto } from './dto/auth.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { Token } from './token.entity';
import { ReturnSessionDto } from './dto/return-session.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @NoUserContext()
  async auth(@Body() authDto: AuthDto): Promise<ReturnSessionDto> {
    return await this.authService.authenticate(authDto.token);
  }

  @Post('token')
  @ApiBearerAuth()
  @UseGuards(UserserverApiAuthGuard())
  @AllowedTokens(UserserverApiSystemToken)
  @NoUserContext()
  createUserToken(@Body() createTokenDto: CreateTokenDto): Promise<Token> {
    return this.authService.creatToken(createTokenDto);
  }
}
