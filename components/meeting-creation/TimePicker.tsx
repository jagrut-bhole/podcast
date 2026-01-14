import React, { useState, useRef, useEffect } from "react";
import { TimeOption } from "@/types/type";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  options: TimeOption[];
  isInvalid?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  options,
  isInvalid,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#252525] hover:bg-[#2d2d2d] text-white px-4 py-2 rounded-md border transition-colors w-[100px] text-sm text-center font-medium focus:outline-none ${
          isInvalid ? "border-red-500/50" : "border-transparent"
        }`}
      >
        {value}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-[120px] bg-[#252525] border border-gray-700 rounded-lg shadow-2xl max-h-[250px] overflow-y-auto custom-scroll">
          {options.map((opt) => (
            <div
              key={opt.label}
              onClick={() => {
                onChange(opt.label);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                opt.label === value
                  ? "bg-[#3d3d5c] text-white font-bold"
                  : "text-gray-300 hover:bg-[#333]"
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimePicker;
