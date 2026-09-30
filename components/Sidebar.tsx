import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">LehrerMichel</div>
      <nav className="nav">
        <Link href="/">Dashboard</Link>
        <Link href="/books">Lehrwerke</Link>
        <Link href="/lessons">Lektionen</Link>
        <Link href="/materials">Materialien</Link>
        <Link href="/tests/new">Test erstellen</Link>
      </nav>
    </aside>
  );
}
