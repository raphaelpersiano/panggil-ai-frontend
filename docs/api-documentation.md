# Panggil AI — Backend API Documentation

> **Versi dokumen**: 1.0.0
> **Tanggal**: 2026-03-28
> **Dibuat oleh**: Tim Frontend
> **Untuk**: Tim Backend

---

## Daftar Isi

1. [Konvensi Umum](#1-konvensi-umum)
2. [Autentikasi](#2-autentikasi)
3. [User & Company Profile](#3-user--company-profile)
4. [Balance & Billing](#4-balance--billing)
5. [Leads](#5-leads)
6. [Campaigns](#6-campaigns)
7. [Call Logs](#7-call-logs)
8. [AI Agent Configuration](#8-ai-agent-configuration)
9. [File Upload (Dokumen Legal)](#9-file-upload-dokumen-legal)
10. [Ringkasan Endpoint](#10-ringkasan-endpoint)

---

## 1. Konvensi Umum

### Base URL
```
https://api.panggil.ai/v1
```

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

### Format Response Sukses
```json
{
  "success": true,
  "data": { ... }
}
```

### Format Response Error
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Campaign dengan ID tersebut tidak ditemukan."
  }
}
```

### Pagination
Semua endpoint list menggunakan query params berikut:
```
?page=1&limit=20
```
Response list selalu menyertakan:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Tipe Data Umum
| Field | Format | Contoh |
|-------|--------|--------|
| `id` | UUID v4 string | `"550e8400-e29b-41d4-a716-446655440000"` |
| `createdAt` | ISO 8601 UTC | `"2026-03-28T10:00:00Z"` |
| `updatedAt` | ISO 8601 UTC | `"2026-03-28T12:30:00Z"` |
| Nominal IDR | Integer (sen/rupiah) | `500000` (Rp 500.000) |
| Durasi | Integer detik | `120` (2 menit) |

---

## 2. Autentikasi

Autentikasi ditangani oleh **Supabase Auth**. Backend perlu memvalidasi JWT dari Supabase dan menggunakannya sebagai referensi user (`userId` = `sub` dari JWT).

### User ID
Setiap request dari frontend akan menyertakan JWT token Supabase. Backend harus mengekstrak `userId` dari claim `sub` pada token tersebut.

---

## 3. User & Company Profile

### 3.1 Get Profile

```
GET /users/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "picName": "Budi Santoso",
    "picMobile": "628123456789",
    "companyName": "PT Maju Bersama",
    "occasions": ["telesales", "collection"],
    "balance": 1500000,
    "documents": {
      "nib": {
        "url": "https://storage.../nib.pdf",
        "status": "verified",
        "uploadedAt": "2026-03-01T08:00:00Z"
      },
      "npwp": {
        "url": "https://storage.../npwp.pdf",
        "status": "pending",
        "uploadedAt": "2026-03-10T09:00:00Z"
      }
    },
    "onboardingComplete": true,
    "createdAt": "2026-01-15T08:00:00Z"
  }
}
```

**Keterangan field `documents.status`:**
| Value | Arti |
|-------|------|
| `not_uploaded` | Belum diunggah |
| `pending` | Menunggu verifikasi admin |
| `verified` | Sudah diverifikasi |
| `rejected` | Ditolak, perlu upload ulang |

---

### 3.2 Update Profile (Onboarding & Profile Page)

```
PUT /users/profile
```

**Request Body:**
```json
{
  "picName": "Budi Santoso",
  "picMobile": "628123456789",
  "companyName": "PT Maju Bersama",
  "occasions": ["telesales", "collection"]
}
```

**Validasi:**
- `picName`: required, string, max 100 karakter
- `picMobile`: required, format nomor HP Indonesia (dimulai `62`, 10-15 digit)
- `companyName`: required, string, max 200 karakter
- `occasions`: required, array, minimal 1 item, nilai valid: `"telesales"` | `"collection"`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "picName": "Budi Santoso",
    "picMobile": "628123456789",
    "companyName": "PT Maju Bersama",
    "occasions": ["telesales", "collection"],
    "updatedAt": "2026-03-28T10:00:00Z"
  }
}
```

---

### 3.3 Kirim & Verifikasi OTP (Onboarding)

**Kirim OTP ke nomor HP PIC:**
```
POST /users/otp/send
```

**Request Body:**
```json
{
  "mobile": "628123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP telah dikirim ke 628123456789",
    "expiresIn": 300
  }
}
```

---

**Verifikasi OTP:**
```
POST /users/otp/verify
```

**Request Body:**
```json
{
  "mobile": "628123456789",
  "otp": "123456"
}
```

**Response sukses:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "onboardingComplete": true
  }
}
```

**Response error (OTP salah):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "Kode OTP salah atau sudah kadaluarsa."
  }
}
```

---

## 4. Balance & Billing

### 4.1 Get Balance

```
GET /billing/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1500000
  }
}
```

---

### 4.2 Buat Invoice Top-Up

```
POST /billing/invoices
```

**Request Body:**
```json
{
  "amount": 500000
}
```

**Validasi:**
- `amount`: required, integer, nilai yang diizinkan: `1000`, `500000`, `1000000`, `5000000`

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceId": "INV-20260328-001",
    "externalId": "panggil-ai-550e8400-1711620000000",
    "invoiceUrl": "https://checkout.xendit.co/v2/...",
    "amount": 500000,
    "status": "pending",
    "expiresAt": "2026-03-28T11:00:00Z"
  }
}
```

---

### 4.3 Get Riwayat Transaksi

```
GET /billing/transactions
```

**Query Params:**
```
?page=1&limit=20&type=topup|usage
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "TXN-001",
      "type": "topup",
      "description": "Top-up saldo",
      "amount": 500000,
      "status": "success",
      "createdAt": "2026-03-28T10:00:00Z"
    },
    {
      "id": "TXN-002",
      "type": "usage",
      "description": "Panggilan ke 08123456789 (120 detik)",
      "amount": -3600,
      "status": "success",
      "createdAt": "2026-03-28T11:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Keterangan field:**
| Field | Keterangan |
|-------|-----------|
| `type` | `"topup"` = penambahan saldo, `"usage"` = pemakaian panggilan |
| `amount` | Integer IDR. Positif untuk topup, negatif untuk usage |
| `status` | `"success"` \| `"pending"` \| `"failed"` |

---

### 4.4 Xendit Webhook Callback (sudah ada, perlu dilengkapi)

```
POST /billing/xendit-callback
```

> Endpoint ini sudah ada di frontend sebagai `/api/billing/xendit-callback`. Perlu dipindahkan ke backend dan ditambahkan logika credit balance.

**Payload dari Xendit:**
```json
{
  "id": "xendit-invoice-id",
  "external_id": "panggil-ai-550e8400-1711620000000",
  "status": "PAID",
  "paid_amount": 500000,
  "paid_at": "2026-03-28T10:05:00Z"
}
```

**Aksi yang harus dilakukan backend:**
1. Validasi `x-callback-token` header dari Xendit
2. Parse `external_id` untuk mendapatkan `userId`
3. Jika `status === "PAID"`: tambahkan `paid_amount` ke balance user
4. Catat transaksi ke tabel transactions
5. Kembalikan HTTP 200

---

## 5. Leads

Lead dibagi menjadi dua jenis: **Telesales** dan **Collection**. Collection memiliki field tambahan terkait piutang.

### 5.1 Get List Leads

```
GET /leads
```

**Query Params:**
```
?page=1&limit=20
&type=telesales|collection
&status=uncontacted|connected|follow_up|promise_to_pay|closed
&search=<nama atau nomor HP>
&campaignId=<uuid>   (opsional, filter leads berdasarkan campaign)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "telesales",
      "name": "Andi Wijaya",
      "mobile": "628111222333",
      "source": "Organic",
      "status": "uncontacted",
      "lastCallTime": null,
      "createdAt": "2026-03-01T08:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "type": "collection",
      "name": "Siti Rahayu",
      "mobile": "628222333444",
      "source": "Internal",
      "status": "connected",
      "lastCallTime": "2026-03-27T14:30:00Z",
      "outstanding": 15000000,
      "emi": 1500000,
      "emiDueDate": "2026-04-01",
      "createdAt": "2026-02-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

**Keterangan field `status`:**
| Value | Label UI |
|-------|----------|
| `uncontacted` | Belum Dihubungi |
| `connected` | Terhubung |
| `follow_up` | Follow Up |
| `promise_to_pay` | Janji Bayar *(collection only)* |
| `closed` | Selesai |

---

### 5.2 Get Single Lead

```
GET /leads/:id
```

**Response:** sama seperti object lead di atas (single object, bukan array).

---

### 5.3 Buat Lead (Single)

```
POST /leads
```

**Request Body — Telesales:**
```json
{
  "type": "telesales",
  "name": "Andi Wijaya",
  "mobile": "628111222333",
  "source": "Organic",
  "status": "uncontacted"
}
```

**Request Body — Collection:**
```json
{
  "type": "collection",
  "name": "Siti Rahayu",
  "mobile": "628222333444",
  "source": "Internal",
  "status": "uncontacted",
  "outstanding": 15000000,
  "emi": 1500000,
  "emiDueDate": "2026-04-01"
}
```

**Validasi:**
| Field | Rule |
|-------|------|
| `type` | required, `"telesales"` \| `"collection"` |
| `name` | required, string, max 200 karakter |
| `mobile` | required, nomor HP Indonesia, unik per user |
| `source` | required, string, max 100 karakter |
| `status` | required, nilai valid sesuai tabel di atas |
| `outstanding` | required jika `type=collection`, integer > 0 |
| `emi` | required jika `type=collection`, integer > 0 |
| `emiDueDate` | required jika `type=collection`, format `YYYY-MM-DD` |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "type": "telesales",
    "name": "Andi Wijaya",
    "mobile": "628111222333",
    "source": "Organic",
    "status": "uncontacted",
    "lastCallTime": null,
    "createdAt": "2026-03-28T10:00:00Z"
  }
}
```

---

### 5.4 Import Leads (Bulk via CSV/XLSX)

```
POST /leads/import
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <File>      — file CSV atau XLSX
type: "telesales" | "collection"
```

**Format file CSV yang diterima frontend:**

*Telesales headers:* `name`, `mobile`, `source`, `status`

*Collection headers:* `name`, `mobile`, `source`, `status`, `outstanding`, `emi`, `emi_due_date`

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 95,
    "failed": 5,
    "errors": [
      {
        "row": 3,
        "field": "mobile",
        "message": "Format nomor HP tidak valid"
      },
      {
        "row": 7,
        "field": "emi_due_date",
        "message": "Format tanggal harus YYYY-MM-DD"
      }
    ]
  }
}
```

---

### 5.5 Update Lead

```
PUT /leads/:id
```

**Request Body:** field yang ingin diubah (partial update diizinkan):
```json
{
  "status": "follow_up",
  "outstanding": 12000000
}
```

**Response:** object lead yang sudah diperbarui.

---

### 5.6 Hapus Lead

```
DELETE /leads/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Lead berhasil dihapus."
  }
}
```

---

## 6. Campaigns

### 6.1 Get List Campaigns

```
GET /campaigns
```

**Query Params:**
```
?page=1&limit=20&type=telesales|collection&status=draft|scheduled|active|paused|completed
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "camp-001",
      "name": "Kampanye Q1 2026",
      "type": "telesales",
      "status": "active",
      "scheduleMode": "scheduled",
      "startDate": "2026-03-01T09:00:00Z",
      "endDate": "2026-03-31T18:00:00Z",
      "selectedDays": [1, 2, 3, 4, 5],
      "dayTimes": {
        "1": ["09:00", "14:00"],
        "2": ["09:00", "14:00"],
        "3": ["09:00", "14:00"],
        "4": ["09:00", "14:00"],
        "5": ["09:00", "14:00"]
      },
      "maxRetries": 3,
      "retryIntervalMinutes": 30,
      "totalLeads": 100,
      "calledLeads": 67,
      "createdAt": "2026-02-28T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

**Keterangan field `status`:**
| Value | Arti |
|-------|------|
| `draft` | Dibuat, belum dijadwalkan/diaktifkan |
| `scheduled` | Terjadwal, menunggu waktu mulai |
| `active` | Sedang berjalan |
| `paused` | Dijeda |
| `completed` | Selesai |

**Keterangan field `scheduleMode`:**
| Value | Arti |
|-------|------|
| `immediate` | Jalankan sekarang |
| `scheduled` | Jadwalkan berdasarkan hari & jam |

**Keterangan field `selectedDays`:**
Array integer `0-6` (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)

**Keterangan field `dayTimes`:**
Object dengan key = index hari (string), value = array string jam format `"HH:mm"`

---

### 6.2 Get Summary Stats Campaigns

```
GET /campaigns/summary
```

**Query Params:**
```
?type=telesales|collection
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCampaigns": 5,
    "activeCampaigns": 2,
    "totalLeads": 450,
    "totalCalls": 312
  }
}
```

---

### 6.3 Get Single Campaign

```
GET /campaigns/:id
```

**Response:** object campaign lengkap seperti di 6.1 (single object).

---

### 6.4 Buat Campaign

```
POST /campaigns
```

**Request Body:**
```json
{
  "name": "Kampanye Q1 2026",
  "description": "Target pelanggan baru segmen UMKM",
  "type": "telesales",
  "scheduleMode": "scheduled",
  "startDate": "2026-03-01T09:00:00Z",
  "endDate": "2026-03-31T18:00:00Z",
  "selectedDays": [1, 2, 3, 4, 5],
  "dayTimes": {
    "1": ["09:00", "14:00"],
    "2": ["09:00", "14:00"],
    "3": ["09:00", "14:00"],
    "4": ["09:00", "14:00"],
    "5": ["09:00", "14:00"]
  },
  "maxRetries": 3,
  "retryIntervalMinutes": 30,
  "leadIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Validasi:**
| Field | Rule |
|-------|------|
| `name` | required, string, max 200 karakter |
| `description` | opsional, string, max 1000 karakter |
| `type` | required, `"telesales"` \| `"collection"` |
| `scheduleMode` | required, `"immediate"` \| `"scheduled"` |
| `startDate` | required jika `scheduleMode=scheduled`, ISO 8601 |
| `endDate` | required jika `scheduleMode=scheduled`, ISO 8601, setelah `startDate` |
| `selectedDays` | required jika `scheduleMode=scheduled`, array `0-6`, minimal 1 |
| `dayTimes` | required jika `scheduleMode=scheduled`, minimal 1 jam per hari yang dipilih |
| `maxRetries` | required, integer, `1–5` |
| `retryIntervalMinutes` | required, integer, `15–120` |
| `leadIds` | required, array UUID, minimal 1 lead |
| *Lead type harus sesuai campaign type* | `type=telesales` → semua leadIds harus lead telesales |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "camp-001",
    "name": "Kampanye Q1 2026",
    "type": "telesales",
    "status": "scheduled",
    "totalLeads": 2,
    "calledLeads": 0,
    "createdAt": "2026-03-28T10:00:00Z"
  }
}
```

---

### 6.5 Update Status Campaign (Start / Pause / Resume)

```
PATCH /campaigns/:id/status
```

**Request Body:**
```json
{
  "status": "paused"
}
```

Nilai yang diizinkan: `"active"` | `"paused"` | `"completed"`

**Response:** object campaign yang diperbarui.

---

### 6.6 Hapus Campaign

```
DELETE /campaigns/:id
```

> Hanya campaign berstatus `draft` atau `completed` yang bisa dihapus.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Campaign berhasil dihapus."
  }
}
```

---

## 7. Call Logs

### 7.1 Get List Call Logs

```
GET /logs
```

**Query Params:**
```
?page=1&limit=20
&campaignId=<uuid>         (opsional)
&agentType=telesales|collection  (opsional)
&search=<callId atau nomor HP>    (opsional)
&sortBy=createdAt|duration|cost   (default: createdAt)
&sortOrder=asc|desc               (default: desc)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "callId": "CALL-20260328-001",
      "campaignId": "camp-001",
      "campaignName": "Kampanye Q1 2026",
      "agentType": "telesales",
      "fromNumber": "6221XXXX0001",
      "toNumber": "628111222333",
      "leadName": "Andi Wijaya",
      "duration": 120,
      "endedBy": "agent",
      "cost": 3600,
      "createdAt": "2026-03-28T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 312,
    "totalPages": 16
  }
}
```

**Keterangan field:**
| Field | Keterangan |
|-------|-----------|
| `callId` | ID unik panggilan, format bebas (misal `CALL-YYYYMMDD-XXX`) |
| `agentType` | `"telesales"` \| `"collection"` |
| `duration` | Durasi dalam detik |
| `endedBy` | `"agent"` (AI mengakhiri) \| `"leads"` (pelanggan mengakhiri) |
| `cost` | Biaya dalam IDR (`duration * 30`) |

---

### 7.2 Get Summary Stats Logs

```
GET /logs/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCalls": 312,
    "totalDuration": 37440,
    "totalCost": 1123200,
    "avgDuration": 120
  }
}
```

---

### 7.3 Get Detail Call Log

```
GET /logs/:callId
```

**Response:** object call log lengkap (single object) ditambah field `recordingUrl` jika tersedia:
```json
{
  "success": true,
  "data": {
    "callId": "CALL-20260328-001",
    "campaignId": "camp-001",
    "campaignName": "Kampanye Q1 2026",
    "agentType": "telesales",
    "fromNumber": "6221XXXX0001",
    "toNumber": "628111222333",
    "leadName": "Andi Wijaya",
    "duration": 120,
    "endedBy": "agent",
    "cost": 3600,
    "recordingUrl": "https://storage.../recording.mp3",
    "transcript": "...",
    "structuredOutput": {
      "interested": true,
      "callbackRequested": false
    },
    "createdAt": "2026-03-28T10:00:00Z"
  }
}
```

---

## 8. AI Agent Configuration

Konfigurasi AI Agent bersifat **read-only** dari sisi frontend. Tim frontend tidak menyediakan UI untuk create/update agent. Perubahan agent dilakukan melalui kontak support (WhatsApp).

### 8.1 Get Agent Config

```
GET /agents
```

**Query Params:**
```
?type=telesales|collection
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "agent-telesales-001",
      "type": "telesales",
      "name": "Agent Telesales Default",
      "firstMessage": "Halo, selamat pagi! Saya [nama AI] dari...",
      "systemPrompt": "Anda adalah asisten AI...",
      "settings": {
        "silenceTimeoutSeconds": 10,
        "maxDurationSeconds": 300,
        "immediateStopSeconds": 2,
        "backOffSeconds": 1
      },
      "structuredOutput": [
        {
          "name": "interested",
          "type": "Boolean (true / false)",
          "description": "Apakah pelanggan tertarik dengan produk?"
        }
      ],
      "updatedAt": "2026-03-01T00:00:00Z"
    }
  ]
}
```

---

## 9. File Upload (Dokumen Legal)

### 9.1 Upload Dokumen (NIB / NPWP)

```
POST /users/documents
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <File>          — PDF, JPG, atau PNG, maks 5MB
documentType: "nib" | "npwp"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentType": "nib",
    "url": "https://storage.../nib.pdf",
    "status": "pending",
    "uploadedAt": "2026-03-28T10:00:00Z"
  }
}
```

---

## 10. Ringkasan Endpoint

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/users/profile` | Ambil profil & balance user | ✓ |
| `PUT` | `/users/profile` | Update profil perusahaan | ✓ |
| `POST` | `/users/otp/send` | Kirim OTP ke nomor HP | ✓ |
| `POST` | `/users/otp/verify` | Verifikasi OTP | ✓ |
| `POST` | `/users/documents` | Upload dokumen legal (NIB/NPWP) | ✓ |
| `GET` | `/billing/balance` | Ambil saldo user | ✓ |
| `POST` | `/billing/invoices` | Buat invoice top-up via Xendit | ✓ |
| `GET` | `/billing/transactions` | Riwayat transaksi (topup & usage) | ✓ |
| `POST` | `/billing/xendit-callback` | Webhook dari Xendit (no auth, token header) | — |
| `GET` | `/leads` | List leads dengan filter & pagination | ✓ |
| `GET` | `/leads/:id` | Detail satu lead | ✓ |
| `POST` | `/leads` | Buat lead baru (single) | ✓ |
| `POST` | `/leads/import` | Import leads bulk via CSV/XLSX | ✓ |
| `PUT` | `/leads/:id` | Update lead | ✓ |
| `DELETE` | `/leads/:id` | Hapus lead | ✓ |
| `GET` | `/campaigns` | List campaigns dengan filter | ✓ |
| `GET` | `/campaigns/summary` | Stats ringkasan campaigns | ✓ |
| `GET` | `/campaigns/:id` | Detail satu campaign | ✓ |
| `POST` | `/campaigns` | Buat campaign baru | ✓ |
| `PATCH` | `/campaigns/:id/status` | Update status campaign | ✓ |
| `DELETE` | `/campaigns/:id` | Hapus campaign | ✓ |
| `GET` | `/logs` | List call logs dengan filter & sort | ✓ |
| `GET` | `/logs/summary` | Stats ringkasan call logs | ✓ |
| `GET` | `/logs/:callId` | Detail satu call log | ✓ |
| `GET` | `/agents` | Ambil konfigurasi AI agent | ✓ |

---

## Catatan Tambahan untuk Backend

### Pricing Model
- **Biaya panggilan**: Rp 30 per detik
- Deduction saldo dilakukan per panggilan selesai
- Pastikan ada pengecekan saldo sebelum panggilan dimulai

### Relasi Data
- Satu **User** memiliki banyak **Campaign**, **Lead**, **Transaction**
- Satu **Campaign** memiliki banyak **Lead** (many-to-many lewat tabel junction)
- Satu **Lead** bisa masuk ke banyak **Campaign**
- Satu **Campaign** menghasilkan banyak **Call Log**
- Satu **Lead** memiliki banyak **Call Log**

### Tentang Occasions (Tipe Layanan)
- `occasions` di profil user menentukan fitur apa yang terlihat di UI
- User bisa pilih keduanya (`["telesales", "collection"]`)
- Lead dan Campaign selalu bertipe salah satu

### Nomor HP
- Semua nomor HP disimpan dalam format E.164 tanpa `+` (contoh: `628123456789`)
- Frontend sudah mengirimkan dalam format ini

### Status Lead dan Lifecycle
- Lead tidak bisa dihapus jika masih aktif di campaign yang sedang berjalan (`status=active`)
- Status `promise_to_pay` hanya valid untuk lead bertipe `collection`
