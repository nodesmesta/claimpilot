# ClaimPilot — Multi-Agent Insurance Claims Investigation

**Band of Agents Hackathon — Track 3: Regulated & High-Stakes Workflows**

Multi-agent system that investigates insurance claims with dynamic recruitment on the **Band platform**. Agents are configured and run entirely on Band — no local agent runtime needed.

## How It Works

```
User submits claim → Frontend API creates Band room
→ Reviewer agent triages (LOW/MEDIUM/HIGH)
→ If HIGH: Reviewer recruits Investigator
→ Investigator analyzes fraud patterns → verdict
→ If SUSPICIOUS: Reviewer recruits Adjuster
→ Adjuster issues final decision
```

All agent logic, tools, and communication run on [Band.ai](https://app.band.ai). The frontend only creates rooms, sends the initial message, and polls for results.

## Agent Architecture (Platform Agents)

| Agent | Handle | Role |
|-------|--------|------|
| 🚪 **Gateway** | `@nodesemesta/gateway` | API identity — sends claims on behalf of frontend |
| 📋 **Reviewer** | `@nodesemesta/reviewer` | Triage, classify risk, recruit specialists |
| 🔍 **Investigator** | `@nodesemesta/investigator` | Fraud pattern analysis, red flag assessment |
| ⚖️ **Adjuster** | `@nodesemesta/adjuster` | Final decision, settlement calculation |

Agent prompts and behavior are defined in [PLATFORM_AGENTS.md](./PLATFORM_AGENTS.md).

## Project Structure

```
project/
├── frontend/              # Next.js app
│   ├── app/
│   │   ├── api/claims/    # Band API integration
│   │   ├── dashboard/     # Claims UI
│   │   └── page.tsx       # Landing page
│   └── .env.local         # Band API keys & agent IDs
├── knowledge/             # Domain knowledge (reference)
│   ├── fraud_patterns.md
│   ├── policy_rules.md
│   └── compliance.md
├── samples/               # Test claim payloads
├── PLATFORM_AGENTS.md     # Agent prompts & config
└── README.md
```

## Setup

### 1. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # fill in Band keys
npm run dev
```

### 2. Environment Variables (frontend/.env.local)

```
BAND_API_URL=https://app.band.ai
BAND_AGENT_API_KEY=band_a_...       # Gateway agent API key
CLAIM_REVIEWER_ID=<uuid>
INVESTIGATOR_ID=<uuid>
ADJUSTER_ID=<uuid>
GATEWAY_ID=<uuid>
```

Get these from [app.band.ai/agents](https://app.band.ai/agents).

## Testing via cURL

```bash
# Submit a high-value claim
curl -X POST http://localhost:3000/api/claims \
  -H "Content-Type: application/json" \
  -d @samples/claim_high_value.json

# Poll investigation messages (use room_id from response)
curl http://localhost:3000/api/claims/<room_id>/messages
```

## Demo Scenarios

| Sample | Risk | Expected Flow |
|--------|------|---------------|
| `claim_low_risk.json` | LOW | Reviewer auto-approves |
| `claim_suspicious.json` | MEDIUM/HIGH | Reviewer → Investigator |
| `claim_high_value.json` | HIGH | Reviewer → Investigator → Adjuster |

## Stack

- **Agent Platform**: [Band.ai](https://band.ai) (platform agents, no local runtime)
- **Frontend**: Next.js 15, TailwindCSS, HeroUI
- **API Pattern**: REST via Band Agent API (`/api/v1/agent/...`)

## License

MIT
