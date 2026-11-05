import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsIn, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'João Silva Atualizado',
    description: 'Novo nome completo do usuário',
  })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  name?: string;

  @ApiPropertyOptional({
    example: 'novo.email@greener.com',
    description: 'Novo endereço de email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'O email deve ser válido' })
  email?: string;

  @ApiPropertyOptional({
    example: 'novaSenhaSegura456',
    description: 'Nova senha (se informada, será gerado novo hash bcrypt)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve possuir no mínimo 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({
    example: 'admin',
    enum: ['admin', 'user'],
    description: 'Atualização do perfil de acesso (admin ou user)',
  })
  @IsOptional()
  @IsIn(['admin', 'user'], { message: 'A role deve ser "admin" ou "user"' })
  role?: 'admin' | 'user';
}
