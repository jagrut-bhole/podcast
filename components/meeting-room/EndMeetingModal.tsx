"use client";

interface EndMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
  onEndForAll: () => void;
}

export function EndMeetingModal({
  isOpen,
  onClose,
  onLeave,
  onEndForAll,
}: EndMeetingModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover above button */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-3 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
        {/* Arrow */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a1a] border-r border-b border-white/10 rotate-45" />

        {/* Actions */}
        <div className="space-y-2 relative z-10">
          {/* Leave Meeting */}
          <button
            onClick={onLeave}
            className="w-full p-3 bg-gray-700/50 hover:bg-gray-700 border border-white/10 rounded-lg text-left transition-all duration-200"
          >
            <h3 className="text-white text-sm font-medium">Leave Meeting</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Meeting continues for others
            </p>
          </button>

          {/* End for All */}
          <button
            onClick={onEndForAll}
            className="w-full p-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-left transition-all duration-200"
          >
            <h3 className="text-red-400 text-sm font-medium">
              End for Everyone
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">Meeting ends for all</p>
          </button>
        </div>
      </div>
    </>
  );
}
