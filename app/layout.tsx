import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata = {
  title: "LehrerMichel",
  description: "LehrerMichel – KI-gestützte Unterrichtsplanung und Materialerstellung"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
