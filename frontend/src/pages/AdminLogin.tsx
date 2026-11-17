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
    <div className="relative min-h-screen w-full bg-[#07150E] overflow-hidden flex items-center justify-center px-4 py-6 font-sans select-none">
      
      {/* Container do Conjunto (Órbitas + Logo + Card) com escala unificada */}
      <div className="relative w-full max-w-[600px] mt-[120px] mb-[20px] scale-[0.72] sm:scale-[0.78] lg:scale-[0.82] xl:scale-[0.84] 2xl:scale-[0.88] origin-center transition-transform duration-300">
        
        {/* 1. ÓRBITAS: Ancoradas a -241px do topo do Card */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[241px] w-[1440px] h-[1024px] pointer-events-none z-0">
          <OrbitsBackground />
        </div>

        {/* 2. GLOBO E LOGO: Ancorados a -103px do topo do Card */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[103px] z-20">
          <GreenerGlobeLogo />
        </div>

        {/* 3. CARTÃO DE LOGIN ADMINISTRATIVO */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full pt-[165px] pb-[32px] px-[30px] bg-[rgba(242,250,245,0.12)] shadow-[0px_24px_48px_rgba(21,32,26,0.25),inset_0px_4px_4px_rgba(242,250,245,0.10)] rounded-[24px] border-t-[1px] border-r-[2px] border-b-[2px] border-l-0 border-[rgba(242,250,245,0.50)] backdrop-blur-[8px] flex flex-col gap-[24px]"
        >
          <div className="w-full flex flex-col gap-[8px] text-center">
            <h1 className="text-[#F2FAF5] text-[24px] sm:text-[32px] font-bold leading-tight">
              Olá seja bem-vindo(a)
            </h1>
            <p className="text-[#F2FAF5] text-[16px] sm:text-[20px] font-medium leading-[28px]">
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

            {/* Campo de Senha */}
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