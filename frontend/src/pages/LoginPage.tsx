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
    <div className="relative min-h-screen w-full bg-[#07150E] overflow-hidden flex items-center justify-center px-4 py-6 font-sans select-none">
      
      {/* 
        Container do Conjunto (Órbitas + Logo + Card)
        - Ajustado com scale progressivo para que em monitores grandes e notebooks as órbitas 
          fiquem totalmente contidas na tela, sem cortar o planeta laranja ou o topo.
      */}
      <div className="relative w-full max-w-[600px] mt-[120px] mb-[20px] scale-[0.72] sm:scale-[0.78] lg:scale-[0.82] xl:scale-[0.84] 2xl:scale-[0.88] origin-center transition-transform duration-300">
        
        {/* 1. ÓRBITAS: Ancoradas a -241px do topo do Card */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[241px] w-[1440px] h-[1024px] pointer-events-none z-0">
          <OrbitsBackground />
        </div>

        {/* 2. GLOBO E LOGO: Ancorados a -103px do topo do Card */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[103px] z-20">
          <GreenerGlobeLogo />
        </div>

        {/* 3. CARD DE LOGIN (Medidas exatas do Figma) */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full pt-[165px] pb-[32px] px-[30px] bg-[rgba(242,250,245,0.12)] shadow-[0px_24px_48px_rgba(21,32,26,0.25),inset_0px_4px_4px_rgba(242,250,245,0.10)] rounded-[24px] border-t border-r border-[rgba(242,250,245,0.50)] backdrop-blur-[8px] flex flex-col gap-[24px]"
        >
          {/* Cabeçalho do Formulário */}
          <div className="w-full flex flex-col gap-[5px] text-center">
            <h1 className="text-[#F2FAF5] text-[28px] sm:text-[32px] font-bold leading-[40px]">
              Olá seja bem-vindo(a)
            </h1>
            <p className="text-[#F2FAF5] text-[16px] sm:text-[20px] font-medium leading-[28px]">
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
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal leading-[24px] outline-none"
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
              className="w-full bg-transparent text-[#F2FAF5] placeholder-[#F2FAF5] text-[16px] font-normal leading-[24px] outline-none"
            />
          </div>

          {/* Botões Sociais */}
          <SocialAuthButtons />

          {/* Ações Principais: Cadastro e Login */}
          <div className="w-full flex flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={onGoTaskRegister => onGoToRegister?.()}
              className="h-[48px] px-[28px] bg-white/[0.03] hover:bg-white/[0.1] rounded-[10px] border border-[#14C45A] flex justify-center items-center text-white text-[16px] font-medium leading-[24px] transition-colors cursor-pointer"
            >
              Cadastro
            </button>

            <button
              type="submit"
              className="h-[48px] px-[28px] bg-[#2FA862] hover:bg-[#14C45A] rounded-[10px] flex justify-center items-center text-white text-[16px] font-medium leading-[24px] transition-colors cursor-pointer shadow-lg"
            >
              Login
            </button>
          </div>

          {/* Acesso Administrativo */}
          <button
            type="button"
            onClick={onAdminAccess}
            className="self-center text-[#F2FAF5]/70 hover:text-[#F2FAF5] text-[14px] font-normal underline leading-[20px] transition-colors cursor-pointer"
          >
            Acesso administrativo
          </button>
        </form>

      </div>
    </div>
  );
};