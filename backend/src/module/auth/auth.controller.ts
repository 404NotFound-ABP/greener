import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, UserPayloadDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateUserDto } from '@/module/users/dto/create-user.dto';
import { UserResponseDto } from '@/module/users/dto/user-response.dto';

@ApiTags('Autenticação')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticação de usuário (comum ou master)',
    description: 'Recebe credenciais de acesso, valida a senha com hash bcrypt e retorna um Bearer Token JWT contendo id, email, nome e a role (admin ou user).',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastro público de novo usuário',
    description: 'Permite criar uma nova conta de usuário comum no sistema com senha protegida por hash bcrypt.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário cadastrado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado',
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consulta o perfil do usuário logado',
    description: 'Retorna as informações do usuário atual extraídas e validadas a partir do token JWT no header Authorization: Bearer <token>. Utilizado pelo frontend para verificar sessão ativa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do perfil do usuário logado',
    type: UserPayloadDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async getProfile(@CurrentUser('id') userId: number) {
    return this.authService.getMe(userId);
  }
}
