// src/availability/services/availabilityService.js

const DEFAULT_PADDING_MINUTES = 5; // can later be per-tenant

/**
 * Returns walks for a given day, with confirmed/scheduled status only.
 */
export async function fetchBusyIntervals(server, date, tenant_id) {
  // Query walks for the day (status: scheduled/completed), exclude canceled/draft
  const { data, error } = await server.supabase
    .from('walks')
    .select('walker_id, scheduled_at, duration_minutes')
    .eq('tenant_id', tenant_id)
    .gte('scheduled_at', date + 'T00:00:00')
    .lt('scheduled_at', date + 'T23:59:59')
    .in('status', ['scheduled', 'completed']);

  if (error) throw error;
  return data.map(walk => ({
    walker_id: walk.walker_id,
    start: new Date(walk.scheduled_at),
    end: new Date(new Date(walk.scheduled_at).getTime() + walk.duration_minutes * 60000)
  }));
}

/**
 * Generates a heatmap array (every 5 mins by default) showing how many walkers are busy at each time.
 */
export function buildHeatmap(busyIntervals, walkLength, padding = DEFAULT_PADDING_MINUTES) {
  const slots = [];
  const step = 5; // minutes per slot

  // day runs from 5am to 9pm (customize if needed)
  const dayStart = 5 * 60, dayEnd = 21 * 60; // in minutes

  for (let t = dayStart; t < dayEnd; t += step) {
    const slotStart = t - padding;
    const slotEnd = t + walkLength + padding;

    // How many walkers are busy during this slot?
    const count = busyIntervals.filter(({ start, end }) => {
      const walkStart = toMinutes(start);
      const walkEnd = toMinutes(end);
      // pad each interval
      return walkStart - padding < slotEnd && walkEnd + padding > slotStart;
    }).length;

    slots.push({
      time: minutesToHHMM(t),
      busy: count,
      available: count === 0 // True if at least one walker free (can expand to more logic)
    });
  }
  return slots;
}

/**
 * Helper: parse time to minutes since midnight.
 */
function toMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Helper: format minutes to "HH:mm"
 */
function minutesToHHMM(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Placeholder: Fetches tenant blackouts (closed days) from settings
export async function fetchBlackouts(server, tenant_id) {
  // Simulate pulling from a settings table, or static config for now.
  // TODO: Connect to an actual table if you add one
  return [
    // { day: '2024-07-04', note: 'Independence Day' },
    // { day: '2024-12-25', note: 'Christmas' }
  ];
}
