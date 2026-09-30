import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

const testSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "instructions", "totalPoints", "sections"],
  properties: {
    title: { type: "string" },
    instructions: { type: "string" },
    totalPoints: { type: "integer" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "points", "tasks"],
        properties: {
          title: { type: "string" },
          points: { type: "integer" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["instruction", "items", "solution"],
              properties: {
                instruction: { type: "string" },
                items: { type: "array", items: { type: "string" } },
                solution: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] }
              }
            }
          }
        }
      }
    }
  }
};

function collectOutputText(payload: any) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const parts: string[] = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n");
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase ist noch nicht konfiguriert." }, { status: 503 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY fehlt in .env.local." }, { status: 503 });

    const input = await request.json();
    const supabase = createAdminClient();
    const lessonId = String(input.lessonId || "");

    const [{ data: lesson, error: lessonError }, { data: objectives }, { data: vocabulary }, { data: grammar }, { data: phrases }] = await Promise.all([
      supabase.from("lessons").select("id,number,title,topic,level,description,books(title)").eq("id", lessonId).single(),
      supabase.from("lesson_learning_objectives").select("description").eq("lesson_id", lessonId),
      supabase.from("lesson_vocabulary").select("word,meaning,example").eq("lesson_id", lessonId),
      supabase.from("lesson_grammar").select("topic,notes").eq("lesson_id", lessonId),
      supabase.from("lesson_phrases").select("phrase").eq("lesson_id", lessonId)
    ]);

    if (lessonError || !lesson) return NextResponse.json({ error: "Die ausgewählte Lektion wurde nicht gefunden." }, { status: 404 });

    const context = {
      book: Array.isArray(lesson.books) ? lesson.books[0]?.title : (lesson.books as any)?.title,
      lesson: { number: lesson.number, title: lesson.title, topic: lesson.topic, level: lesson.level, description: lesson.description },
      learningObjectives: objectives?.map((x) => x.description) || [],
      vocabulary: vocabulary || [], grammar: grammar || [], phrases: phrases?.map((x) => x.phrase) || []
    };

    const prompt = `Erstelle einen didaktisch validen DaF/DaZ-Lektionstest ausschließlich auf Basis der bereitgestellten Lektionsdaten.\n\nLektionsdaten:\n${JSON.stringify(context, null, 2)}\n\nVorgaben des Lehrers:\n- Niveau: ${input.level}\n- Dauer: ${input.duration} Minuten\n- Gesamtpunkte: ${input.totalPoints}\n- Schwierigkeit: ${input.difficulty}\n- Kompetenzen: ${(input.competencies || []).join(", ")}\n- Hinweise: ${input.notes || "keine"}\n\nRegeln:\n1. Prüfe nur Lerninhalte, die aus den Lektionsdaten ableitbar sind.\n2. Formuliere klare Arbeitsanweisungen auf passendem GER-Niveau.\n3. Die Summe der Abschnittspunkte muss exakt ${input.totalPoints} ergeben.\n4. Gib zu jeder Aufgabe eine eindeutige Lösung oder einen Erwartungshorizont an.\n5. Keine urheberrechtlich geschützten Lehrwerkstexte wörtlich reproduzieren; erstelle neue Aufgaben und neue Beispieltexte.`;

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        instructions: "Du bist ein erfahrener DaF/DaZ-Prüfungsentwickler. Antworte ausschließlich im vorgegebenen JSON-Schema.",
        input: prompt,
        text: { format: { type: "json_schema", name: "lesson_test", strict: true, schema: testSchema } }
      })
    });

    const payload = await aiResponse.json();
    if (!aiResponse.ok) return NextResponse.json({ error: payload?.error?.message || "OpenAI-Anfrage fehlgeschlagen." }, { status: 502 });

    const text = collectOutputText(payload);
    if (!text) return NextResponse.json({ error: "Die KI hat keine auswertbare Antwort geliefert." }, { status: 502 });
    const test = JSON.parse(text);

    const { data: material, error: materialError } = await supabase.from("materials").insert({ lesson_id: lessonId, type: "test", title: test.title, content: test, level: input.level, duration: input.duration, status: "draft" }).select("id").single();
    if (materialError) return NextResponse.json({ error: `Test wurde erzeugt, konnte aber nicht gespeichert werden: ${materialError.message}` }, { status: 500 });

    return NextResponse.json({ test, materialId: material.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Serverfehler" }, { status: 500 });
  }
}
