import { NextResponse } from 'next/server';
import { getBandEnv } from '@/app/lib/env';

export async function GET() {
  try {
    // Test Band API connection
    const bandEnv = getBandEnv();
    
    const bandTest = await fetch(`${bandEnv.BAND_API_URL}/api/v1/agent/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': bandEnv.BAND_AGENT_API_KEY
      },
      body: JSON.stringify({ chat: {} }),
      signal: AbortSignal.timeout(10000)
    });

    const bandHealthy = bandTest.ok;
    const bandStatus = bandTest.status;
    
    return NextResponse.json({
      status: bandHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        band_api: {
          healthy: bandHealthy,
          status: bandStatus,
          url: bandEnv.BAND_API_URL,
          agents: {
            reviewer: !!bandEnv.CLAIM_REVIEWER_ID,
            investigator: !!bandEnv.INVESTIGATOR_ID,
            adjuster: !!bandEnv.ADJUSTER_ID,
            gateway: !!bandEnv.GATEWAY_ID
          }
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        band_api: { healthy: false, error: error.message }
      }
    }, { status: 503 });
  }
}