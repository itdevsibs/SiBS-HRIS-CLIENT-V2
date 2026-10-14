/**
 * Calendar presentation only: a booked/busy time replaces the open-interview
 * availability card for that same user's Google Calendar. Never delete or
 * mutate the underlying availability event: cancellations/reschedules can
 * release the slot again, and longer availability windows retain free slots.
 */
const SLOT_MINUTES = 30;

function timeToMinutes(label) {
  const match = String(label || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return (hour % 12) * 60 + minute + (match[3].toUpperCase() === 'PM' ? 720 : 0);
}

function minuteLabel(value) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

function isInterviewAvailability(event) {
  return event?.scheduleType === 'Interview availability';
}

function isBusyCalendarEvent(event) {
  if (isInterviewAvailability(event)) return false;
  // An employment start date is an HRIS informational milestone rather than
  // an actual appointment occupying the interviewer's calendar.
  if (event?.recruitmentEventType === 'EXPECTED_START') return false;
  if (event?.availability === 'Free' || event?.status === 'Cancelled' || event?.status === 'Declined') return false;
  return true;
}

/** Return display-only cards; calendar storage and edit payloads stay intact. */
export function buildCalendarDisplayEvents(events = []) {
  const busyByDay = new Map();

  for (const event of events) {
    if (!event?.date || !isBusyCalendarEvent(event)) continue;
    const allDay = event.startTime === 'All Day';
    const start = allDay ? 0 : timeToMinutes(event.startTime);
    const end = allDay ? 24 * 60 : timeToMinutes(event.endTime);
    if (start === null || end === null || end <= start) continue;
    const blocks = busyByDay.get(event.date) || [];
    blocks.push([start, end]);
    busyByDay.set(event.date, blocks);
  }

  const visible = [];
  for (const event of events) {
    if (!isInterviewAvailability(event)) {
      visible.push(event);
      continue;
    }

    const start = timeToMinutes(event.startTime);
    const end = timeToMinutes(event.endTime);
    const dayBlocks = busyByDay.get(event.date) || [];
    if (start === null || end === null || end <= start || !dayBlocks.length) {
      visible.push(event);
      continue;
    }

    const overlaps = dayBlocks.some(([from, to]) => from < end && to > start);
    if (!overlaps) {
      visible.push(event);
      continue;
    }

    // A long window might contain several 30-minute slots. Hide only booked
    // slots, not the entire availability window.
    for (let minute = start; minute + SLOT_MINUTES <= end; minute += SLOT_MINUTES) {
      const occupied = dayBlocks.some(([from, to]) => from < minute + SLOT_MINUTES && to > minute);
      if (occupied) continue;
      visible.push({
        ...event,
        id: `${event.id}-slot-${minute}`,
        startTime: minuteLabel(minute),
        endTime: minuteLabel(minute + SLOT_MINUTES),
        originalCalendarEvent: event,
      });
    }
  }
  return visible;
}

/** Split availability cards still edit/delete/reschedule the real Google event. */
export function sourceCalendarEvent(event) {
  return event?.originalCalendarEvent || event;
}
