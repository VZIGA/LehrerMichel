import { TestGenerator } from "@/components/TestGenerator";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoBooks, demoLessons } from "@/lib/data/demo";

export const dynamic = "force-dynamic";

export default async function NewTestPage() {
  let books = demoBooks.map(({ id, title }) => ({ id, title }));
  let lessons = demoLessons.map(({ id, book_id, number, title, level }) => ({ id, book_id, number, title, level }));
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = createAdminClient();
    const [{ data: bookData }, { data: lessonData }] = await Promise.all([
      supabase.from("books").select("id,title").order("title"),
      supabase.from("lessons").select("id,book_id,number,title,level").order("number")
    ]);
    if (bookData) books = bookData;
    if (lessonData) lessons = lessonData;
  }

  return <div className="page"><div className="eyebrow">Generator</div><h1>Test erstellen</h1><p className="muted">Die App lädt die gespeicherten Lektionsinhalte und verwendet sie als verbindliche Grundlage für die KI-Generierung.</p><TestGenerator books={books} lessons={lessons} configured={configured && Boolean(process.env.OPENAI_API_KEY)} /></div>;
}
