import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_PROVIDER, DrizzleDB, schema } from '@/database';
import { eq } from 'drizzle-orm';

export interface JwtPayload {
  sub: number;
  email: string;
  role: 'admin' | 'user';
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'greener_jwt_secret_key_2026',
    });
  }

  async validate(payload: JwtPayload) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou sessão inválida');
    }

    return user;
  }
}
