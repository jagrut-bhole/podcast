import { TimeOption } from "@/types/type";

export const generateTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayMinute = minute.toString().padStart(2, "0");
      const label = `${displayHour.toString().padStart(2, "0")}:${displayMinute} ${ampm}`;
      options.push({
        label,
        value: hour * 60 + minute,
      });
    }
  }
  return options;
};

export const TIME_OPTIONS = generateTimeOptions();

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};
