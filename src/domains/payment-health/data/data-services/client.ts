// client.ts
import { createClient } from '@hey-api/client-axios';

// Create a local client instance
export const client = createClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
});

// Export the client as default as well for convenience
export default client;
