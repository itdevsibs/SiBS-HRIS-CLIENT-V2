import React from "react";

export default function ChatTypingIndicator({
  activeTypingMembers = [],
  typingLabel = "",
  renderAvatar = null,
  className = "",
}) {
  if (!Array.isArray(activeTypingMembers) || activeTypingMembers.length === 0) {
    return null;
  }

  const visibleMembers = activeTypingMembers.slice(0, 2);
  const overflowCount = activeTypingMembers.length - 2;

  return (
    <div
      data-testid="chat-typing-indicator"
      className={`flex items-end gap-2 px-1 py-1.5 transition-opacity duration-200 ease-out ${className}`}
      aria-live="polite"
      aria-label={typingLabel || "Typing indicator"}
    >
      {/* Avatars */}
      <div className="flex shrink-0 items-center -space-x-1.5">
        {visibleMembers.map((member, idx) => (
          <div
            key={member?.id || member?.sibsId || idx}
            className="relative z-10"
          >
            {renderAvatar ? (
              renderAvatar(member, idx)
            ) : (
              <div
                data-testid="typing-avatar"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-sibs-navy text-[8px] font-bold text-white shadow-xs ring-1 ring-white"
              >
                {member?.initials || "U"}
              </div>
            )}
          </div>
        ))}

        {overflowCount > 0 && (
          <div
            data-testid="typing-overflow-badge"
            className="relative z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-600 px-1 text-[7px] font-extrabold text-white ring-1 ring-white"
          >
            +{overflowCount}
          </div>
        )}
      </div>

      {/* Speech Bubble & Label */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-xs border border-sibs-border/80 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-xs">
          <span className="sibs-typing-dot h-1.5 w-1.5 rounded-full bg-sibs-muted [animation-delay:0ms]" />
          <span className="sibs-typing-dot h-1.5 w-1.5 rounded-full bg-sibs-muted [animation-delay:180ms]" />
          <span className="sibs-typing-dot h-1.5 w-1.5 rounded-full bg-sibs-muted [animation-delay:360ms]" />
        </div>

        {typingLabel ? (
          <span
            data-testid="typing-label"
            className="min-w-0 max-w-[200px] truncate text-[10px] font-semibold text-sibs-muted animate-pulse select-none sm:max-w-[280px]"
          >
            {typingLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
