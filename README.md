# PanggilAI Frontend

## Sprint Status
✅ **Frontend API Integration Complete** — All pages wired to backend endpoints with proper error handling, loading states, and fallback displays.

## What's Implemented
- Full Next.js 15 + TypeScript + Tailwind stack
- Supabase authentication (email/password)
- Complete CRUD for Leads, Campaigns, Call Logs
- Agent configuration viewing (read-only)
- Billing with Xendit payment integration
- Onboarding flow with OTP verification
- Responsive UI with Indonesian/English i18n

## API Endpoints Expected (Backend Contract)
The frontend expects these backend endpoints (relative to `NEXT_PUBLIC_API_BASE_URL`):

**Auth & Profile**
- `GET /users/profile` — user profile + documents
- `PUT /users/profile` — update profile
- `POST /users/documents` — upload NIB/NPWP
- `POST /users/otp/send` — send OTP
- `POST /users/otp/verify` — verify OTP

**Leads**
- `GET /leads` — list with filters (type, status, search, campaignId, pagination)
- `GET /leads/:id` — single lead
- `POST /leads` — create
- `PUT /leads/:id` — update
- `DELETE /leads/:id` — delete
- `POST /leads/import` — bulk import (multipart/form-data)

**Campaigns**
- `GET /campaigns` — list with pagination (type filter)
- `GET /campaigns/summary` — aggregated stats
- `GET /campaigns/:id` — full campaign details
- `POST /campaigns` — create
- `PATCH /campaigns/:id/status` — update status (active/paused)
- `DELETE /campaigns/:id` — delete

**Call Logs**
- `GET /logs` — list with filters (campaignId, agentType, search, sort, pagination)
- `GET /logs/summary` — aggregated metrics
- `GET /logs/:callId` — full details (recordingUrl, transcript, structuredOutput)

**Agent Config** (read-only)
- `GET /agents?type=` — agent configuration per occasion

**Billing**
- `GET /billing/balance` — current balance
- `GET /billing/transactions` — transaction history
- `POST /billing/invoices` — create invoice (Xendit)

**Webhooks**
- `POST /api/billing/xendit-callback` — must be registered in Xendit Dashboard

## Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/v1  # or your backend URL
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
XENDIT_SECRET_KEY=
XENDIT_CALLBACK_TOKEN=  # optional but recommended
```

## Current Blockers
- **Backend API must be live** at the configured `NEXT_PUBLIC_API_BASE_URL`
- Webhook endpoint `/api/billing/xendit-callback` must be reachable by Xendit
- `create-invoice` route needs `XENDIT_SECRET_KEY` to work
- Backend must implement all endpoints listed above with correct request/response shapes

## Coordination Notes
- Frontend is feature-complete and ready for backend integration testing
- Deploy to Vercel for preview once backend is available
- See Obsidian vault for detailed conversation history and design decisions

---
*Ready for Vercel preview once backend is deployed*