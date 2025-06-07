// src/pricingRules/services/requiredFields.js

export const serviceTypeRequiredFields = {
  boarding: ['tenant_id', 'drop_off_day', 'pick_up_day', 'dog_ids'],
  walk: ['tenant_id', 'walk_date', 'walk_length_minutes', 'dog_ids'],
  daycare: ['tenant_id', 'session_date', 'dog_ids'],
  // Add more as needed
};
