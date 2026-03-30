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
- **Webhook callback** (`POST /api/billing/xendit-callback`) is implemented in frontend. For it to function, backend must provide:
  - A `credit_balance(p_user_id UUID, p_amount NUMERIC)` RPC function to atomically increment user balances upon payment.
  - A `transactions` table with columns: `user_id`, `invoice_id`, `external_id`, `type` (`topup`/`usage`), `amount` (signed), `paid_at`, `status` (`success`/`pending`/`failed`/`expired`), `created_at`.
  - Proper idempotency and RLS rules.

**Webhooks**
- `POST /api/billing/xendit-callback` — must be reachable by Xendit; register the full URL in Xendit Dashboard.

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

## Current Blockers (Backend Requirements)

1. **Billing Webhook DB Support** — Implement `credit_balance` RPC and `transactions` table as described above. Without these, the webhook will fail to credit balances and log payments.

2. **Lead Status Aggregation** — Provide `GET /leads/summary` returning counts per status (`uncontacted`, `connected`, `follow_up`, `promise_to_pay`, `closed`) for each campaign type. This replaces the current funnel sampling approach and provides accurate metrics.

3. **Call Log Artifacts** — Ensure `GET /logs/:callId` always includes `recordingUrl`, `transcript`, and `structuredOutput` fields after call completion.

4. **Agent Config Seeding** — On account creation or first use, seed at least one default agent configuration per occasion type (`telesales`, `collection`) so `GET /agents` never returns an empty array.

5. **Campaign Schedule Validation** — For scheduled campaigns, validate and persist `selectedDays` and `dayTimes` correctly; frontend shows warnings if these fields are missing or inconsistent.

6. **Profile Documents Status** — The `UserProfile.documents` field should always be an object (not `null`/`undefined`) with at least `{ status: "not_uploaded" }` when no documents are uploaded.

7. **Deploy Backend & Configure CORS** — The backend must be deployed and reachable from the Vercel frontend. Ensure CORS allows the frontend origin and `NEXT_PUBLIC_API_BASE_URL` is correctly set in Vercel environment variables.

Once these are addressed, the frontend will operate without fallback complaints.

## Coordination Notes
- Frontend is feature-complete and ready for backend integration testing
- Deploy to Vercel for preview once backend is available
- See Obsidian vault for detailed conversation history and design decisions

---
*Ready for Vercel preview once backend is deployed*