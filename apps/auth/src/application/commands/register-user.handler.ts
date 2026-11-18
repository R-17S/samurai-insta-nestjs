import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { PrismaAuthRepository } from '../../infrastructure/prisma-auth.repository';
import { RegisterUserCommand } from './register-user.command';
import { JwtTokenService } from '../../infrastructure/security/jwt-token.service';
import { RpcException } from '@nestjs/microservices';
import { TokenHashService } from '../../infrastructure/security/token-hash.service';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly authRepository: PrismaAuthRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly tokenHashService: TokenHashService,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { name, email, password } = command.data;

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser =
      await this.authRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new RpcException({
        statusCode: 409,
        message: 'Email already registered',
      });
    }

    const passwordHash = await argon2.hash(password);

    const user = await this.authRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

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
      user,
      accessToken,
      refreshToken,
    };
  }
}