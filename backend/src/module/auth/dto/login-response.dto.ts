import { ApiProperty } from '@nestjs/swagger';

export class UserPayloadDto {
  @ApiProperty({ example: 1, description: 'ID do usuário' })
  id!: number;

  @ApiProperty({ example: 'Administrador Master', description: 'Nome do usuário' })
  name!: string;

  @ApiProperty({ example: 'admin@greener.com', description: 'Email do usuário' })
  email!: string;

  @ApiProperty({ example: 'admin', enum: ['admin', 'user'], description: 'Perfil de acesso do usuário' })
  role!: 'admin' | 'user';
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT para autorização nas rotas protegidas (Bearer Token)',
  })
  accessToken!: string;

  @ApiProperty({
    type: UserPayloadDto,
    description: 'Dados cadastrais do usuário autenticado',
  })
  user!: UserPayloadDto;
}
