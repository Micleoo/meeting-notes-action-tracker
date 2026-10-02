import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get("code");
  const token = request.nextUrl.searchParams.get("invitation");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error)
      return NextResponse.redirect(
        new URL(
          `/?authError=${encodeURIComponent(error.message)}`,
          request.url,
        ),
      );
  }
  if (token) {
    const { error } = await supabase.rpc("accept_workspace_invitation", {
      invitation_token: token,
    });
    if (error)
      return NextResponse.redirect(
        new URL(
          `/?authError=${encodeURIComponent(error.message)}`,
          request.url,
        ),
      );
  }
  return NextResponse.redirect(new URL("/", request.url));
}
