"use client";

import { useMemo, useState } from "react";

type Task = { instruction: string; items: string[]; solution?: string | string[] };
type Section = { title: string; points: number; tasks: Task[] };
type TestContent = { title: string; instructions: string; totalPoints: number; sections: Section[] };
type AIAction = "regenerate" | "easier" | "harder" | "change_type" | "item_count";

const taskTypes = [
  "Zuordnung",
  "Multiple Choice",
  "Richtig/Falsch",
  "Lückentext",
  "Satzergänzung",
  "Satzumformung",
  "Kurzantwort",
  "Reihenfolge",
  "Dialog ergänzen",
  "Rollenspiel",
  "Schreibaufgabe"
];

export function TestEditor({ materialId, initialContent }: { materialId: string; initialContent: TestContent }) {
  const [content, setContent] = useState<TestContent>(initialContent);
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [taskOptions, setTaskOptions] = useState<Record<string, { type: string; count: number; custom: string }>>({});

  const calculatedPoints = useMemo(
    () => content.sections.reduce((sum, section) => sum + Number(section.points || 0), 0),
    [content.sections]
  );

  function taskKey(sectionIndex: number, taskIndex: number) {
    return `${sectionIndex}-${taskIndex}`;
  }

  function getTaskOption(sectionIndex: number, taskIndex: number, task: Task) {
    const key = taskKey(sectionIndex, taskIndex);
    return taskOptions[key] || { type: "Zuordnung", count: Math.max(1, task.items?.length || 5), custom: "" };
  }

  function setTaskOption(sectionIndex: number, taskIndex: number, patch: Partial<{ type: string; count: number; custom: string }>, task: Task) {
    const key = taskKey(sectionIndex, taskIndex);
    const current = getTaskOption(sectionIndex, taskIndex, task);
    setTaskOptions((all) => ({ ...all, [key]: { ...current, ...patch } }));
  }

  function updateSection(index: number, patch: Partial<Section>) {
    setContent((current) => ({
      ...current,
      sections: current.sections.map((section, i) => (i === index ? { ...section, ...patch } : section))
    }));
  }

  function updateTask(sectionIndex: number, taskIndex: number, patch: Partial<Task>) {
    setContent((current) => ({
      ...current,
      sections: current.sections.map((section, i) =>
        i !== sectionIndex
          ? section
          : { ...section, tasks: section.tasks.map((task, j) => (j === taskIndex ? { ...task, ...patch } : task)) }
      )
    }));
  }

  async function reviseTask(sectionIndex: number, taskIndex: number, action: AIAction) {
    const section = content.sections[sectionIndex];
    const task = section.tasks[taskIndex];
    const option = getTaskOption(sectionIndex, taskIndex, task);
    const key = taskKey(sectionIndex, taskIndex);

    setBusyTask(key);
    setMessage("");
    try {
      const response = await fetch("/api/revise-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          action,
          sectionTitle: section.title,
          sectionPoints: section.points,
          task,
          desiredType: action === "change_type" ? option.type : "",
          itemCount: option.count,
          customInstruction: option.custom
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "KI-Überarbeitung fehlgeschlagen.");
      updateTask(sectionIndex, taskIndex, data.task);
      setMessage(`Aufgabe ${taskIndex + 1} in „${section.title}“ wurde von der KI überarbeitet. Bitte prüfen und anschließend speichern.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "KI-Überarbeitung fehlgeschlagen.");
    } finally {
      setBusyTask(null);
    }
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: content.title, content: { ...content, totalPoints: calculatedPoints } })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      setContent((current) => ({ ...current, totalPoints: calculatedPoints }));
      setMessage("Änderungen gespeichert.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  function printPdf(nextMode: "student" | "teacher") {
    setMode(nextMode);
    document.body.dataset.printMode = nextMode;
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <div className="editor-layout">
      <section className="editor-panel no-print">
        <div className="toolbar sticky-toolbar">
          <button className="button" onClick={save} disabled={saving}>{saving ? "Speichern ..." : "Speichern"}</button>
          <button className="button secondary" onClick={() => printPdf("student")}>Schüler-PDF</button>
          <button className="button secondary" onClick={() => printPdf("teacher")}>Lehrer-PDF</button>
        </div>
        {message && <div className={message.includes("fehl") || message.includes("API") ? "notice error" : "notice success"}>{message}</div>}
        {calculatedPoints !== content.totalPoints && <div className="notice">Abschnittspunkte: {calculatedPoints}. Gespeicherte Gesamtpunkte: {content.totalPoints}.</div>}

        <div className="field"><label>Titel</label><input value={content.title} onChange={(e) => setContent({ ...content, title: e.target.value })} /></div>
        <div className="field"><label>Allgemeine Arbeitsanweisung</label><textarea value={content.instructions} onChange={(e) => setContent({ ...content, instructions: e.target.value })} /></div>

        {content.sections.map((section, sectionIndex) => (
          <div className="card compact" key={sectionIndex}>
            <div className="row">
              <div className="field"><label>Abschnitt</label><input value={section.title} onChange={(e) => updateSection(sectionIndex, { title: e.target.value })} /></div>
              <div className="field"><label>Punkte</label><input type="number" min="0" value={section.points} onChange={(e) => updateSection(sectionIndex, { points: Number(e.target.value) })} /></div>
            </div>

            {section.tasks.map((task, taskIndex) => {
              const key = taskKey(sectionIndex, taskIndex);
              const option = getTaskOption(sectionIndex, taskIndex, task);
              const isBusy = busyTask === key;
              return (
                <div className="task-editor" key={taskIndex}>
                  <div className="task-title-row">
                    <strong>Aufgabe {taskIndex + 1}</strong>
                    {isBusy && <span className="badge">KI arbeitet …</span>}
                  </div>

                  <div className="ai-task-panel">
                    <div className="ai-task-heading">KI für diese Aufgabe</div>
                    <div className="task-ai-buttons">
                      <button className="mini-button" disabled={Boolean(busyTask)} onClick={() => reviseTask(sectionIndex, taskIndex, "regenerate")}>Neu generieren</button>
                      <button className="mini-button" disabled={Boolean(busyTask)} onClick={() => reviseTask(sectionIndex, taskIndex, "easier")}>Leichter</button>
                      <button className="mini-button" disabled={Boolean(busyTask)} onClick={() => reviseTask(sectionIndex, taskIndex, "harder")}>Schwieriger</button>
                    </div>
                    <div className="ai-options-grid">
                      <div className="field">
                        <label>Anderer Aufgabentyp</label>
                        <select value={option.type} onChange={(e) => setTaskOption(sectionIndex, taskIndex, { type: e.target.value }, task)}>
                          {taskTypes.map((type) => <option key={type}>{type}</option>)}
                        </select>
                        <button className="mini-button" disabled={Boolean(busyTask)} onClick={() => reviseTask(sectionIndex, taskIndex, "change_type")}>Typ übernehmen</button>
                      </div>
                      <div className="field">
                        <label>Anzahl Items</label>
                        <input type="number" min="1" max="20" value={option.count} onChange={(e) => setTaskOption(sectionIndex, taskIndex, { count: Number(e.target.value) }, task)} />
                        <button className="mini-button" disabled={Boolean(busyTask)} onClick={() => reviseTask(sectionIndex, taskIndex, "item_count")}>Anzahl übernehmen</button>
                      </div>
                    </div>
                    <div className="field">
                      <label>Optionaler Zusatzwunsch</label>
                      <input placeholder="z. B. mehr Pflegekontext, keine Multiple-Choice-Antworten ..." value={option.custom} onChange={(e) => setTaskOption(sectionIndex, taskIndex, { custom: e.target.value }, task)} />
                    </div>
                  </div>

                  <div className="field"><label>Arbeitsanweisung</label><textarea value={task.instruction} onChange={(e) => updateTask(sectionIndex, taskIndex, { instruction: e.target.value })} /></div>
                  <div className="field"><label>Aufgaben / Items (eine Zeile pro Item)</label><textarea value={(task.items || []).join("\n")} onChange={(e) => updateTask(sectionIndex, taskIndex, { items: e.target.value.split("\n").filter(Boolean) })} /></div>
                  <div className="field"><label>Lösung / Erwartungshorizont</label><textarea value={Array.isArray(task.solution) ? task.solution.join("\n") : (task.solution || "")} onChange={(e) => updateTask(sectionIndex, taskIndex, { solution: e.target.value })} /></div>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <section className={`paper ${mode}`}>
        <header className="paper-header">
          <div><strong>{content.title}</strong><div className="muted">Name: ________________________________</div></div>
          <div className="paper-meta">Datum: _______________<br />Gesamt: {calculatedPoints} Punkte</div>
        </header>
        <p>{content.instructions}</p>
        {content.sections.map((section, sectionIndex) => (
          <div className="print-section" key={sectionIndex}>
            <h2>{section.title} <span>{section.points} P.</span></h2>
            {section.tasks.map((task, taskIndex) => (
              <div className="print-task" key={taskIndex}>
                <p><strong>Aufgabe {taskIndex + 1}.</strong> {task.instruction}</p>
                {task.items?.length > 0 && <ol>{task.items.map((item, i) => <li key={i}>{item}</li>)}</ol>}
                <div className="answer-space" />
                {task.solution && <div className="teacher-only solution"><strong>Lösung / Erwartungshorizont:</strong><pre>{Array.isArray(task.solution) ? task.solution.join("\n") : task.solution}</pre></div>}
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
