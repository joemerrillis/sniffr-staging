export function validateWalkReportInput(input) {
  if (!input.walk_id) return { valid: false, error: 'walk_id required' };
  if (!input.dog_ids) return { valid: false, error: 'dog_ids required' };
  if (!input.walker_id) return { valid: false, error: 'walker_id required' };
  // ...add more checks as needed
  return { valid: true };
}
