import React from 'react';

export const OrbitsBackground: React.FC = () => {
  return (
    <div className="relative w-full h-full pointer-events-none">
      
      {/* Órbita 1: Central (Contínua) */}
      <div className="absolute w-[430px] h-[430px] left-[505px] top-[48px] rounded-[50%] border-[4px] border-[#8FA89B]" />

      {/* Órbita 2: Tracejada Verde Escura (-18deg) + Planeta Vermelho */}
      <div className="absolute w-[640px] h-[230px] left-[380.13px] top-[252.51px] origin-top-left rotate-[-18deg]">
        <div className="absolute w-[679.75px] h-[416.51px] left-0 top-0 rounded-[50%] border-[3px] border-dashed border-[#0B7335]" />
        <div className="absolute w-[19.5px] h-[19.5px] left-[536.26px] top-[52.26px] origin-top-left rotate-[10deg] bg-[#9C2A2A] rounded-[50%] shadow-[0px_0px_14px_2px_rgba(125,255,178,0.9)]" />
      </div>

      {/* Órbita 3: Contínua Clara (14deg) + Planeta Verde Brilhante */}
      <div className="absolute w-[860px] h-[330px] left-[342.69px] top-[-1.13px] origin-top-left rotate-[14deg]">
        <div className="absolute w-[914.29px] h-[528.25px] left-0 top-0 rounded-[50%] border-[3px] border-solid border-[#CFF5DE]" />
        <div className="absolute w-[12.12px] h-[12.12px] left-[679.17px] top-[448.14px] bg-[#7DFFB2] rounded-[50%] shadow-[0px_0px_14px_2px_rgba(125,255,178,0.9)]" />
      </div>

      {/* Órbita 4: Tracejada Verde Clara (-8deg) + Planeta Azul */}
      <div className="absolute w-[1080px] h-[420px] left-[156.03px] top-[130.2px] origin-top-left rotate-[-8deg]">
        <div className="absolute w-[1127.94px] h-[566.22px] left-0 top-0 rounded-[50%] border-[3px] border-dashed border-[#14C45A]" />
        <div className="absolute w-[22.59px] h-[22.59px] left-[148.97px] top-[184.11px] bg-[#1875DE] rounded-[50%] shadow-[0px_0px_14px_2px_rgba(125,255,178,0.9)]" />
      </div>

      {/* Planeta Laranja Maior (Avulso na Direita) */}
      <div className="absolute w-[60px] h-[60px] left-[1216px] top-[138.35px] origin-top-left rotate-[-8deg] bg-[#F34F0E] rounded-[50%] shadow-[0px_0px_14px_2px_rgba(125,255,178,0.2)]" />
      
    </div>
  );
};