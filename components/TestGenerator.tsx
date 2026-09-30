"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type Book = { id: string; title: string };
type Lesson = { id: string; book_id: string; number: number; title: string; level: string | null };
type GeneratedTest = {
  title: string;
  instructions: string;
  totalPoints: number;
  sections: Array<{ title: string; points: number; tasks: Array<{ instruction: string; items: string[]; solution?: string | string[] }> }>;
};

export function TestGenerator({ books, lessons, configured }: { books: Book[]; lessons: Lesson[]; configured: boolean }) {
  const competencies = ["Wortschatz", "Grammatik", "Lesen", "Schreiben", "Hören", "Sprechen"];
  const [bookId, setBookId] = useState(books[0]?.id || "");
  const visibleLessons = useMemo(() => lessons.filter((lesson) => lesson.book_id === bookId), [lessons, bookId]);
  const [result, setResult] = useState<GeneratedTest | null>(null);
  const [materialId, setMaterialId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setResult(null); setMaterialId(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = {
      bookId: form.get("bookId"), lessonId: form.get("lessonId"), level: form.get("level"), difficulty: form.get("difficulty"),
      duration: Number(form.get("duration")), totalPoints: Number(form.get("totalPoints")), notes: form.get("notes"),
      competencies: competencies.filter((item) => form.get(`competency-${item}`) === "on")
    };

    try {
      const response = await fetch("/api/generate-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Der Test konnte nicht generiert werden.");
      setResult(data.test);
      setMaterialId(data.materialId || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally { setLoading(false); }
  }

  return (
    <>
      <form className="card form" onSubmit={submit}>
        <div className="row">
          <div className="field"><label>Lehrwerk</label><select name="bookId" value={bookId} onChange={(e) => setBookId(e.target.value)}>{books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select></div>
          <div className="field"><label>Lektion</label><select name="lessonId" required>{visibleLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>Lektion {lesson.number} – {lesson.title}</option>)}</select></div>
        </div>
        <div className="row"><div className="field"><label>Niveau</label><select name="level" defaultValue="B1"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div><div className="field"><label>Schwierigkeit</label><select name="difficulty" defaultValue="mittel"><option>leicht</option><option>mittel</option><option>schwer</option></select></div></div>
        <div className="row"><div className="field"><label>Dauer (Minuten)</label><input name="duration" type="number" min="5" defaultValue="45" /></div><div className="field"><label>Gesamtpunkte</label><input name="totalPoints" type="number" min="1" defaultValue="50" /></div></div>
        <div className="field"><label>Kompetenzen</label><div className="checkbox-grid">{competencies.map((item, i) => <label className="check" key={item}><input name={`competency-${item}`} type="checkbox" defaultChecked={i < 4} /> {item}</label>)}</div></div>
        <div className="field"><label>Zusätzliche Hinweise</label><textarea name="notes" placeholder="z. B. Schwerpunkt auf beruflicher Kommunikation, keine neuen grammatischen Strukturen ..." /></div>
        {!configured && <div className="notice">Für echte Generierung brauchst du Supabase und einen OpenAI-API-Schlüssel in <code>.env.local</code>.</div>}
        {error && <div className="notice error">{error}</div>}
        <div><button className="button" disabled={loading || !visibleLessons.length} type="submit">{loading ? "Test wird erstellt ..." : "Test generieren"}</button></div>
      </form>

      {result && <section className="card result"><div className="eyebrow">KI-Ergebnis</div>{materialId && <div className="toolbar"><Link className="button" href={`/materials/${materialId}`}>Im Testeditor öffnen →</Link></div>}<h2>{result.title}</h2><p>{result.instructions}</p><p><strong>Gesamt:</strong> {result.totalPoints} Punkte</p>{result.sections.map((section, index) => <div className="test-section" key={`${section.title}-${index}`}><h3>{section.title} <span className="badge">{section.points} P.</span></h3>{section.tasks.map((task, taskIndex) => <div className="task" key={taskIndex}><strong>Aufgabe {taskIndex + 1}</strong><p>{task.instruction}</p>{task.items?.length > 0 && <ol>{task.items.map((item, i) => <li key={i}>{item}</li>)}</ol>}{task.solution && <details><summary>Lösung anzeigen</summary><pre>{Array.isArray(task.solution) ? task.solution.join("\n") : task.solution}</pre></details>}</div>)}</div>)}</section>}
    </>
  );
}
