import Link from "next/link";
import { createLesson } from "../actions";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoBooks } from "@/lib/data/demo";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  let books = demoBooks;
  const configured = isSupabaseConfigured();
  if (configured) {
    const supabase = createAdminClient();
    const { data } = await supabase.from("books").select("id,title").order("title");
    if (data) books = data.map((b) => ({ ...b, publisher: "", language: "Deutsch", level: "" }));
  }

  return (
    <div className="page">
      <div className="eyebrow">Lektionsdatenbank</div>
      <h1>Lektion anlegen</h1>
      {!configured && <div className="notice">Supabase ist noch nicht konfiguriert. Das Formular kann erst danach speichern.</div>}
      <form action={createLesson} className="card form">
        <div className="field"><label htmlFor="book_id">Lehrwerk *</label><select id="book_id" name="book_id" required>{books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select></div>
        <div className="row">
          <div className="field"><label htmlFor="number">Lektionsnummer *</label><input id="number" name="number" type="number" min="1" required /></div>
          <div className="field"><label htmlFor="level">Niveau</label><select id="level" name="level" defaultValue="B1"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div>
        </div>
        <div className="field"><label htmlFor="title">Titel *</label><input id="title" name="title" required placeholder="z. B. Körperpflege" /></div>
        <div className="field"><label htmlFor="topic">Thema</label><input id="topic" name="topic" placeholder="z. B. Körperpflege im beruflichen Alltag" /></div>
        <div className="field"><label htmlFor="description">Beschreibung</label><textarea id="description" name="description" /></div>
        <div className="field"><label htmlFor="objectives">Lernziele – eine Zeile pro Lernziel</label><textarea id="objectives" name="objectives" placeholder={'Patienten nach Bedürfnissen fragen\nHilfe höflich anbieten'} /></div>
        <div className="field"><label htmlFor="vocabulary">Wortschatz – ein Ausdruck pro Zeile</label><textarea id="vocabulary" name="vocabulary" placeholder={'der Waschlappen\ndas Handtuch\nsich waschen'} /></div>
        <div className="field"><label htmlFor="grammar">Grammatik – ein Thema pro Zeile</label><textarea id="grammar" name="grammar" placeholder={'reflexive Verben\nModalverben'} /></div>
        <div className="field"><label htmlFor="phrases">Redemittel – ein Ausdruck pro Zeile</label><textarea id="phrases" name="phrases" placeholder={'Soll ich Ihnen helfen?\nMöchten Sie sich selbst waschen?'} /></div>
        <div className="toolbar"><button className="button" type="submit">Lektion speichern</button><Link className="button secondary" href="/lessons">Abbrechen</Link></div>
      </form>
    </div>
  );
}
