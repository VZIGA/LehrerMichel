import Link from "next/link";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoLessons } from "@/lib/data/demo";

export const dynamic = "force-dynamic";

export default async function LessonsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  let lessons = demoLessons;
  let demoMode = true;

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("lessons").select("id,book_id,number,title,topic,level,description,books(title)").order("number");
    if (!error && data) {
      lessons = data as unknown as typeof demoLessons;
      demoMode = false;
    }
  }

  return (
    <div className="page">
      <div className="eyebrow">Lektionsdatenbank</div>
      <h1>Lektionen</h1>
      <div className="toolbar"><Link className="button" href="/lessons/new">+ Lektion anlegen</Link></div>
      {params.created && <div className="notice success">Lektion und Lerninhalte wurden gespeichert.</div>}
      {params.error === "supabase" && <div className="notice">Supabase ist noch nicht konfiguriert.</div>}
      {demoMode && <div className="notice">Demo-Modus: Solange Supabase nicht konfiguriert ist, werden Beispieldaten angezeigt.</div>}
      <div className="card"><table className="table"><thead><tr><th>Nr.</th><th>Lektion</th><th>Lehrwerk</th><th>Niveau</th><th>Thema</th></tr></thead><tbody>{lessons.map((lesson) => <tr key={lesson.id}><td>{lesson.number}</td><td>{lesson.title}</td><td>{lesson.books?.title || "–"}</td><td><span className="badge">{lesson.level}</span></td><td>{lesson.topic || "–"}</td></tr>)}</tbody></table></div>
    </div>
  );
}
