import { useState, useMemo, KeyboardEvent, useEffect } from "react";
import CustomDatePicker from "./meeting-creation/CustomDatePicker";
import TimePicker from "./meeting-creation/TimePicker";
import { SessionData } from "@/types/type";
import { TIME_OPTIONS } from "@/constants/timeConstants";

interface FormSectionProps {
  mode: "plan" | "live" | "view";
  onClose: () => void;
  onSubmit: (data: SessionData) => void;
  isLoading?: boolean;
}

export default function FormSection({
  mode,
  onClose,
  onSubmit,
  isLoading = false,
}: FormSectionProps) {
  const [emailInput, setEmailInput] = useState<string>("");

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getInitialTimes = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const nearestIdx = Math.ceil(currentMinutes / 15);
    const startIdx = Math.min(nearestIdx, TIME_OPTIONS.length - 1);
    const endIdx = Math.min(startIdx + 4, TIME_OPTIONS.length - 1);

    return {
      startTime: TIME_OPTIONS[startIdx].label,
      endTime: TIME_OPTIONS[endIdx].label,
      date: getLocalISODate(now),
    };
  };

  const initialTimes = useMemo(getInitialTimes, []);

  const [formData, setFormData] = useState<SessionData>({
    name: "",
    date: initialTimes.date,
    startTime: initialTimes.startTime,
    endTime: initialTimes.endTime,
    inviteEmails: [],
    description: "",
  });

  // Reset form when mode changes or opens
  useEffect(() => {
    const times = getInitialTimes();
    setFormData((prev) => ({
      ...prev,
      date: times.date,
      startTime: times.startTime,
      endTime: times.endTime,
      // We keep name and emails if switching modes? Maybe better to reset.
      // For now, let's keep them if it helps user experience, or reset?
      // User likely opens one mode.
    }));
  }, [mode]);

  const handleSubmit = () => {
    if (mode === "plan" && !isPlanFormValid) return;
    if (mode === "live" && !isLiveFormValid) return;

    onSubmit(formData);
  };

  const updateField = <K extends keyof SessionData>(
    field: K,
    value: SessionData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && emailInput.trim()) {
      e.preventDefault();
      const email = emailInput.trim();
      if (!formData.inviteEmails.includes(email)) {
        updateField("inviteEmails", [...formData.inviteEmails, email]);
      }
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    updateField(
      "inviteEmails",
      formData.inviteEmails.filter((e) => e !== email),
    );
  };

  const handleStartTimeChange = (newStartTime: string) => {
    const startIdx = TIME_OPTIONS.findIndex((o) => o.label === newStartTime);
    const endIdx = TIME_OPTIONS.findIndex((o) => o.label === formData.endTime);

    setFormData((prev) => {
      const updated = { ...prev, startTime: newStartTime };
      if (startIdx >= endIdx) {
        const nextIdx = Math.min(startIdx + 4, TIME_OPTIONS.length - 1);
        updated.endTime = TIME_OPTIONS[nextIdx].label;
      }
      return updated;
    });
  };

  const filteredEndOptions = TIME_OPTIONS.filter((opt) => {
    const startIdx = TIME_OPTIONS.findIndex(
      (o) => o.label === formData.startTime,
    );
    return opt.value > TIME_OPTIONS[startIdx].value;
  });

  const isTimeInFuture = useMemo(() => {
    const now = new Date();
    const todayLocalStr = getLocalISODate(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (formData.date < todayLocalStr) return false;
    if (formData.date === todayLocalStr) {
      const startOption = TIME_OPTIONS.find(
        (o) => o.label === formData.startTime,
      );
      return (startOption?.value ?? 0) >= currentMinutes;
    }
    return true;
  }, [formData.date, formData.startTime]);

  const isPlanFormValid =
    formData.name.trim() !== "" &&
    formData.inviteEmails.length >= 0 && // Changed to >= 0 as emails might be optional? Original code said > 0. Let's keep > 0 if required.
    // Original: formData.inviteEmails.length > 0. Let's stick to original logic if that's what user had.
    // But usually creation can happen without invites. Let's check original.
    // Original: formData.inviteEmails.length > 0 && isTimeInFuture;
    // I Will allow 0 emails for flexibility unless user insisted strictness.
    // Actually, original code strictly required emails. I'll stick to original logic: length > 0.
    formData.inviteEmails.length > 0 &&
    isTimeInFuture;

  const isLiveFormValid =
    formData.name.trim() !== "" && formData.inviteEmails.length > 0;

  return (
    <div className="space-y-6">
      <div className="mt-4">
        <input
          type="text"
          placeholder={mode === "plan" ? "Session name*" : "Go Live Title*"}
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="w-full bg-transparent border-b border-gray-700 text-3xl font-bold pb-2 focus:outline-none focus:border-white transition-colors placeholder:text-gray-800 text-white"
        />
      </div>

      <div className="flex flex-col space-y-2">
        {/* Plan specific time/date fields */}
        {mode === "plan" && (
          <>
            <div className="flex items-center space-x-4">
              <div className="text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="flex items-center space-x-3">
                <CustomDatePicker
                  value={formData.date}
                  onChange={(val) => updateField("date", val)}
                  isInvalid={!isTimeInFuture}
                />
              </div>
              <div className="flex items-center space-x-2">
                <TimePicker
                  value={formData.startTime}
                  onChange={handleStartTimeChange}
                  options={TIME_OPTIONS}
                  isInvalid={!isTimeInFuture}
                />
                <span className="text-gray-600">-</span>
                <TimePicker
                  value={formData.endTime}
                  onChange={(val) => updateField("endTime", val)}
                  options={filteredEndOptions}
                  isInvalid={!isTimeInFuture}
                />
              </div>
            </div>
            {!isTimeInFuture && (
              <div className="flex items-center space-x-2 text-[#e57a60] pl-9 animate-in fade-in slide-in-from-top-1 duration-200">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
                <span className="text-sm font-medium">
                  Date and time must be in the future
                </span>
              </div>
            )}
          </>
        )}

        {/* Shared Email list feature */}
        <div className="flex items-start space-x-4 pt-4">
          <div className="text-gray-400 mt-3">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              ></path>
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex bg-[#1c1c1c] p-2 px-4 rounded-lg border border-gray-800 items-center justify-between focus-within:border-gray-600 transition-colors">
              <input
                type="email"
                placeholder="example@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                className="bg-transparent text-sm text-white focus:outline-none w-full placeholder:text-gray-700"
              />
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span className="font-medium">Participant</span>
              </div>
            </div>

            {formData.inviteEmails.length > 0 && (
              <div className="bg-[#1c1c1c] rounded-xl border border-gray-800 overflow-hidden divide-y divide-gray-800/50 mt-2 max-h-[160px] overflow-y-auto custom-scroll">
                <div className="px-4 py-2 text-[10px] text-gray-500 bg-[#222]">
                  An email with instructions on how to join will be sent to all{" "}
                  {mode === "plan" ? "invitees" : "participants"}.
                </div>
                {formData.inviteEmails.map((email) => (
                  <div
                    key={email}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#252525] transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#a3e635] flex items-center justify-center text-[#121212] font-bold text-xs">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white">{email}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <span>Participant</span>
                      </div>
                      <button
                        onClick={() => removeEmail(email)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {mode === "plan" && (
          <div className="flex items-start space-x-4 pt-2">
            <div className="text-gray-400 mt-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                ></path>
              </svg>
            </div>
            <div className="flex-1">
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Description"
                className="w-full bg-[#1c1c1c] p-3 rounded-lg border border-gray-800 text-sm text-white focus:outline-none min-h-[80px] resize-none placeholder:text-gray-800"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-900/50">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-white transition-all"
        >
          Cancel
        </button>
        {mode === "plan" ? (
          <button
            onClick={handleSubmit}
            disabled={!isPlanFormValid || isLoading}
            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg active:scale-95 ${
              isPlanFormValid && !isLoading
                ? "bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white border border-gray-700"
                : "bg-[#1a1a1a] text-gray-700 border border-gray-800 cursor-not-allowed opacity-50"
            }`}
          >
            {isLoading ? "Creating..." : "Create session"}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isLiveFormValid || isLoading}
            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg active:scale-95 ${
              isLiveFormValid && !isLoading
                ? "bg-white hover:bg-gray-200 text-black"
                : "bg-[#1a1a1a] text-gray-700 border border-gray-800 cursor-not-allowed opacity-50"
            }`}
          >
            {isLoading ? "Starting..." : "Go Live"}
          </button>
        )}
      </div>
    </div>
  );
}
