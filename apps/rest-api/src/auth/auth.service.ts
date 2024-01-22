import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from './token.entity';
import {
  UserserverApiAuthService,
  UserserverApiSystemToken,
  UserserverApiUserToken,
} from '@mypvp/userserver-api-auth';
import { TokenNotFoundException } from './exceptions/token-not-found.exception';
import { CreateTokenDto } from './dto/create-token.dto';
import { ReturnSessionDto } from './dto/return-session.dto';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private static logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly userserverApiAuthService: UserserverApiAuthService,
  ) {}

  async authenticate(inputToken: string): Promise<ReturnSessionDto> {
    const token = await this.getTokenFromToken(inputToken);
    if (!token)
      throw new TokenNotFoundException(`Token ${inputToken} not found`);

    const thenDate = new Date();
    thenDate.setMinutes(thenDate.getMinutes() - 6);

    if (token.created < thenDate)
      throw new TokenNotFoundException(`Token ${inputToken} not found`);

    const session = await this.userserverApiAuthService.createToken(
      new UserserverApiUserToken(token.uuid),
    );

    await token.remove();

    return { token: session };
  }

  async getTokenFromToken(searchToken: string): Promise<Token> {
    let token: Token;

    try {
      token = await this.tokenRepository.findOneBy({ token: searchToken });
    } catch (e) {
      throw e;
    }

    return token;
  }

  async creatToken(createTokenDto: CreateTokenDto): Promise<Token> {
    const token = createTokenDto.toToken();

    return token.save({ reload: true });
  }

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.USERSERVER_AUTH_GENERATE_TEST_TOKENS !== 'true') {
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      AuthService.logger.error(
        'Auth Debug mode is activated but was deactivated because NODE_ENV is production',
      );
      return;
    }

    AuthService.logger.warn('Auth Debug mode is activated');

    AuthService.logger.debug(
      `System token: ${await this.userserverApiAuthService.createToken(
        new UserserverApiSystemToken(),
      )}`,
    );

    AuthService.logger.debug(
      `User token: ${await this.userserverApiAuthService.createToken(
        new UserserverApiUserToken(process.env.USERSERVER_AUTH_TEST_USER_UUID),
      )}`,
    );
  }
}
