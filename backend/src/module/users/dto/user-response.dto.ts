import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID identificador único' })
  id!: number;

  @ApiProperty({ example: 'João Silva', description: 'Nome do usuário' })
  name!: string;

  @ApiProperty({ example: 'joao.silva@greener.com', description: 'Email do usuário' })
  email!: string;

  @ApiProperty({ example: 'user', enum: ['admin', 'user'], description: 'Perfil de permissão' })
  role!: 'admin' | 'user';

  @ApiProperty({ example: '2026-10-30T00:00:00.000Z', description: 'Data de cadastro' })
  created_at!: Date;

  @ApiProperty({ example: '2026-10-30T00:00:00.000Z', description: 'Data da última alteração' })
  updated_at!: Date;
}
