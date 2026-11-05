import React from 'react';

// Dados simulados
const users = [
  { id: '85548555', name: 'João Augusto de Souza', email: 'joao.augusto@gmail.com', role: 'Administrador', status: 'Ativo', lastAccess: '12/10/2026' },
  { id: '85548556', name: 'Maria Clara Santos', email: 'Maria.Sants@gmail.com', role: 'Administrador', status: 'Inativo', lastAccess: '13/10/2026' },
  { id: '85548557', name: 'Carlos Eduardo Lima', email: 'Lima_carlos.Edu@gmail.com', role: 'Usuário', status: 'Ativo', lastAccess: '14/09/2026' },
  { id: '85548558', name: 'Maria Clara Santos', email: 'Clara_maria.Santos@gmail.com', role: 'Administrador', status: 'Ativo', lastAccess: '15/09/2026' },
  { id: '85548559', name: 'José Antônio Ferreira', email: 'Antonio_jose.Ferreira@gmail.com', role: 'Usuário', status: 'Inativo', lastAccess: '10/09/2026' },
];

interface AdminDashboardProps {
  onLogout?: () => void;
  onViewPublicDashboard?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onViewPublicDashboard }) => {
  return (
    <div className="min-h-screen w-full bg-[#07150E] font-sans flex flex-col items-center pb-12">
      
      {/* CABEÇALHO */}
      <header className="w-full max-w-[1200px] mt-8 px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] bg-[#06401D] rounded-full relative overflow-hidden shadow-[inset_0px_-5px_5px_rgba(11,42,28,0.5)] shrink-0">
            <svg viewBox="0 0 250 250" className="w-full h-full">
              <path className="text-[#14C45A]/30" fill="currentColor" d="M40,20 C75,15 110,35 120,65 C130,95 95,125 85,155 C75,185 110,215 95,245 L0,250 L0,0 Z" />
              <path className="text-[#14C45A]/30" fill="currentColor" d="M170,10 C195,40 165,80 180,115 C195,150 155,175 130,215 C115,240 160,250 200,250 L250,250 L250,0 Z" />
              <rect x="33" y="101" width="55" height="55" fill="none" stroke="#14C45A" strokeWidth="3" />
              <rect x="50" y="87" width="55" height="55" fill="none" stroke="#14C45A" strokeWidth="3" />
              <text x="47" y="137" fill="white" fontSize="40" fontWeight="bold" fontFamily="sans-serif">GreenER</text>
            </svg>
          </div>
          
          <h1 className="text-[#8FA89B] text-[20px] sm:text-[24px] font-medium leading-tight">
            Painel de gerenciamento de perfis
          </h1>
        </div>

        <div className="flex items-center gap-[16px]">
          <button className="w-[44px] h-[44px] rounded-full border-[2px] border-[#0B7335] flex items-center justify-center text-[#F2FAF5] hover:bg-[#0B7335]/20 transition-colors shrink-0">
            <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </button>

          <div className="relative flex items-center w-full max-w-[340px] h-[48px] bg-[#050E09] border-[2px] border-[#0B7335] rounded-[10px] overflow-hidden">
            <div className="pl-[16px] pr-[10px] flex items-center justify-center text-white">
              <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Busque por um usuário aqui..." 
              className="w-[280px] h-full bg-transparent text-[#F2FAF5] placeholder-[#8FA89B] text-[15px] outline-none pr-[16px]" 
            />
          </div>

          <div className="w-[52px] h-[52px] rounded-full border-[2px] border-[#0B7335] flex items-center justify-center bg-transparent shrink-0 cursor-pointer hover:bg-[#0B7335]/10 transition-colors">
            <svg className="w-[28px] h-[28px] text-[#0B7335]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL DA LISTA */}
      <main className="w-full max-w-[1200px] mt-10 px-6 flex flex-col gap-6">
        
        {/* Barra de Ferramentas */}
        <div className="w-full flex flex-wrap justify-between items-center gap-4">
          <button className="h-[40px] px-4 rounded-[10px] border-[1.5px] border-[#14C45A] text-[#14C45A] hover:bg-[#14C45A]/10 flex items-center gap-2 font-medium transition-colors whitespace-nowrap shrink-0">
            <span>+</span> Adicionar novo usuário
          </button>
          
          <div className="flex gap-4">
            <button className="h-[40px] px-4 rounded-[10px] border-[1.5px] border-[#14C45A] text-white flex items-center gap-2 hover:bg-[#14C45A]/10 transition-colors">
              Grupo <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <button className="h-[40px] px-4 rounded-[10px] border-[1.5px] border-[#14C45A] text-white flex items-center gap-2 hover:bg-[#14C45A]/10 transition-colors">
              Status <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
          </div>
        </div>

        {/* Lista de Utilizadores */}
        <div className="flex flex-col gap-4">
          {users.map((user) => {
            const isActive = user.status === 'Ativo';
            
            return (
              <div 
                key={user.id} 
                // Grid Mágico: A última coluna é 'auto' (tamanho exato dos botões). O resto é dividido em proporções (fr).
                // O minmax(0, 1fr) impede que textos grandes rebentem as colunas.
                className="w-full p-[16px] bg-[#0E2218] rounded-[12px] border border-[#8FA89B] flex flex-col lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_auto] lg:items-center gap-[16px] lg:gap-[24px]"
              >
                
                {/* 1. Nome e Avatar */}
                <div className="flex items-center gap-[16px] min-w-0">
                  <div className="w-[56px] h-[56px] rounded-full border-[3px] border-[#1F8A4C] flex items-center justify-center shrink-0">
                    <svg className="w-[24px] h-[24px] text-[#1F8A4C]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <div className="text-[#F7F7F5] text-[18px] font-normal leading-[28px] truncate">
                      {user.name}
                    </div>
                    <div className="text-[#8FA89B] text-[14px] font-normal leading-[20px] truncate">
                      Usuário: {user.id}
                    </div>
                  </div>
                </div>

                {/* 2. E-mail */}
                <div className="flex flex-col gap-[2px] min-w-0">
                  <div className="text-[#8FA89B] text-[14px] font-normal leading-[20px]">E-mail</div>
                  <div className="text-[#F7F7F5] text-[14px] font-normal leading-[20px] truncate">{user.email}</div>
                </div>

                {/* 3. Nível de Acesso */}
                <div className="flex flex-col gap-[2px] min-w-0">
                  <div className="text-[#8FA89B] text-[14px] font-normal leading-[20px]">Nível de acesso</div>
                  <div className="text-[#F7F7F5] text-[14px] font-normal leading-[20px] truncate">{user.role}</div>
                </div>

                {/* 4. Status e Último Acesso */}
                <div className="flex flex-col gap-[8px] min-w-0">
                  <div className={`px-[10px] py-[4px] bg-[#0E2218] rounded-[10px] border flex items-center justify-center w-max ${isActive ? 'border-[#14C45A]' : 'border-[#9C2A2A]'}`}>
                    <div className={`text-[14px] font-normal leading-[20px] ${isActive ? 'text-[#14C45A]' : 'text-[#9C2A2A]'}`}>
                      {user.status}
                    </div>
                  </div>
                  <div className="text-[#8FA89B] text-[14px] font-normal leading-[20px] truncate">
                    Último acesso: {user.lastAccess}
                  </div>
                </div>

                {/* 5. Ações (Blindadas pelo Grid Column 'auto') */}
                <div className="flex items-center gap-[10px] shrink-0 mt-2 lg:mt-0 justify-end">
                  
                  {/* Botão Vermelho (Excluir) - whitespace-nowrap direto no botão */}
                  <button className="whitespace-nowrap shrink-0 px-[12px] py-[10px] bg-[#9C2A2A] hover:bg-[#852323] rounded-[10px] border border-[#F34F0E] flex items-center gap-[8px] transition-colors">
                    <span className="text-[#F7F7F5] text-[14px] font-medium leading-[24px]">Excluir usuário</span>
                    <svg className="w-[20px] h-[20px] text-[#F7F7F5] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                  
                  {/* Botão Verde (Relatórios) - whitespace-nowrap direto no botão */}
                  <button className="whitespace-nowrap shrink-0 px-[12px] py-[10px] bg-[#2FA862] hover:bg-[#258a50] rounded-[10px] border border-[#0E3B25] flex items-center justify-center transition-colors">
                    <span className="text-white text-[14px] font-medium leading-[24px]">Ver relatórios</span>
                  </button>
                  
                </div>

              </div>
            );
          })}
        </div>

        {/* Rodapé com botões de Saída */}
        <div className="w-full flex flex-wrap justify-end items-center gap-4 mt-8">
          <button onClick={onLogout} className="h-[48px] px-6 bg-[#EF4444] hover:bg-[#DC2626] rounded-[10px] text-white font-medium flex items-center gap-2 transition-colors shadow-lg whitespace-nowrap">
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg> Sair
          </button>
          <button onClick={onViewPublicDashboard} className="h-[48px] px-6 bg-[#14C45A] hover:bg-[#0E9D47] rounded-[10px] text-white font-medium transition-colors shadow-lg whitespace-nowrap">
            Ver dashboard público
          </button>
        </div>

      </main>
    </div>
  );
};