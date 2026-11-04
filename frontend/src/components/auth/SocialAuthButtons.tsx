import React from 'react';

interface SocialAuthButtonsProps {
  onSelectProvider?: (provider: 'apple' | 'google' | 'microsoft') => void;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ onSelectProvider }) => {
  return (
    <div className="w-full py-[5px] flex flex-col justify-center items-start gap-3">
      <span className="text-white text-[18px] sm:text-[20px] font-medium leading-[28px]">
        Ou entre por:
      </span>
      {/* Container flexível que quebra linha em telas pequenas */}
      <div className="w-full flex flex-wrap justify-start items-center gap-3">
        {/* Botão Apple */}
        <button type="button" onClick={() => onSelectProvider?.('apple')} className="p-[10px] rounded-[18px] border border-[#F2FAF5] hover:bg-[#F2FAF5]/15 transition-colors flex justify-start items-center gap-2 cursor-pointer flex-grow sm:flex-grow-0">
          <div className="w-[20px] h-[20px] sm:w-[25px] sm:h-[25px] flex items-center justify-center text-[#F2FAF5]">
            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.2471 13.0786C18.2373 11.4136 18.9917 10.1587 20.5151 9.2334C19.6631 8.0127 18.374 7.34131 16.6748 7.21191C15.0659 7.08496 13.3057 8.14941 12.6611 8.14941C11.98 8.14941 10.4224 7.25586 9.19678 7.25586C6.66748 7.29492 3.97949 9.27246 3.97949 13.2959C3.97949 14.4849 4.19678 15.7129 4.63135 16.9775C5.2124 18.6426 7.30713 22.7222 9.49219 22.6562C10.6348 22.6294 11.4429 21.8457 12.9297 21.8457C14.3726 21.8457 15.1196 22.6562 16.394 22.6562C18.5986 22.6245 20.4932 18.916 21.0449 17.2461C18.0884 15.8521 18.2471 13.1641 18.2471 13.0786ZM15.6812 5.63232C16.9189 4.1626 16.8066 2.82471 16.77 2.34375C15.6763 2.40723 14.4116 3.08838 13.6914 3.92578C12.8979 4.82422 12.4316 5.93506 12.5317 7.1875C13.7134 7.27783 14.7925 6.66992 15.6812 5.63232Z" fill="#F2FAF5"/>
            </svg>
          </div>
          <span className="text-[#F2FAF5] text-[14px] sm:text-[16px]">Apple</span>
        </button>

        {/* Botão Google */}
        <button type="button" onClick={() => onSelectProvider?.('google')} className="p-[10px] rounded-[18px] border border-[#F2FAF5] hover:bg-[#F2FAF5]/15 transition-colors flex justify-start items-center gap-2 cursor-pointer flex-grow sm:flex-grow-0">
          <div className="w-[20px] h-[20px] sm:w-[25px] sm:h-[25px] flex items-center justify-center text-[#F2FAF5]">
            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.35 10.5771C22.4781 11.2636 22.5479 11.9813 22.5479 12.7302C22.5479 18.5886 18.6271 22.7542 12.7052 22.7542C11.3585 22.7547 10.0248 22.4899 8.78047 21.9747C7.53613 21.4596 6.4055 20.7043 5.45321 19.752C4.50091 18.7997 3.74561 17.6691 3.23049 16.4248C2.71536 15.1804 2.4505 13.8468 2.45105 12.5C2.4505 11.1533 2.71536 9.81961 3.23049 8.57527C3.74561 7.33093 4.50091 6.2003 5.45321 5.248C6.4055 4.29571 7.53613 3.54041 8.78047 3.02529C10.0248 2.51016 11.3585 2.2453 12.7052 2.24585C15.474 2.24585 17.7875 3.2646 19.5625 4.91877L16.6719 7.80939V7.8021C15.5958 6.7771 14.2302 6.25106 12.7052 6.25106C9.32188 6.25106 6.57188 9.10939 6.57188 12.4938C6.57188 15.8781 9.32188 18.7427 12.7052 18.7427C15.775 18.7427 17.8646 16.9865 18.2938 14.5761H12.7052V10.5771H22.35Z" fill="#F2FAF5"/>
            </svg>
          </div>
          <span className="text-[#F2FAF5] text-[14px] sm:text-[16px]">Google</span>
        </button>

        {/* Botão Microsoft */}
        <button type="button" onClick={() => onSelectProvider?.('microsoft')} className="p-[10px] rounded-[18px] border border-[#F2FAF5] hover:bg-[#F2FAF5]/15 transition-colors flex justify-start items-center gap-2 cursor-pointer flex-grow sm:flex-grow-0">
          <div className="w-[20px] h-[20px] flex items-center justify-center text-[#F2FAF5]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_215_1681)">
                  <path d="M9.3275 0H0V8.9875H9.3275V0ZM20 0H10.6725V8.9875H20V0ZM9.3275 10.2638H0V20H9.3275V10.2638ZM20 10.2638H10.6725V20H20V10.2638Z" fill="#F2FAF5"/>
                </g>
                <defs>
                <clipPath id="clip0_215_1681">
                <rect width="20" height="20" fill="white"/>
                </clipPath>
                </defs>
            </svg>
          </div>
          <span className="text-[#F2FAF5] text-[14px] sm:text-[16px]">Microsoft</span>
        </button>
      </div>
    </div>
  );
};