import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase ist noch nicht konfiguriert." }, { status: 503 });
    const { id } = await params;
    const body = await request.json();
    if (!body?.content || typeof body?.title !== "string") return NextResponse.json({ error: "Ungültige Materialdaten." }, { status: 400 });
    const supabase = createAdminClient();
    const { error } = await supabase.from("materials").update({ title: body.title, content: body.content, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Serverfehler" }, { status: 500 });
  }
}
