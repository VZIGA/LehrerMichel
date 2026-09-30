import Link from "next/link";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoBooks } from "@/lib/data/demo";

export const dynamic = "force-dynamic";

export default async function BooksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  let books = demoBooks;
  let demoMode = true;

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("books").select("id,title,publisher,language,level").order("created_at", { ascending: false });
    if (!error && data) {
      books = data as typeof demoBooks;
      demoMode = false;
    }
  }

  return (
    <div className="page">
      <div className="eyebrow">Bibliothek</div>
      <h1>Lehrwerke</h1>
      <div className="toolbar"><Link className="button" href="/books/new">+ Lehrwerk anlegen</Link></div>
      {params.created && <div className="notice success">Lehrwerk wurde gespeichert.</div>}
      {params.error === "supabase" && <div className="notice">Supabase ist noch nicht konfiguriert. Trage zuerst die Werte aus <code>.env.example</code> in <code>.env.local</code> ein.</div>}
      {demoMode && <div className="notice">Demo-Modus: Solange Supabase nicht konfiguriert ist, werden Beispieldaten angezeigt.</div>}
      <div className="card">
        <table className="table">
          <thead><tr><th>Titel</th><th>Verlag / Quelle</th><th>Sprache</th><th>Niveau</th></tr></thead>
          <tbody>{books.map((book) => <tr key={book.id}><td>{book.title}</td><td>{book.publisher || "–"}</td><td>{book.language}</td><td><span className="badge">{book.level || "–"}</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
