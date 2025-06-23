// src/chat/schemas/chatSchemas.js

// Chat object
const Chat = {
  $id: 'Chat',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenant_id: { type: 'string', format: 'uuid' },
    chat_type: { type: 'string' },
    household_id: { type: ['string', 'null'], format: 'uuid' },
    service_id: { type: ['string', 'null'] }, // handle linking in code
    title: { type: ['string', 'null'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    last_message_at: { type: ['string', 'null'], format: 'date-time' },
    is_archived: { type: 'boolean' }
  },
  required: ['id', 'tenant_id', 'chat_type', 'created_at', 'updated_at']
};

// CreateChat payload
const CreateChat = {
  $id: 'CreateChat',
  type: 'object',
  properties: {
    tenant_id: { type: 'string', format: 'uuid' },
    chat_type: { type: 'string' },
    household_id: { type: ['string', 'null'], format: 'uuid' },
    service_id: { type: ['string', 'null'] },
    title: { type: ['string', 'null'] },
    participant_user_ids: { type: 'array', items: { type: 'string', format: 'uuid' } }
  },
  required: ['tenant_id', 'chat_type', 'participant_user_ids']
};

// ChatParticipant object
const ChatParticipant = {
  $id: 'ChatParticipant',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    chat_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    role: { type: ['string', 'null'] },
    joined_at: { type: 'string', format: 'date-time' },
    left_at: { type: ['string', 'null'], format: 'date-time' }
  },
  required: ['id', 'chat_id', 'user_id', 'joined_at']
};

// ChatMessage object
const ChatMessage = {
  $id: 'ChatMessage',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    chat_id: { type: 'string', format: 'uuid' },
    sender_id: { type: 'string', format: 'uuid' },
    body: { type: ['string', 'null'] },
    message_type: { type: 'string' },
    memory_id: { type: ['string', 'null'], format: 'uuid' },
    attachment_url: { type: ['string', 'null'] },
    reactions: {
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          emoji: { type: 'string' }
        },
        required: ['user_id', 'emoji']
      }
    },
    edited_at: { type: ['string', 'null'], format: 'date-time' },
    deleted_at: { type: ['string', 'null'], format: 'date-time' },
    created_at: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'chat_id', 'sender_id', 'message_type', 'created_at']
};

// CreateChatMessage payload
const CreateChatMessage = {
  $id: 'CreateChatMessage',
  type: 'object',
  properties: {
    chat_id: { type: 'string', format: 'uuid' },
    sender_id: { type: 'string', format: 'uuid' },
    body: { type: ['string', 'null'] },
    message_type: { type: 'string' },
    memory_id: { type: ['string', 'null'], format: 'uuid' },
    attachment_url: { type: ['string', 'null'] }
  },
  required: ['chat_id', 'sender_id', 'message_type']
};

// ChatMessageRead object
const ChatMessageRead = {
  $id: 'ChatMessageRead',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    message_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    read_at: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'message_id', 'user_id', 'read_at']
};

// Add more as needed (e.g., UpdateChat, EditMessage, AddReaction)

export const chatSchemas = {
  Chat,
  CreateChat,
  ChatParticipant,
  ChatMessage,
  CreateChatMessage,
  ChatMessageRead
};
