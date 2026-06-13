# ClaimPilot — Multi-Agent Insurance Claims Investigation

**Band of Agents Hackathon — Track 3: Regulated & High-Stakes Workflows**

Multi-agent system that investigates insurance claims with dynamic recruitment on the **Band platform**. Agents are configured and run entirely on Band — no local agent runtime needed.

## How It Works

```
User submits claim → Frontend creates Band room + adds Reviewer
→ Reviewer triages (risk_level: LOW/MEDIUM/HIGH)
  → LOW: Reviewer auto-approves (REVIEWER_REPORT + AUTO_APPROVE)
  → MEDIUM/HIGH: Reviewer outputs [RECRUIT:investigator]
    → Backend detects tag → adds Investigator to room
    → Investigator analyzes fraud → verdict (CLEAN/SUSPICIOUS/LIKELY_FRAUDULENT)
      → CLEAN: auto-approve
      → SUSPICIOUS/LIKELY_FRAUDULENT: Investigator outputs [RECRUIT:adjuster]
        → Backend detects tag → adds Adjuster to room
        → Adjuster issues final decision (APPROVED/PARTIAL_APPROVED/DENIED)
→ Backend resolves: email + payment + Resolver confirmation
```

**Key design:** Agents recruit each other using Band's native `add_participant_service` tool and communicate via `send_direct_message_service`. Band handles all message delivery, retry, and routing. The backend only reads messages to detect final decisions.

## Agent Architecture (Platform Agents)

| Agent | Handle | Role |
|-------|--------|------|
| 🚪 **Gateway** | `@nodesemesta/gateway` | API identity — sends claims on behalf of frontend |
| 📋 **Reviewer** | `@nodesemesta/reviewer` | Triage, classify risk, auto-approve or recruit |
| 🔍 **Investigator** | `@nodesemesta/investigator` | Fraud pattern analysis, verdict, recruit adjuster |
| ⚖️ **Adjuster** | `@nodesemesta/adjuster` | Final decision, settlement calculation |
| ✅ **Resolver** | `@nodesemesta/resolver` | Confirms resolution execution |

Agent prompts and structured output formats are defined in [PLATFORM_AGENTS.md](./PLATFORM_AGENTS.md).

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/claims` | Submit a new claim (PDF or JSON) |
| GET | `/api/claims` | List user's claims |
| GET | `/api/claims/[id]/messages` | Poll Band room messages |
| POST | `/api/claims/[id]/resolve` | Parse agent decisions & finalize |
| POST | `/api/claims/[id]/notify` | Send email notification |
| POST | `/api/claims/[id]/payment` | Record payment |

## Project Structure

```
project/
├── app/
│   ├── api/
│   │   ├── claims/
│   │   │   ├── route.ts              # Submit/list claims
│   │   │   └── [id]/
│   │   │       ├── messages/route.ts  # Poll room messages
│   │   │       ├── resolve/route.ts   # Parse decisions & finalize
│   │   │       ├── notify/route.ts    # Email notification
│   │   │       └── payment/route.ts   # Payment recording
│   │   ├── chat/route.ts             # AI assistant (Featherless)
│   │   ├── assets/route.ts           # Policy/asset management
│   │   └── health/route.ts           # Health check
│   ├── dashboard/                     # Claims UI
│   ├── lib/
│   │   ├── band.ts                   # Band API client
│   │   ├── env.ts                    # Environment helpers
│   │   └── supabase.ts              # Supabase client
│   └── page.tsx                      # Landing page
├── supabase/migrations/              # DB schema
├── samples/                          # Test claim PDFs
├── PLATFORM_AGENTS.md                # Agent prompts & config
└── README.md
```

## Setup

### 1. Install & Run

```bash
npm install
cp .env.example .env.local  # fill in keys
npm run dev
```

### 2. Environment Variables (.env.local)

```
BAND_API_URL=https://app.band.ai
BAND_AGENT_API_KEY=band_a_...       # Gateway agent API key
CLAIM_REVIEWER_ID=<uuid>
INVESTIGATOR_ID=<uuid>
ADJUSTER_ID=<uuid>
GATEWAY_ID=<uuid>
RESOLVER_ID=<uuid>

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Get Band agent IDs from [app.band.ai/agents](https://app.band.ai/agents).

## Testing

```bash
# Submit a claim (PDF)
curl -X POST http://localhost:3000/api/claims \
  -F "file=@samples/claim_high_risk.pdf"

# Poll messages
curl http://localhost:3000/api/claims/<room_id>/messages

# Manually trigger resolution
curl -X POST http://localhost:3000/api/claims/<room_id>/resolve
```

## Demo Scenarios

| Sample | Expected Flow |
|--------|---------------|
| `claim_low_risk.pdf` | Reviewer → AUTO_APPROVE |
| `claim_suspicious.pdf` | Reviewer → recruits Investigator → verdict |
| `claim_high_risk.pdf` | Reviewer → Investigator → recruits Adjuster → final decision |

## Stack

- **Agent Platform**: [Band.ai](https://band.ai) — platform agents with structured output
- **Frontend**: Next.js 15, TailwindCSS, HeroUI
- **Database**: Supabase (Postgres + Auth + RLS)
- **Email**: Resend (optional)
- **AI Chat**: Featherless AI (DeepSeek-V4-Pro)

## License

MIT
