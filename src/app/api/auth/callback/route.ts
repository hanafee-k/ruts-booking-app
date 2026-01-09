import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // ถ้ามี next ให้ไปที่ next ถ้าไม่มีให้ไป dashboard
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // ถ้า Error หรือไม่มี Code ให้กลับไปหน้า Login
  return NextResponse.redirect(`${origin}/login`);
}