import { PickType } from '@nestjs/swagger';
import { Token } from '../token.entity';

export class CreateTokenDto extends PickType(Token, ['uuid']) {
  toToken(): Token {
    const token = new Token();

    token.uuid = this.uuid;

    return token;
  }
}
