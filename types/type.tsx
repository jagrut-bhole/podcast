export interface SessionData {
  name: string;
  date: string; // ISO format
  startTime: string;
  endTime: string;
  inviteEmails: string[];
  description: string;
}

export interface TimeOption {
  label: string;
  value: number; // minutes from start of day
}
