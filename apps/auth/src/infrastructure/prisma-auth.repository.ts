import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma.service';

export interface CreateAuthUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface CreateRefreshTokenData {
  tokenHash: string;
  expiresAt: Date;
  userId: number;
}

export interface CreateEmailVerificationTokenData {
  tokenHash: string;
  expiresAt: Date;
  userId: number;
}

@Injectable()
export class PrismaAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: CreateAuthUserData) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        isEmailVerified: true,
      },
    });
  }

  async createRefreshToken(data: CreateRefreshTokenData) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revokeRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async createEmailVerificationToken(
    data: CreateEmailVerificationTokenData,
  ) {
    return this.prisma.emailVerificationToken.create({
      data,
    });
  }

  async findEmailVerificationTokenByHash(tokenHash: string) {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  }

  async markEmailVerificationTokenAsUsed(tokenHash: string) {
    return this.prisma.emailVerificationToken.updateMany({
      where: {
        tokenHash,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  async verifyUserEmail(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
      },
    });
  }

  async createUserWithEmailVerificationToken(
    userData: CreateAuthUserData,
    tokenData: Omit<CreateEmailVerificationTokenData, 'userId'>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          isEmailVerified: true,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          ...tokenData,
          userId: user.id,
        },
      });

      return user;
    });
  }
}
