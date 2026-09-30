import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="page">
      <div className="eyebrow">Version 0.5</div>
      <h1>Dein Lehrer-Assistent</h1>
      <p className="muted">Plane Unterricht, verwalte Lektionen und bereite Tests sowie Arbeitsmaterialien vor.</p>

      <div className="grid">
        <Link className="card card-action" href="/tests/new">
          <strong>Test erstellen</strong>
          <span className="muted">Lektion, Niveau, Punkte und Kompetenzen festlegen.</span>
        </Link>
        <Link className="card card-action" href="/books">
          <strong>Lehrwerke verwalten</strong>
          <span className="muted">Bücher und Kursmaterialien strukturiert erfassen.</span>
        </Link>
        <Link className="card card-action" href="/lessons">
          <strong>Lektionen verwalten</strong>
          <span className="muted">Lernziele, Wortschatz und Grammatik hinterlegen.</span>
        </Link>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <h2>Geplanter Arbeitsablauf</h2>
        <p className="muted">Lehrwerk → Lektion → Lerninhalte → KI-Test generieren → automatisch speichern. PDF-Export und Editor folgen in v0.3.</p>
      </section>
    </div>
  );
}
