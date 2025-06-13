// src/clientWalkRequests/services/logger.js
export function log(...args) {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[clientWalkRequests]', ...args);
  }
}
