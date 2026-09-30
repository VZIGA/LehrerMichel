"use server";

import { redirect } from "next/navigation";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

function lines(value: FormDataEntryValue | null) {
  return String(value || "").split("\n").map((v) => v.trim()).filter(Boolean);
}

export async function createLesson(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/lessons?error=supabase");

  const bookId = String(formData.get("book_id") || "");
  const number = Number(formData.get("number") || 0);
  const title = String(formData.get("title") || "").trim();
  const topic = String(formData.get("topic") || "").trim();
  const level = String(formData.get("level") || "B1");
  const description = String(formData.get("description") || "").trim();

  if (!bookId || !number || !title) redirect("/lessons/new?error=required");

  const supabase = createAdminClient();
  const { data: lesson, error } = await supabase.from("lessons").insert({ book_id: bookId, number, title, topic: topic || null, level, description: description || null }).select("id").single();
  if (error || !lesson) throw new Error(error?.message || "Lektion konnte nicht erstellt werden.");

  const objectives = lines(formData.get("objectives"));
  const vocabulary = lines(formData.get("vocabulary"));
  const grammar = lines(formData.get("grammar"));
  const phrases = lines(formData.get("phrases"));

  if (objectives.length) await supabase.from("lesson_learning_objectives").insert(objectives.map((description) => ({ lesson_id: lesson.id, description })));
  if (vocabulary.length) await supabase.from("lesson_vocabulary").insert(vocabulary.map((word) => ({ lesson_id: lesson.id, word })));
  if (grammar.length) await supabase.from("lesson_grammar").insert(grammar.map((topic) => ({ lesson_id: lesson.id, topic })));
  if (phrases.length) await supabase.from("lesson_phrases").insert(phrases.map((phrase) => ({ lesson_id: lesson.id, phrase })));

  redirect("/lessons?created=1");
}
