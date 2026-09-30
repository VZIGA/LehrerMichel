import Link from "next/link";
import { createBook } from "../actions";

export default function NewBookPage() {
  return (
    <div className="page">
      <div className="eyebrow">Bibliothek</div>
      <h1>Lehrwerk anlegen</h1>
      <p className="muted">Lege ein Lehrwerk oder eigenes Kursmaterial an. Lektionen werden anschließend separat ergänzt.</p>
      <form action={createBook} className="card form">
        <div className="field"><label htmlFor="title">Titel *</label><input id="title" name="title" required placeholder="z. B. Deutsch in der Pflege" /></div>
        <div className="row">
          <div className="field"><label htmlFor="publisher">Verlag / Quelle</label><input id="publisher" name="publisher" placeholder="optional" /></div>
          <div className="field"><label htmlFor="language">Sprache</label><input id="language" name="language" defaultValue="Deutsch" /></div>
        </div>
        <div className="field"><label htmlFor="level">Niveau</label><select id="level" name="level" defaultValue="B1"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option><option value="A2–B1">A2–B1</option></select></div>
        <div className="field"><label htmlFor="description">Beschreibung</label><textarea id="description" name="description" placeholder="Themen, Zielgruppe oder Hinweise ..." /></div>
        <div className="toolbar"><button className="button" type="submit">Lehrwerk speichern</button><Link className="button secondary" href="/books">Abbrechen</Link></div>
      </form>
    </div>
  );
}
