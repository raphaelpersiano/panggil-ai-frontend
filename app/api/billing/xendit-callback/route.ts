import { NextRequest, NextResponse } from "next/server";

/**
 * Xendit Webhook Handler — receives payment status callbacks from Xendit.
 *
 * Register this URL in Xendit Dashboard → Settings → Callbacks:
 *   https://<your-domain>/api/billing/xendit-callback
 *
 * Xendit sends a POST request with the invoice object in the body.
 * The `x-callback-token` header must match XENDIT_CALLBACK_TOKEN env var.
 *
 * Docs: https://developers.xendit.co/api-reference/#invoice-callback
 */
export async function POST(request: NextRequest) {
  /* ── 1. Verify callback token ── */
  const callbackToken = request.headers.get("x-callback-token");
  const expectedToken = process.env.XENDIT_CALLBACK_TOKEN;

  if (expectedToken && callbackToken !== expectedToken) {
    console.warn("[xendit-callback] Invalid callback token — rejected.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ── 2. Parse body ── */
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    id:           invoiceId,
    external_id:  externalId,
    status,
    paid_amount:  paidAmount,
    paid_at:      paidAt,
  } = payload as {
    id:          string;
    external_id: string;
    status:      string;
    paid_amount: number;
    paid_at:     string;
  };

  // Log webhook receipt for audit (remove in prod if using structured logging)

  /* ── 3. Handle PAID status ── */
  if (status === "PAID") {
    const parts  = (externalId ?? "").split("-");
    const userId = parts[2];
    const amount = parseInt(parts[3], 10);

    if (!userId || isNaN(amount)) {
      console.error("[xendit-callback] Could not parse userId/amount from externalId:", externalId);
      return NextResponse.json({ received: true });
    }

    // 3a. Credit user balance via RPC (atomic, avoids race conditions)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: rpcErr } = await supabase.rpc("credit_balance", {
      p_user_id: userId,
      p_amount: amount,
    });

    if (rpcErr) {
      console.error("[xendit-callback] credit_balance RPC failed:", rpcErr.message);
      // Continue to transaction logging anyway; do not retry webhook
    }

    // 3b. Log transaction record for audit trail
    const { error: insertErr } = await supabase.from("transactions").insert({
      user_id: userId,
      invoice_id: invoiceId,
      external_id: externalId,
      type: "topup",
      amount,
      paid_at: paidAt,
      status: "success",
    });

    if (insertErr) {
      console.error("[xendit-callback] transaction insert failed:", insertErr.message);
    }
  }

  /* ── 4. Handle EXPIRED / FAILED ── */
  if (status === "EXPIRED" || status === "FAILED") {
    console.log(`[xendit-callback] ${status} — invoiceId=${invoiceId} externalId=${externalId}`);

    // Attempt to log failed transaction if we can parse userId/amount
    const parts = (externalId ?? "").split("-");
    const userId = parts[2];
    const amount = parseInt(parts[3], 10);

    if (userId && !isNaN(amount)) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase.from("transactions").insert({
        user_id: userId,
        invoice_id: invoiceId,
        external_id: externalId,
        type: "topup",
        amount,
        status: status === "FAILED" ? "failed" : "expired",
      }).catch((err) => {
        console.error("[xendit-callback] failed to log failed transaction:", err.message);
      });
    }
    // No further action for EXPIRED/FAILED
  }

  // Always respond 200 to Xendit, otherwise it will retry
  return NextResponse.json({ received: true });
}
