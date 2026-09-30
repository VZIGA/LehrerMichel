import Link from "next/link";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="page">
        <div className="eyebrow">Archiv</div>
        <h1>Meine Materialien</h1>
        <div className="notice">Supabase ist noch nicht konfiguriert. Nach der Einrichtung werden generierte Tests hier automatisch gespeichert.</div>
      </div>
    );
  }

  const supabase = createAdminClient();
  const { data: materials, error } = await supabase
    .from("materials")
    .select("id,type,title,level,duration,status,created_at,lessons(title,number)")
    .order("created_at", { ascending: false });

  return (
    <div className="page">
      <div className="eyebrow">Archiv</div>
      <h1>Meine Materialien</h1>
      <div className="toolbar"><Link className="button" href="/tests/new">+ Neuen Test erstellen</Link></div>
      {error && <div className="notice error">Materialien konnten nicht geladen werden: {error.message}</div>}
      {!error && (!materials || materials.length === 0) && <div className="card"><h2>Noch keine gespeicherten Materialien</h2><p className="muted">Sobald du einen Test generierst, wird er hier als Entwurf gespeichert.</p></div>}
      {materials && materials.length > 0 && <div className="card"><table className="table"><thead><tr><th>Titel</th><th>Typ</th><th>Lektion</th><th>Niveau</th><th>Dauer</th><th>Status</th></tr></thead><tbody>{materials.map((material: any) => {
        const lesson = Array.isArray(material.lessons) ? material.lessons[0] : material.lessons;
        return <tr key={material.id}><td><Link className="table-link" href={`/materials/${material.id}`}>{material.title}</Link></td><td>{material.type}</td><td>{lesson ? `${lesson.number} – ${lesson.title}` : "–"}</td><td>{material.level || "–"}</td><td>{material.duration ? `${material.duration} Min.` : "–"}</td><td><span className="badge">{material.status}</span></td></tr>;
      })}</tbody></table></div>}
    </div>
  );
}
