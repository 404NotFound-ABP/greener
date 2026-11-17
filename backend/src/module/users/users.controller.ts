import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/module/auth/decorators/roles.decorator';

@ApiTags('Gerenciamento de Usuários (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todos os usuários (exclusivo Master/Admin)',
    description: 'Retorna a listagem completa de usuários do sistema para visualização no painel administrativo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários cadastrados',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: requer perfil de admin' })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastra um novo usuário comum ou master (exclusivo Master/Admin)',
    description: 'Cria um novo registro na tabela de usuários com senha criptografada em bcrypt.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário cadastrado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: requer perfil de admin' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca detalhes de um usuário por ID (exclusivo Master/Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID numérico do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do usuário encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza dados de um usuário (exclusivo Master/Admin)',
    description: 'Permite alterar nome, email, senha ou permissão (role) de um usuário existente.',
  })
  @ApiParam({ name: 'id', description: 'ID numérico do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email já em uso por outro usuário' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove um usuário do sistema (exclusivo Master/Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID numérico do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
