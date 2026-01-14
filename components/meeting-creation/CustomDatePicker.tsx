import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
}

const CustomDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  isInvalid,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(new Date(value));

  const selectedDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const handlePrevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  // Helper for local YYYY-MM-DD
  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    const headers = ["S", "M", "T", "W", "T", "F", "S"];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const currentDate = new Date(year, month, d);
      const isPast = currentDate < today;
      const isSelected =
        selectedDate.getDate() === d &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;
      days.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => {
            const newDate = new Date(year, month, d);
            onChange(getLocalISODate(newDate));
            setIsOpen(false);
          }}
          className={`w-8 h-8 text-sm rounded-lg flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-[#5c5c7d] text-white font-bold"
              : isPast
                ? "text-gray-700 cursor-not-allowed"
                : "text-gray-300 hover:bg-[#333]"
          }`}
        >
          {d}
        </button>,
      );
    }

    return (
      <div className="p-4 bg-[#1e1e24] border border-gray-800 rounded-xl shadow-2xl w-[260px]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium text-sm">
              {viewDate.toLocaleString("default", { month: "long" })} {year}
            </span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handlePrevMonth}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
            </button>
            <button
              onClick={handleNextMonth}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {headers.map((h) => (
            <div key={h} className="text-[10px] text-gray-600 font-bold">
              {h}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  const displayDate = selectedDate
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "/");

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center bg-[#1c1c1c] p-2 px-3 rounded-lg border transition-colors space-x-3 text-sm text-white hover:bg-[#252525] ${
          isInvalid ? "border-red-500/50" : "border-gray-800"
        }`}
      >
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          ></path>
        </svg>
        <span>{displayDate}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          {renderCalendar()}
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
