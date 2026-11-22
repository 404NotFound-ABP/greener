import React, { useState } from 'react';
import { OrbitsBackground } from '../components/auth/OrbitsBackground';
import { GreenerGlobeLogo } from '../components/auth/GreenerGlobeLogo';
import { saveSession, type AuthUser } from '../utils/auth';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');

interface LoginProps {
  onLoginSuccess?: () => void;
  onGoToRegister?: () => void;
  onAdminAccess?: () => void;
  sessionMessage?: string | null;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onGoToRegister,
  onAdminAccess,
  sessionMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState(sessionMessage ?? '');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setErro('Preencha os campos de e-mail e senha.');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!response.ok) {
        setErro(
          response.status === 401
            ? 'E-mail ou senha inválidos.'
            : `Falha ao autenticar (HTTP ${response.status}).`
        );
        return;
      }

      const payload: unknown = await response.json();
      if (
        !payload ||
        typeof payload !== 'object' ||
        !('accessToken' in payload) ||
        typeof payload.accessToken !== 'string' ||
        !payload.accessToken
      ) {
        throw new Error('A resposta de autenticação não contém um token válido.');
      }

      const user =
        'user' in payload && payload.user && typeof payload.user === 'object'
          ? (payload.user as AuthUser)
          : undefined;

      saveSession(payload.accessToken, user);
      onLoginSuccess?.();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível conectar ao serviço de autenticação.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07150E] overflow-x-hidden overflow-y-auto flex items-center justify-center px-4 py-8 font-sans select-none">
      {/* 
        Container do Conjunto (Órbitas + Logo + Card)
        - No mobile (< 640px): largura natural fluida (max-w-[390px]) sem scale no card para manter textos e botões nítidos e dentro da borda.
        - No desktop (>= 640px): max-w-[600px] com scale progressivo do Figma.
      */}
      <div className="relative w-full max-w-[390px] sm:max-w-[600px] mt-[76px] sm:mt-[120px] mb-[16px] sm:mb-[20px] sm:scale-[0.78] lg:scale-[0.82] xl:scale-[0.84] 2xl:scale-[0.88] origin-center transition-transform duration-300">
        {/* 1. ÓRBITAS */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[165px] sm:-top-[241px] w-[1440px] h-[1024px] scale-[0.62] sm:scale-100 origin-top pointer-events-none z-0">
          <OrbitsBackground />
        </div>

        {/* 2. GLOBO E LOGO */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[50px] sm:-top-[103px] pointer-events-none z-20">
          <GreenerGlobeLogo />
        </div>

        {/* 3. CARD DE LOGIN */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full pt-[64px] sm:pt-[165px] pb-[28px] sm:pb-[36px] px-5 sm:px-[30px] bg-[rgba(242,250,245,0.12)] shadow-[0px_24px_48px_rgba(21,32,26,0.25),inset_0px_4px_4px_rgba(242,250,245,0.10)] rounded-[24px] border-t border-r border-[rgba(242,250,245,0.50)] backdrop-blur-[8px] flex flex-col gap-4 sm:gap-[24px]"
        >
          {/* Cabeçalho do Formulário */}
          <div className="w-full flex flex-col gap-[6px] text-center">
            <h1 className="text-[#F2FAF5] text-[24px] sm:text-[32px] font-bold leading-[32px] sm:leading-[40px]">
              Olá seja bem-vindo(a)
            </h1>
            <p className="text-[#F2FAF5] text-[14px] sm:text-[20px] font-medium leading-[20px] sm:leading-[28px]">
              Para abrir o seu mapa e checar seu relatório faça o login:
            </p>
          </div>

          {/* Input de Email */}
          <div className="w-full h-[50px] sm:h-[56px] px-4 sm:px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5]/90 text-[15px] sm:text-[16px] font-normal leading-[24px] outline-none"
            />
          </div>

          {/* Input de Senha */}
          <div className="w-full h-[50px] sm:h-[56px] px-4 sm:px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5]/90 text-[15px] sm:text-[16px] font-normal leading-[24px] outline-none"
            />
          </div>

          {/* Ações Principais: Cadastro e Login */}
          <div className="w-full mt-1 sm:mt-[8px] flex flex-row justify-between items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onGoToRegister?.()}
              className="flex-1 sm:flex-initial h-[46px] sm:h-[48px] px-4 sm:px-[28px] bg-white/[0.03] hover:bg-white/[0.1] rounded-[10px] border border-[#14C45A] flex justify-center items-center text-white text-[15px] sm:text-[16px] font-medium leading-[24px] whitespace-nowrap transition-colors cursor-pointer"
            >
              Cadastro
            </button>

            <button
              type="submit"
              disabled={carregando}
              className="flex-1 sm:flex-initial h-[46px] sm:h-[48px] px-4 sm:px-[28px] bg-[#2FA862] hover:bg-[#14C45A] rounded-[10px] flex justify-center items-center text-white text-[15px] sm:text-[16px] font-medium leading-[24px] whitespace-nowrap transition-colors cursor-pointer shadow-lg disabled:cursor-wait disabled:opacity-60"
            >
              {carregando ? 'Entrando...' : 'Login'}
            </button>
          </div>

          {erro && (
            <p role="alert" className="text-center text-xs sm:text-sm text-red-200">
              {erro}
            </p>
          )}

          {/* Acesso Administrativo */}
          <button
            type="button"
            onClick={onAdminAccess}
            className="self-center text-[#F2FAF5]/70 hover:text-[#F2FAF5] text-[13px] sm:text-[14px] font-normal underline leading-[20px] transition-colors cursor-pointer"
          >
            Acesso administrativo
          </button>
        </form>
      </div>
    </div>
  );
};