// src/households/schemas/householdSchemas.js

// Household object
const Household = {
  $id: 'Household',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenant_id: { type: 'string', format: 'uuid' },
    display_name: { type: ['string', 'null'] },
    primary_contact_id: { type: ['string', 'null'], format: 'uuid' },
    notes: { type: ['string', 'null'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'tenant_id', 'created_at', 'updated_at']
};

const CreateHousehold = {
  $id: 'CreateHousehold',
  type: 'object',
  properties: {
    tenant_id: { type: 'string', format: 'uuid' },
    display_name: { type: ['string', 'null'] },
    primary_contact_id: { type: ['string', 'null'], format: 'uuid' },
    notes: { type: ['string', 'null'] }
  },
  required: ['tenant_id']
};

const HouseholdMember = {
  $id: 'HouseholdMember',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    household_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    role: { type: ['string', 'null'] }, // e.g., 'primary_owner', 'partner'
    status: { type: ['string', 'null'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'household_id', 'user_id', 'created_at', 'updated_at']
};

const AddHouseholdMember = {
  $id: 'AddHouseholdMember',
  type: 'object',
  properties: {
    user_id: { type: 'string', format: 'uuid' },
    role: { type: ['string', 'null'] }
  },
  required: ['user_id']
};

export const householdSchemas = {
  Household,
  CreateHousehold,
  HouseholdMember,
  AddHouseholdMember
};
