import Link from "next/link";
import { notFound } from "next/navigation";
import { TestEditor } from "@/components/TestEditor";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <div className="page"><div className="notice">Supabase ist noch nicht konfiguriert.</div></div>;
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: material, error } = await supabase.from("materials").select("id,type,title,content,level,duration,status").eq("id", id).single();
  if (error || !material) notFound();
  if (material.type !== "test") return <div className="page"><Link href="/materials">← Materialien</Link><h1>{material.title}</h1><div className="notice">Für diesen Materialtyp gibt es in LehrerMichel v0.5 noch keinen Editor.</div></div>;

  return <div className="page wide-page"><div className="no-print"><div className="eyebrow">Testeditor · LehrerMichel</div><h1>{material.title}</h1><p className="muted"><Link href="/materials">← Zur Materialbibliothek</Link> · {material.level || "–"} · {material.duration ? `${material.duration} Minuten` : "ohne Zeitangabe"}</p></div><TestEditor materialId={material.id} initialContent={material.content as any} /></div>;
}
