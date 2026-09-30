"use server";

import { redirect } from "next/navigation";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function createBook(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/books?error=supabase");
  }

  const title = String(formData.get("title") || "").trim();
  const publisher = String(formData.get("publisher") || "").trim();
  const language = String(formData.get("language") || "Deutsch").trim();
  const level = String(formData.get("level") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title) redirect("/books/new?error=title");

  const supabase = createAdminClient();
  const { error } = await supabase.from("books").insert({
    title,
    publisher: publisher || null,
    language,
    level: level || null,
    description: description || null
  });

  if (error) throw new Error(error.message);
  redirect("/books?created=1");
}
