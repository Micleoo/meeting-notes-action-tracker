import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function callbackError(request: NextRequest, message: string) {
  const destination = new URL("/", request.url);
  destination.searchParams.set("authError", message);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tokenType = request.nextUrl.searchParams.get("type");
  const invitation = request.nextUrl.searchParams.get("invitation");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return callbackError(request, error.message);
  } else if (tokenHash) {
    if (!tokenType || !["invite", "magiclink", "email"].includes(tokenType)) {
      return callbackError(request, "Tautan autentikasi tidak valid.");
    }
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tokenType as "invite" | "magiclink" | "email",
    });
    if (error) return callbackError(request, error.message);
  } else if (invitation) {
    return callbackError(
      request,
      "Undangan tidak dapat diterima sebelum sesi email terverifikasi.",
    );
  }

  if (invitation) {
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims?.sub)
      return callbackError(request, "Silakan masuk untuk menerima undangan.");
    const { error } = await supabase.rpc("accept_workspace_invitation", {
      invitation_token: invitation,
    });
    if (error) return callbackError(request, error.message);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
