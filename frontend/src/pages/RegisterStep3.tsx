import React, { useState } from 'react';
import { OrbitsBackground } from '../components/auth/OrbitsBackground';
import { GreenerGlobeLogo } from '../components/auth/GreenerGlobeLogo';

interface RegisterStep3Props {
  onFinish?: () => void;
}

export const RegisterStep3: React.FC<RegisterStep3Props> = ({ onFinish }) => {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }
    onFinish?.();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07150E] overflow-x-hidden overflow-y-auto flex items-center justify-center px-4 sm:px-8 py-12 font-sans select-none">
      
      {/* Fundo */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-60 xl:opacity-100 flex items-center justify-center">
        <div className="w-[1440px] h-[1024px] scale-[0.35] sm:scale-[0.50] md:scale-[0.60] lg:scale-[0.75] xl:scale-[0.90] 2xl:scale-100 origin-center transition-transform duration-500">
          <OrbitsBackground />
        </div>
      </div>

      <div className="relative w-full max-w-[600px] z-10 mt-[80px] sm:mt-[120px]">
        
        {/* Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[50px] sm:-top-[70px] md:-top-[90px] lg:-top-[125px] z-20">
          <GreenerGlobeLogo />
        </div>

        {/* Formulário Principal */}
       <form
            onSubmit={handleSubmit}
            className="w-full pt-[165px] pb-[32px] px-[30px] bg-[rgba(242,250,245,0.12)] shadow-[0px_24px_48px_rgba(21,32,26,0.25),inset_0px_4px_4px_rgba(242,250,245,0.10)] rounded-[24px] border-t-[1px] border-r-[2px] border-b-[2px] border-l-0 border-[rgba(242,250,245,0.50)] backdrop-blur-[8px] flex flex-col gap-[24px]"
    >
          <div className="w-full flex flex-col gap-[16px]">
            <p className="text-[#F2FAF5] text-[18px] sm:text-[20px] font-medium leading-[28px] text-center">
              Agora para finalizar, crie sua senha de acesso ao GreenER
            </p>
            
            {/* Aviso Verde (Utilizando o design atualizado do passo anterior) */}
            <div className="w-full flex justify-start">
              <div className="flex items-start sm:items-center gap-2 px-3 py-1.5 bg-[#CFF5DE] rounded-[10px]">
                <svg className="shrink-0 mt-[2px] sm:mt-0" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_31_428)">
                    <path d="M12.1191 2.165C11.9274 1.7657 11.6267 1.42869 11.2518 1.19281C10.8769 0.956936 10.4429 0.831787 9.99995 0.831787C9.557 0.831787 9.12305 0.956936 8.74812 1.19281C8.37319 1.42869 8.07253 1.7657 7.88079 2.165L1.11745 15.4692C0.308288 17.0575 1.33079 19.1667 3.23579 19.1667H16.7641C18.6691 19.1667 19.69 17.0583 18.8825 15.4692L12.1191 2.165ZM9.99995 6.66667C10.221 6.66667 10.4329 6.75447 10.5892 6.91075C10.7455 7.06703 10.8333 7.27899 10.8333 7.5V11.6667C10.8333 11.8877 10.7455 12.0996 10.5892 12.2559C10.4329 12.4122 10.221 12.5 9.99995 12.5C9.77894 12.5 9.56698 12.4122 9.4107 12.2559C9.25442 12.0996 9.16662 11.8877 9.16662 11.6667V7.5C9.16662 7.27899 9.25442 7.06703 9.4107 6.91075C9.56698 6.75447 9.77894 6.66667 9.99995 6.66667ZM9.99995 13.75C10.221 13.75 10.4329 13.8378 10.5892 13.9941C10.7455 14.1504 10.8333 14.3623 10.8333 14.5833V15C10.8333 15.221 10.7455 15.433 10.5892 15.5893C10.4329 15.7455 10.221 15.8333 9.99995 15.8333C9.77894 15.8333 9.56698 15.7455 9.4107 15.5893C9.25442 15.433 9.16662 15.221 9.16662 15V14.5833C9.16662 14.3623 9.25442 14.1504 9.4107 13.9941C9.56698 13.8378 9.77894 13.75 9.99995 13.75Z" fillRule="evenodd" clipRule="evenodd" fill="#0B7335"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_31_428">
                      <rect width="20" height="20" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                <span className="text-[#0B7335] text-[13px] font-semibold text-left">
                  Você poderá alterar depois
                </span>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-[24px]">
            {/* Campo: Criar Senha */}
            <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Crie aqui sua senha"
                required
                className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal outline-none"
              />
            </div>

            {/* Campo: Repetir Senha */}
            <div className="w-full h-[56px] px-[20px] bg-[#F2FAF5]/20 rounded-[12px] border-[1.5px] border-[#F2FAF5] flex items-center focus-within:border-[#14C45A] transition-colors">
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha para confirmação"
                required
                className="w-full bg-transparent text-[#F7F7F5] placeholder-[#F7F7F5] text-[16px] font-normal outline-none"
              />
            </div>
          </div>

          {/* Botão Finalizar */}
          <div className="w-full flex justify-end mt-[8px]">
            <button
              type="submit"
              className="h-[48px] px-[28px] bg-[#2FA862] hover:bg-[#14C45A] rounded-[10px] flex justify-center items-center text-white text-[16px] font-medium transition-colors cursor-pointer shadow-lg"
            >
              Finalizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};