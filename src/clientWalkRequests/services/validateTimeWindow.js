// src/clientWalkRequests/services/validateTimeWindow.js
export function validateTimeWindow(window_start, window_end) {
  if (!window_start || !window_end) return 'window_start and window_end are required.';
  const [startH, startM] = window_start.split(':').map(Number);
  const [endH, endM] = window_end.split(':').map(Number);
  if (
    isNaN(startH) || isNaN(startM) ||
    isNaN(endH) || isNaN(endM)
  ) return 'window_start and window_end must be valid times (HH:MM).';
  if (endH < startH || (endH === startH && endM <= startM)) {
    return 'window_end must be after window_start.';
  }
  return null;
}
