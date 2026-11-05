import { Injectable, Inject, NotFoundException, ConflictException, InternalServerErrorException, OnApplicationBootstrap, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DRIZZLE_PROVIDER, DrizzleDB, schema } from '@/database';
import { eq, desc } from 'drizzle-orm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB) {}

  async onApplicationBootstrap() {
    await this.seedInitialAdmin();
  }

  private async seedInitialAdmin() {
    try {
      const [adminExists] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, 'admin'))
        .limit(1);

      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.db.insert(schema.users).values({
          name: 'Master Admin',
          email: 'admin@greener.com',
          password: hashedPassword,
          role: 'admin',
        });
        this.logger.log('✅ Usuário Master inicial criado com sucesso: admin@greener.com (senha: admin123)');
      }
    } catch (err: any) {
      this.logger.error(`Erro ao verificar/criar usuário master inicial: ${err.message}`);
    }
  }

  async findAll(): Promise<UserResponseDto[]> {
    return this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        created_at: schema.users.created_at,
        updated_at: schema.users.updated_at,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.id));
  }

  async findById(id: number): Promise<UserResponseDto> {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        created_at: schema.users.created_at,
        updated_at: schema.users.updated_at,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não foi encontrado.`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const emailNormalized = createUserDto.email.toLowerCase().trim();

    const [existing] = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, emailNormalized))
      .limit(1);

    if (existing) {
      throw new ConflictException(`Já existe um usuário cadastrado com o email "${createUserDto.email}".`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const [created] = await this.db
      .insert(schema.users)
      .values({
        name: createUserDto.name.trim(),
        email: emailNormalized,
        password: hashedPassword,
        role: createUserDto.role || 'user',
      })
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        created_at: schema.users.created_at,
        updated_at: schema.users.updated_at,
      });

    if (!created) {
      throw new InternalServerErrorException('Falha ao cadastrar usuário no banco de dados.');
    }

    return created;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findById(id);

    const updateData: Record<string, any> = {
      updated_at: new Date(),
      time_updated: new Date(),
    };

    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name.trim();
    }

    if (updateUserDto.email !== undefined) {
      const emailNormalized = updateUserDto.email.toLowerCase().trim();
      const [emailInUse] = await this.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, emailNormalized))
        .limit(1);

      if (emailInUse && emailInUse.id !== id) {
        throw new ConflictException(`O email "${updateUserDto.email}" já está sendo utilizado por outro usuário.`);
      }
      updateData.email = emailNormalized;
    }

    if (updateUserDto.password !== undefined) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }

    const [updated] = await this.db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        created_at: schema.users.created_at,
        updated_at: schema.users.updated_at,
      });

    if (!updated) {
      throw new InternalServerErrorException('Falha ao atualizar dados do usuário.');
    }

    return updated;
  }

  async delete(id: number) {
    await this.findById(id);

    await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id));

    return {
      message: `Usuário ${id} removido com sucesso.`,
    };
  }
}
