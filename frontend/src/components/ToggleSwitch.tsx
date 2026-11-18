//***BOTÕES INPUT ****//// */

import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative w-[48px] h-[28px] rounded-[14px] border border-[#166A3E] transition-colors duration-200 cursor-pointer shrink-0 ${
        checked ? 'bg-[#166A3E]' : 'bg-[#DDF1E5]'
      }`}
    >
      <span
        className={`absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white border border-[#166A3E] transition-all duration-200 ${
          checked ? 'left-[22px]' : 'left-[4px]'
        }`}
      />
    </button>
  );
};