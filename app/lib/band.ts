import { getBandEnv } from './env';

function env() {
  return getBandEnv();
}

export interface BandError extends Error {
  status?: number;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function bandFetch(
  path: string, 
  options: RequestInit = {},
  retries = 3
): Promise<any> {
  const { BAND_API_URL, BAND_AGENT_API_KEY } = env();
  const maxRetries = retries;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Request timeout after 30000ms`)), 30000)
      );

      const fetchPromise = fetch(`${BAND_API_URL}/api/v1/agent${path}`, {
        ...options,
        headers: { 
          "Content-Type": "application/json", 
          "X-API-Key": BAND_AGENT_API_KEY, 
          ...options.headers 
        },
      });

      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Band API attempt ${attempt + 1}/${maxRetries + 1}: ${res.status} - ${errorText}`);
        
        if (res.status === 429 || res.status >= 500) {
          // Rate limit or server error - retry with exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Retrying in ${backoffMs}ms...`);
          await delay(backoffMs);
          continue;
        }
        
        throw new Error(`Band API ${res.status}: ${errorText}`);
      }

      return res.json();
    } catch (error: any) {
      lastError = error;
      console.error(`Band fetch attempt ${attempt + 1}/${maxRetries + 1} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  throw lastError || new Error(`Band API request failed after ${maxRetries + 1} attempts`);
}

export async function validateBandEnvironment(): Promise<boolean> {
  const requiredVars = ['BAND_AGENT_API_KEY', 'CLAIM_REVIEWER_ID', 'INVESTIGATOR_ID', 'ADJUSTER_ID'];
  const missing = requiredVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing Band environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
}
}

export async function createBandRoom(): Promise<string> {
  const { data } = await bandFetch('/chats', { 
    method: 'POST', 
    body: JSON.stringify({ chat: {} }) 
  });
  return data.id;
}

export async function addParticipantToRoom(roomId: string, agentId: string): Promise<void> {
  await bandFetch(`/chats/${roomId}/participants`, {
    method: "POST",
    body: JSON.stringify({ participant: { participant_id: agentId } }),
  });
}

export async function sendMessageToRoom(
  roomId: string, 
  content: string, 
  mentions: { id: string }[] = []
): Promise<void> {
  await bandFetch(`/chats/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message: { content, mentions } }),
  });
}