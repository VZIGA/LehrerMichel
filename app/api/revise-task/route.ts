import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

const taskSchema = {
  type: "object",
  additionalProperties: false,
  required: ["instruction", "items", "solution"],
  properties: {
    instruction: { type: "string" },
    items: { type: "array", items: { type: "string" } },
    solution: {
      anyOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } }
      ]
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

const actionLabels: Record<string, string> = {
  regenerate: "Erstelle eine neue inhaltliche Variante derselben Aufgabe.",
  easier: "Vereinfache die Aufgabe sprachlich und kognitiv, ohne das Lernziel zu verändern.",
  harder: "Mache die Aufgabe anspruchsvoller und erhöhe den Transferanteil, ohne das Lernziel zu verändern.",
  change_type: "Erstelle die Aufgabe im gewünschten neuen Aufgabentyp.",
  item_count: "Passe die Aufgabe an die gewünschte Anzahl von Items an."
};

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase ist noch nicht konfiguriert." }, { status: 503 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY fehlt in .env.local." }, { status: 503 });
    }

    const body = await request.json();
    const materialId = String(body.materialId || "");
    const action = String(body.action || "regenerate");
    const desiredType = String(body.desiredType || "").trim();
    const itemCount = Math.max(1, Math.min(20, Number(body.itemCount || body.task?.items?.length || 5)));

    if (!materialId || !body.task) {
      return NextResponse.json({ error: "Material-ID oder Aufgabe fehlt." }, { status: 400 });
    }
    if (!actionLabels[action]) {
      return NextResponse.json({ error: "Unbekannte KI-Aktion." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("id,lesson_id,title,level,duration,content")
      .eq("id", materialId)
      .single();

    if (materialError || !material?.lesson_id) {
      return NextResponse.json({ error: "Das Material oder seine Lektion wurde nicht gefunden." }, { status: 404 });
    }

    const lessonId = String(material.lesson_id);
    const [
      { data: lesson, error: lessonError },
      { data: objectives },
      { data: vocabulary },
      { data: grammar },
      { data: phrases }
    ] = await Promise.all([
      supabase.from("lessons").select("id,number,title,topic,level,description,books(title)").eq("id", lessonId).single(),
      supabase.from("lesson_learning_objectives").select("description").eq("lesson_id", lessonId),
      supabase.from("lesson_vocabulary").select("word,meaning,example").eq("lesson_id", lessonId),
      supabase.from("lesson_grammar").select("topic,notes").eq("lesson_id", lessonId),
      supabase.from("lesson_phrases").select("phrase").eq("lesson_id", lessonId)
    ]);

    if (lessonError || !lesson) {
      return NextResponse.json({ error: "Die zugehörige Lektion wurde nicht gefunden." }, { status: 404 });
    }

    const context = {
      book: Array.isArray(lesson.books) ? lesson.books[0]?.title : (lesson.books as any)?.title,
      lesson: {
        number: lesson.number,
        title: lesson.title,
        topic: lesson.topic,
        level: lesson.level,
        description: lesson.description
      },
      learningObjectives: objectives?.map((x: any) => x.description) || [],
      vocabulary: vocabulary || [],
      grammar: grammar || [],
      phrases: phrases?.map((x: any) => x.phrase) || []
    };

    const prompt = `Überarbeite genau EINE Aufgabe eines DaF/DaZ-Tests. Der restliche Test darf nicht verändert werden.\n\nLektionskontext:\n${JSON.stringify(context, null, 2)}\n\nTestkontext:\n- Test: ${material.title}\n- Niveau: ${material.level || lesson.level || "nicht angegeben"}\n- Abschnitt: ${body.sectionTitle || "nicht angegeben"}\n- Abschnittspunkte: ${Number(body.sectionPoints || 0)}\n\nAktuelle Aufgabe:\n${JSON.stringify(body.task, null, 2)}\n\nGewünschte Aktion:\n${actionLabels[action]}\n${desiredType ? `- Gewünschter Aufgabentyp: ${desiredType}\n` : ""}- Gewünschte Item-Anzahl: ${itemCount}\n${body.customInstruction ? `- Zusatzwunsch des Lehrers: ${String(body.customInstruction)}\n` : ""}\nRegeln:\n1. Nutze ausschließlich Inhalte, die aus dem Lektionskontext ableitbar sind.\n2. Behalte das didaktische Lernziel der bisherigen Aufgabe bei, außer der Zusatzwunsch verlangt ausdrücklich etwas anderes.\n3. Erzeuge exakt ${itemCount} Items.\n4. Formuliere eindeutige, lösbare Arbeitsanweisungen.\n5. Liefere für alle Items eine eindeutige Lösung bzw. einen klaren Erwartungshorizont.\n6. Reproduziere keine längeren Lehrwerkstexte wörtlich; formuliere neue Beispiele und Texte.\n7. Gib ausschließlich die überarbeitete Aufgabe im vorgegebenen JSON-Schema zurück.`;

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        instructions: "Du bist ein erfahrener DaF/DaZ-Aufgabenentwickler. Antworte ausschließlich im vorgegebenen JSON-Schema.",
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "revised_task",
            strict: true,
            schema: taskSchema
          }
        }
      })
    });

    const payload = await aiResponse.json();
    if (!aiResponse.ok) {
      return NextResponse.json({ error: payload?.error?.message || "OpenAI-Anfrage fehlgeschlagen." }, { status: 502 });
    }

    const text = collectOutputText(payload);
    if (!text) return NextResponse.json({ error: "Die KI hat keine auswertbare Aufgabe geliefert." }, { status: 502 });

    return NextResponse.json({ task: JSON.parse(text) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Serverfehler" }, { status: 500 });
  }
}
