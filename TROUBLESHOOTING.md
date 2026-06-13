# Troubleshooting ClaimPilot - Band Agent Issues

## Common Problems & Solutions

### 1. **Agent Endpoint Sering Bermasalah**

**Gejala:**
- Error "Band API 500: ..."
- Timeout saat membuat room
- Agent tidak merespon

**Solusi:**

#### A. Implementasi Retry Logic ✅ (Sudah ditambahkan)
Sistem sekarang memiliki:
- **Exponential backoff**: 1s, 2s, 4s, 8s (max 10s)
- **Timeout handling**: 30 detik per request
- **Error classification**: Retry khusus untuk error 429 (rate limit) dan 5xx (server error)

#### B. Cek Environment Variables
```bash
cd /home/nodesemesta/dev/Hackaton/band/project
npm run check-band
```

Jika ada variable yang missing:
1. Login ke https://app.band.ai/agents
2. Dapatkan Agent IDs untuk:
   - Reviewer (`@nodesemesta/reviewer`)
   - Investigator (`@nodesemesta/investigator`)  
   - Adjuster (`@nodesemesta/adjuster`)
   - Gateway (`@nodesemesta/gateway`)
3. Update `.env.local`:
   ```
   CLAIM_REVIEWER_ID=your-reviewer-uuid
   INVESTIGATOR_ID=your-investigator-uuid
   ADJUSTER_ID=your-adjuster-uuid
   GATEWAY_ID=your-gateway-uuid
   ```

#### C. Test Koneksi Band API
```bash
cd /home/nodesemesta/dev/Hackaton/band/project
node scripts/check-band.js
```

### 2. **Monitoring Band API Status**

**Website Status**: https://status.band.ai
**API Endpoint Test**: 
```bash
curl -X GET "https://app.band.ai/api/v1/status" -H "X-API-Key: $BAND_AGENT_API_KEY"
```

### 3. **Optimasi Performance**

#### A. Pre-warming Connection
Tambahkan di startup aplikasi:
```javascript
// Di app/layout.tsx atau app/providers.tsx
if (typeof window !== 'undefined') {
  // Pre-warm Band API connection
  fetch('https://app.band.ai/api/v1/status', {
    headers: { 'X-API-Key': process.env.BAND_AGENT_API_KEY! }
  }).catch(() => {}); // Ignore errors, just warm up
}
```

#### B. Connection Pooling
Untuk request yang sering, pertimbangkan menggunakan connection pooling.

### 4. **Fallback Mechanism**

Jika Band API benar-benar down, implementasi fallback:

```javascript
// app/lib/band.ts - Enhanced version
async function bandFetchWithFallback(path: string, options: RequestInit = {}) {
  try {
    return await bandFetch(path, options);
  } catch (error) {
    console.error('Band API failed, using fallback:', error);
    
    // Fallback 1: Queue for later processing
    await queueForRetry(path, options);
    
    // Fallback 2: Return mock response for critical paths
    if (path.includes('/chats')) {
      return { 
        data: { id: `mock-${Date.now()}`, status: 'queued' },
        _fallback: true 
      };
    }
    
    throw error;
  }
}
```

### 5. **Rate Limiting & Throttling**

Band API mungkin memiliki rate limits. Implementasi:

```javascript
// app/lib/rate-limiter.ts
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 10; // requests
  private timeWindow = 60000; // 1 minute
  
  async waitIfNeeded() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldest);
      await delay(waitTime);
    }
    
    this.requests.push(now);
  }
}
```

### 6. **Logging & Alerting**

Tambahkan logging untuk monitoring:

```javascript
// app/middleware.ts atau dedicated logging
export async function logBandRequest(
  endpoint: string, 
  status: number, 
  duration: number,
  error?: string
) {
  await fetch('/api/logs', {
    method: 'POST',
    body: JSON.stringify({
      type: 'band_api',
      endpoint,
      status,
      duration,
      error,
      timestamp: new Date().toISOString()
    })
  });
}
```

### 7. **Health Check Endpoint**

Buat endpoint untuk cek status sistem:

```javascript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    band_api: await checkBandAPI(),
    supabase: await checkSupabase(),
    agents: await checkAgents()
  };
  
  const allHealthy = Object.values(checks).every(c => c.healthy);
  
  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
}
```

## Quick Fixes

1. **Restart Aplikasi**: 
   ```bash
   cd frontend
   npm run build && npm start
   ```

2. **Clear Cache**:
   ```bash
   rm -rf .next && npm run dev
   ```

3. **Update Environment**:
   ```bash
   cp .env.local.example .env.local
   # Isi dengan values yang benar
   ```

4. **Test dengan cURL**:
   ```bash
   curl -X POST http://localhost:3000/api/claims \
     -H "Content-Type: application/json" \
     -d @samples/claim_low_risk.json
   ```

## Contact Support

Jika masalah berlanjut:
1. **Band AI Support**: support@band.ai
2. **Documentation**: https://docs.band.ai
3. **Community**: Discord/Slack channel Band AI

**Note**: Sistem sudah dioptimasi dengan retry logic, timeout handling, dan error recovery. Fokus utama adalah memastikan environment variables diisi dengan benar.