import React from "react";

interface CustomToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
}

const CustomToggle: React.FC<CustomToggleProps> = ({ enabled, onChange }) => {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`${
        enabled ? "bg-[#555]" : "bg-[#333]"
      } relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};

export default CustomToggle;
