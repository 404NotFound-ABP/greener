import React, { useEffect, useState } from 'react';
import { OrbitsBackground } from '../components/auth/OrbitsBackground';
import { GreenerGlobeLogo } from '../components/auth/GreenerGlobeLogo';

export interface DadosCadastro {
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
}

interface RegisterProps {
  initialData?: Partial<DadosCadastro>;
  onNextStep?: (dados: DadosCadastro) => void;
  onGoToLogin?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ initialData, onNextStep, onGoToLogin }) => {
  const [formData, setFormData] = useState<DadosCadastro>({
    nome: initialData?.nome ?? '',
    sobrenome: initialData?.sobrenome ?? '',
    email: initialData?.email ?? '',
    telefone: initialData?.telefone ?? '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        nome: initialData.nome ?? prev.nome,
        sobrenome: initialData.sobrenome ?? prev.sobrenome,
        email: initialData.email ?? prev.email,
        telefone: initialData.telefone ?? prev.telefone,
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNextStep?.(formData);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07150E] overflow-x-hidden overflow-y-auto flex items-center justify-center px-4 py-8 font-sans select-none">
      {/* Container do Conjunto (Órbitas + Logo + Card) com a mesma escala responsiva do Login */}
      <div className="relative w-full max-w-[390px] sm:max-w-[600px] mt-[60px] sm:mt-[120px] mb-[16px] sm:mb-[20px] sm:scale-[0.78] lg:scale-[0.82] xl:scale-[0.84] 2xl:scale-[0.88] origin-center transition-transform duration-300">
        {/* 1. ÓRBITAS */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[165px] sm:-top-[241px] w-[1440px] h-[1024px] scale-[0.62] sm:scale-100 origin-top pointer-events-none z-0">
          <OrbitsBackground />
        </div>

        {/* 2. GLOBO E LOGO */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[50px] sm:-top-[103px] pointer-events-none z-20">
          <GreenerGlobeLogo />
        </div>

        {/* 3. CARD DE CADASTRO */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full pt-[64px] sm:pt-[165px] pb-[28px] sm:pb-[32px] px-5 sm:px-[30px] bg-[rgba(242,250,245,0.12)] shadow-[0px_24px_48px_rgba(21,32,26,0.25),inset_0px_4px_4px_rgba(242,250,245,0.10)] rounded-[24px] border-t-[1px] border-r-[2px] border-b-[2px] border-l-0 border-[rgba(242,250,245,0.50)] backdrop-blur-[8px] flex flex-col gap-4 sm:gap-[24px]"
        >
          {/* Cabeçalho */}
          <div className="w-full flex flex-col gap-[6px] sm:gap-2 text-center">
            <h1 className="text-[#F2FAF5] text-[24px] sm:text-[32px] font-bold leading-tight">
              Vamos começar seu cadastro!
            </h1>
            <p className="text-[#F2FAF5] text-[14px] sm:text-[20px] font-medium leading-[20px] sm:leading-relaxed">
              Por favor adicione seus dados nos campos abaixo:
            </p>
          </div>

          {/* Campo: Nome */}
          <div className="w-full h-[50px] sm:h-[56px] px-4 sm:px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Nome"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5]/90 text-[15px] sm:text-[16px] font-normal outline-none"
            />
          </div>

          {/* Campo: Sobrenome */}
          <div className="w-full h-[50px] sm:h-[56px] px-4 sm:px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="text"
              name="sobrenome"
              value={formData.sobrenome}
              onChange={handleChange}
              placeholder="Sobrenome"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5]/90 text-[15px] sm:text-[16px] font-normal outline-none"
            />
          </div>

          {/* Campo: E-mail */}
          <div className="w-full h-[50px] sm:h-[56px] px-4 sm:px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="E-mail"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5]/90 text-[15px] sm:text-[16px] font-normal outline-none"
            />
          </div>

          {/* Campo: Telefone celular */}
          <div className="w-full h-[50px] sm:h-[56px] px-4 sm:px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="Telefone celular"
              required
              className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5]/90 text-[15px] sm:text-[16px] font-normal outline-none"
            />
          </div>

          {/* Ações: Voltar ao Login e Avançar */}
          <div className="w-full flex flex-col-reverse sm:flex-row items-center justify-between gap-3 mt-1 sm:mt-2">
            {onGoToLogin ? (
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-[#D4E3DA] hover:text-[#14C45A] text-sm underline cursor-pointer transition-colors"
              >
                Já tem uma conta? Entrar
              </button>
            ) : <span />}
            <button
              type="submit"
              className="w-full sm:w-auto h-[46px] sm:h-[48px] px-6 sm:px-[36px] bg-[#2FA862] hover:bg-[#14C45A] rounded-[10px] flex justify-center items-center text-white text-[15px] sm:text-[16px] font-medium transition-colors cursor-pointer shadow-lg ml-auto"
            >
              Avançar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
