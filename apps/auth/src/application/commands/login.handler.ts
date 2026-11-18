import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';

import { LoginCommand } from './login.command';
import { PrismaAuthRepository } from '../../infrastructure/prisma-auth.repository';
import { JwtTokenService } from '../../infrastructure/security/jwt-token.service';
import { TokenHashService } from '../../infrastructure/security/token-hash.service';
import { RpcException } from '@nestjs/microservices';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly authRepository: PrismaAuthRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly tokenHashService: TokenHashService,
  ) {}

  async execute(command: LoginCommand) {
    const { email, password } = command.data;

    const user = await this.authRepository.findByEmail(
      email.trim().toLowerCase(),
    );

    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      password,
    );

    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtTokenService.generateAccessToken(payload),
      this.jwtTokenService.generateRefreshToken(payload),
    ]);

    const tokenHash = this.tokenHashService.hash(refreshToken);

    await this.authRepository.createRefreshToken({
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: user.id,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }
}