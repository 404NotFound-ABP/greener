import React, { useState } from 'react';
import { OrbitsBackground } from '../components/auth/OrbitsBackground';
import { GreenerGlobeLogo } from '../components/auth/GreenerGlobeLogo';
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons';

interface LoginProps {
  onLoginSuccess?: () => void;
  onGoToRegister?: () => void;
  onAdminAccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onGoToRegister,
  onAdminAccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess?.();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07150E] overflow-hidden flex items-center justify-center px-4 sm:px-8 py-12 font-sans select-none">
      
      {/* Subcomponente 1: Órbitas e Planetas centralizados e fixos no fundo */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-60 xl:opacity-100 flex items-center justify-center">
        {/* Escalas calculadas para preencher o máximo de espaço sem cortar nas bordas */}
        <div className="w-[1440px] h-[1024px] scale-[0.77] sm:scale-[0.50] md:scale-[0.77] lg:scale-[0.75] xl:scale-[0.90] 2xl:scale-100 origin-center transition-transform duration-500">
          <OrbitsBackground />
        </div>
      </div>
      {/* Container Principal do Card Responsivo */}
      <div className="relative w-full max-w-[600px] z-10 mt-[80px] sm:mt-[120px]">
        
        {/* Subcomponente 3: Globo e Logo centralizados em relação ao CARD */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[50px] sm:-top-[70px] md:-top-[90px] lg:-top-[125px] z-20">
          <GreenerGlobeLogo />
        </div>

        {/* Card de Login (Glassmorphism 100% Responsivo) */}
       <form
        onSubmit={handleSubmit}
        className="w-full pt-[165px] pb-[32px] px-[30px] bg-[rgba(242,250,245,0.12)] shadow-[0px_24px_48px_rgba(21,32,26,0.25),inset_0px_4px_4px_rgba(242,250,245,0.10)] rounded-[24px] border-t-[1px] border-r-[2px] border-b-[2px] border-l-0 border-[rgba(242,250,245,0.50)] backdrop-blur-[8px] flex flex-col gap-[24px]"
        >
          {/* Cabeçalho do Formulário */}
          <div className="w-full flex flex-col gap-2 text-center">
            <h1 className="text-[#F2FAF5] text-[24px] sm:text-[32px] font-bold leading-tight">
              Olá seja bem-vindo(a)
            </h1>
            <p className="text-[#F2FAF5] text-[16px] sm:text-[20px] font-medium leading-relaxed">
              Para abrir o seu mapa e checar seu relatório faça o login:
            </p>
          </div>

          {/* Input de Email */}
          <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal outline-none"
            />
          </div>

          {/* Input de Senha */}
          <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full bg-transparent text-[#F2FAF5] placeholder-[#F2FAF5] text-[16px] font-normal outline-none"
            />
          </div>

          {/* Subcomponente 2: Botões Sociais */}
          <SocialAuthButtons />

          {/* Ações Principais: Cadastro e Login (Lado a lado em telas grandes, empilhados no mobile) */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
            <button
              type="button"
              onClick={onGoToRegister}
              className="w-full sm:w-auto h-[48px] px-[28px] bg-white/[0.03] hover:bg-white/[0.1] rounded-[10px] border border-[#14C45A] flex justify-center items-center text-white text-[16px] font-medium transition-colors cursor-pointer"
            >
              Cadastro
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto h-[48px] px-[36px] bg-[#2FA862] hover:bg-[#14C45A] rounded-[10px] flex justify-center items-center text-white text-[16px] font-medium transition-colors cursor-pointer shadow-lg"
            >
              Login
            </button>
          </div>

          {/* Acesso Administrativo */}
          <button
            type="button"
            onClick={onAdminAccess}
            className="text-[#F2FAF5]/70 hover:text-[#F2FAF5] text-[14px] font-normal underline transition-colors cursor-pointer mt-2"
          >
            Acesso administrativo
          </button>
        </form>

      </div>
    </div>
  );
};