function cleanText(value) {
  return String(value || "").trim();
}

/**
 * Calculates a Map of messageId -> array of member objects who have read up to that message.
 *
 * For each member (excluding the current viewing user):
 * - Identifies their latest readable message (id <= lastReadMessageId).
 * - System notices (UNSENT, MEMBER_ADDED, MEMBER_REMOVED) and unsent messages are excluded.
 * - If the latest readable message was authored by the member themselves, they are not
 *   credited with a seen receipt on their own message (authors don't "see" their own text).
 * - Avoids pinning members to old outgoing messages when newer messages have been read.
 */
export function calculateSeenMembersByMessageId({
  members = [],
  currentMessages = [],
  currentSibsId = "",
}) {
  const result = new Map();
  const safeMembers = Array.isArray(members) ? members : [];
  const safeMessages = Array.isArray(currentMessages) ? currentMessages : [];
  const normalizedCurrentSibsId = cleanText(currentSibsId);

  if (!safeMembers.length || !safeMessages.length || !normalizedCurrentSibsId) {
    return result;
  }

  const readableMessages = safeMessages.filter((message) => {
    const messageType = cleanText(message?.messageType).toUpperCase();

    return (
      !message?.unsent &&
      messageType !== "UNSENT" &&
      messageType !== "MEMBER_ADDED" &&
      messageType !== "MEMBER_REMOVED" &&
      Number(message?.id || 0) > 0
    );
  });

  if (!readableMessages.length) {
    return result;
  }

  safeMembers.forEach((member) => {
    const memberSibsId = cleanText(member?.sibsId);
    if (!memberSibsId || memberSibsId === normalizedCurrentSibsId) return;

    const lastReadMessageId = Number(
      member?.lastReadMessageId ?? member?.last_read_message_id ?? 0,
    );
    if (!lastReadMessageId) return;

    let latestSeenMessage = null;
    for (let index = readableMessages.length - 1; index >= 0; index -= 1) {
      const message = readableMessages[index];
      if (Number(message?.id || 0) <= lastReadMessageId) {
        latestSeenMessage = message;
        break;
      }
    }

    if (!latestSeenMessage) return;

    // A member is never shown as a "seen receipt" under a message they authored themselves.
    if (cleanText(latestSeenMessage?.senderSibsId) === memberSibsId) {
      return;
    }

    const messageId = Number(latestSeenMessage.id);
    const currentReaders = result.get(messageId) || [];
    result.set(messageId, [...currentReaders, member]);
  });

  return result;
}
