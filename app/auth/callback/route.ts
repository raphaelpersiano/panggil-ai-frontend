import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code       = requestUrl.searchParams.get("code");
  const origin     = requestUrl.origin;

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.session) {
      const user = data.session.user;
      // Existing user who completed onboarding → dashboard
      if (user.user_metadata?.onboarding_complete === true) {
        return NextResponse.redirect(new URL("/dashboard", origin));
      }
      // New user (Google sign-up) or mid-onboarding → start / resume onboarding
      return NextResponse.redirect(new URL("/onboarding/company-profile", origin));
    }
  }

  // Fallback — let root page decide
  return NextResponse.redirect(new URL("/", origin));
}
