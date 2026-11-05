import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name!: string;

  @ApiProperty({
    example: 'joao.silva@greener.com',
    description: 'Email corporativo único',
  })
  @IsEmail({}, { message: 'O email deve ser válido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email!: string;

  @ApiProperty({
    example: 'senhaForte123',
    description: 'Senha de acesso (mínimo 6 caracteres)',
  })
  @IsString({ message: 'A senha deve ser uma string' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve possuir no mínimo 6 caracteres' })
  password!: string;

  @ApiPropertyOptional({
    example: 'user',
    enum: ['admin', 'user'],
    default: 'user',
    description: 'Perfil de permissões: admin (master) ou user (comum)',
  })
  @IsOptional()
  @IsIn(['admin', 'user'], { message: 'A role deve ser "admin" ou "user"' })
  role?: 'admin' | 'user';
}
