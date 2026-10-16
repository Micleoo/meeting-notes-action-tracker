import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId)
      return NextResponse.json(
        { error: "Silakan masuk kembali." },
        { status: 401 },
      );
    const { data: caller } = await supabase
      .from("workspace_members")
      .select("id,role")
      .eq("workspace_id", workspaceId)
      .eq("profile_id", userId)
      .is("left_at", null)
      .maybeSingle();
    if (caller?.role !== "owner")
      return NextResponse.json(
        { error: "Hanya Owner dapat mengundang Member." },
        { status: 403 },
      );
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json(
        { error: "Alamat email tidak valid." },
        { status: 400 },
      );
    const admin = createAdminClient();
    const { data: invitation, error: insertError } = await admin
      .from("workspace_invitations")
      .insert({
        workspace_id: workspaceId,
        invited_by_member_id: caller.id,
        invitee_email: email,
      })
      .select("id,token")
      .single();
    if (insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const inviteRedirect = `${origin}/auth/callback?invitation=${invitation.token}`;
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: inviteRedirect,
        data: { invitation_token: invitation.token },
      },
    );
    if (inviteError) {
      const existingUser =
        /already (?:been )?registered|user already exists/i.test(
          inviteError.message,
        );
      const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (existingUser && publishableKey) {
        const authClient = createSupabaseClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          publishableKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          },
        );
        const { error: linkError } = await authClient.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: inviteRedirect,
          },
        });
        if (!linkError) return NextResponse.json({ ok: true });
        await admin
          .from("workspace_invitations")
          .update({ status: "cancelled" })
          .eq("id", invitation.id);
        return NextResponse.json({ error: linkError.message }, { status: 400 });
      }
      await admin
        .from("workspace_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitation.id);
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Undangan gagal dibuat.",
      },
      { status: 500 },
    );
  }
}
