// Simple environment validation - no mock
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getBandEnv() {
  return {
    BAND_API_URL: process.env.BAND_API_URL || 'https://app.band.ai',
    BAND_AGENT_API_KEY: process.env.BAND_AGENT_API_KEY || '',
    CLAIM_REVIEWER_ID: process.env.CLAIM_REVIEWER_ID || '',
    INVESTIGATOR_ID: process.env.INVESTIGATOR_ID || '',
    ADJUSTER_ID: process.env.ADJUSTER_ID || '',
    GATEWAY_ID: process.env.GATEWAY_ID || '',
    RESOLVER_ID: process.env.RESOLVER_ID || '',
  };
}