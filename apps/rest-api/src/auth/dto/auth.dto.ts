import { IsString } from 'class-validator';

export class AuthDto {
  /**
   * The token is used for the session exchange
   */
  @IsString()
  readonly token: string;
}
