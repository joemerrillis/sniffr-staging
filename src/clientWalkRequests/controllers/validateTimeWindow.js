// controllers/clientWalkRequests/validateTimeWindow.js
export default function validateTimeWindow(start, end) {
  // Handles "HH:MM" or "HH:MM:SS"
  const pad = s => s.length === 5 ? s + ':00' : s;
  const startT = pad(start);
  const endT = pad(end);
  return startT < endT;
}
