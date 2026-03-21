import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";

const VALID_AMOUNTS = [1_000, 500_000, 1_000_000, 5_000_000];

export async function POST(request: NextRequest) {
  /* ── 1. Auth guard — get current user ── */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const authHeader = request.headers.get("authorization") ?? "";
  const token      = authHeader.replace("Bearer ", "");

  let userId = "anonymous";
  let email  = "user@panggil.ai";

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) {
      userId = data.user.id;
      email  = data.user.email ?? email;
    }
  }

  /* ── 2. Validate amount ── */
  const body = await request.json().catch(() => ({}));
  const amount: number = body.amount;

  if (!VALID_AMOUNTS.includes(amount)) {
    return NextResponse.json(
      { error: "Nominal tidak valid. Pilih salah satu nominal yang tersedia." },
      { status: 400 }
    );
  }

  /* ── 3. Check Xendit key ── */
  const xenditKey = process.env.XENDIT_SECRET_KEY;
  if (!xenditKey) {
    return NextResponse.json(
      { error: "Konfigurasi payment gateway belum lengkap. Hubungi admin." },
      { status: 503 }
    );
  }

  /* ── 4. Build external_id & URLs ── */
  const timestamp  = Date.now();
  const externalId = `panggil-topup-${userId}-${amount}-${timestamp}`;
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  /* ── 5. Create Xendit invoice ── */
  const xenditPayload = {
    external_id:          externalId,
    amount,
    currency:             "IDR",
    description:          `Top Up Saldo Panggil AI – Rp ${amount.toLocaleString("id-ID")}`,
    customer: {
      email,
    },
    customer_notification_preference: {
      invoice_created:  ["email"],
      invoice_reminder: ["email"],
      invoice_paid:     ["email"],
    },
    success_redirect_url: `${appUrl}/dashboard/billing/success`,
    failure_redirect_url: `${appUrl}/dashboard/billing`,
    payment_methods: [
      "BCA", "BNI", "BRI", "MANDIRI", "PERMATA",
      "OVO", "DANA", "LINKAJA", "SHOPEEPAY",
      "QRIS",
    ],
    items: [
      {
        name:     "Top Up Saldo Panggil AI",
        quantity: 1,
        price:    amount,
        category: "Top Up",
      },
    ],
  };

  const xenditRes = await fetch(XENDIT_API_URL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Basic " + Buffer.from(xenditKey + ":").toString("base64"),
    },
    body: JSON.stringify(xenditPayload),
  });

  if (!xenditRes.ok) {
    const errBody = await xenditRes.json().catch(() => ({}));
    console.error("[Xendit] create invoice failed:", errBody);
    return NextResponse.json(
      { error: errBody.message ?? "Gagal membuat invoice Xendit." },
      { status: 502 }
    );
  }

  const invoice = await xenditRes.json();

  return NextResponse.json({
    invoiceUrl: invoice.invoice_url,
    invoiceId:  invoice.id,
    externalId: invoice.external_id,
  });
}
