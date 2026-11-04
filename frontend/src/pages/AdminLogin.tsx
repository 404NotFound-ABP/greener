import React, { useState } from 'react';
import { OrbitsBackground } from '../components/auth/OrbitsBackground';
import { GreenerGlobeLogo } from '../components/auth/GreenerGlobeLogo';

interface AdminLoginProps {
  onLoginSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess?.();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07150E] overflow-x-hidden overflow-y-auto flex items-center justify-center px-4 sm:px-8 py-12 font-sans select-none">
      
      {/* Fundo com Órbitas */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-60 xl:opacity-100 flex items-center justify-center">
        <div className="w-[1440px] h-[1024px] scale-[0.35] sm:scale-[0.50] md:scale-[0.60] lg:scale-[0.75] xl:scale-[0.90] 2xl:scale-100 origin-center transition-transform duration-500">
          <OrbitsBackground />
        </div>
      </div>

      <div className="relative w-full max-w-[600px] z-10 mt-[80px] sm:mt-[120px]">
        {/* Logo GreenER */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[50px] sm:-top-[70px] md:-top-[90px] lg:-top-[125px] z-20">
          <GreenerGlobeLogo />
        </div>

        {/* Cartão de Login Administrativo com a opacidade corrigida */}
        <form
          onSubmit={handleSubmit}
          className="w-full pt-[165px] pb-[32px] px-[30px] bg-[rgba(242,250,245,0.12)] shadow-[0px_24px_48px_rgba(21,32,26,0.25),inset_0px_4px_4px_rgba(242,250,245,0.10)] rounded-[24px] border-t-[1px] border-r-[2px] border-b-[2px] border-l-0 border-[rgba(242,250,245,0.50)] backdrop-blur-[8px] flex flex-col gap-[24px]"
        >
          <div className="w-full flex flex-col gap-[8px] text-center">
            <h1 className="text-[#F2FAF5] text-[24px] font-bold">
              Olá seja bem-vindo(a)
            </h1>
            <p className="text-[#F2FAF5] text-[16px] font-normal leading-[24px]">
              Para acessar o painel administrativo preencha os campos abaixo:
            </p>
          </div>

          <div className="w-full flex flex-col gap-[16px]">
            {/* Campo de Email */}
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

            {/* Campo de Palavra-passe */}
            <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha"
                required
                className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal outline-none"
              />
            </div>
          </div>

          <div className="w-full flex justify-end mt-[8px]">
            <button
              type="submit"
              className="h-[48px] px-[28px] bg-[#2FA862] hover:bg-[#14C45A] rounded-[10px] flex justify-center items-center text-white text-[16px] font-medium transition-colors cursor-pointer shadow-lg"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};