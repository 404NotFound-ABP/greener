import React, { useState } from 'react';
import { OrbitsBackground } from '../components/auth/OrbitsBackground';
import { GreenerGlobeLogo } from '../components/auth/GreenerGlobeLogo';

interface RegisterProps {
  onNextStep?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onNextStep }) => {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNextStep?.();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07150E] overflow-hidden flex items-center justify-center px-4 py-6 font-sans select-none">
      
      {/* Container do Conjunto (Órbitas + Logo + Card) com a mesma escala do Login */}
      <div className="relative w-full max-w-[600px] mt-[120px] mb-[20px] scale-[0.72] sm:scale-[0.78] lg:scale-[0.82] xl:scale-[0.84] 2xl:scale-[0.88] origin-center transition-transform duration-300">
        
        {/* 1. ÓRBITAS: Ancoradas a -241px do topo do Card */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[241px] w-[1440px] h-[1024px] pointer-events-none z-0">
          <OrbitsBackground />
        </div>

        {/* 2. GLOBO E LOGO: Ancorados a -103px do topo do Card */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[103px] z-20">
          <GreenerGlobeLogo />
        </div>

        {/* 3. CARD DE CADASTRO */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full pt-[165px] pb-[32px] px-[30px] bg-[rgba(242,250,245,0.12)] shadow-[0px_24px_48px_rgba(21,32,26,0.25),inset_0px_4px_4px_rgba(242,250,245,0.10)] rounded-[24px] border-t-[1px] border-r-[2px] border-b-[2px] border-l-0 border-[rgba(242,250,245,0.50)] backdrop-blur-[8px] flex flex-col gap-[24px]"
        >
          {/* Cabeçalho */}
          <div className="w-full flex flex-col gap-2 text-center">
            <h1 className="text-[#F2FAF5] text-[24px] sm:text-[32px] font-bold leading-tight">
              Vamos começar seu cadastro!
            </h1>
            <p className="text-[#F2FAF5] text-[16px] sm:text-[20px] font-medium leading-relaxed">
              Por favor adicione seus dados nos campos abaixo:
            </p>
          </div>

          {/* Campo: Nome */}
          <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Nome"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal outline-none"
            />
          </div>

          {/* Campo: Sobrenome */}
          <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="text"
              name="sobrenome"
              value={formData.sobrenome}
              onChange={handleChange}
              placeholder="Sobrenome"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal outline-none"
            />
          </div>

          {/* Campo: E-mail */}
          <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="E-mail"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal outline-none"
            />
          </div>

          {/* Campo: Telefone celular */}
          <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="Telefone celular"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal outline-none"
            />
          </div>

          {/* Botão Avançar */}
          <div className="w-full flex justify-end mt-2">
            <button
              type="submit"
              className="w-full sm:w-auto h-[48px] px-[36px] bg-[#2FA862] hover:bg-[#14C45A] rounded-[10px] flex justify-center items-center text-white text-[16px] font-medium transition-colors cursor-pointer shadow-lg"
            >
              Avançar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};