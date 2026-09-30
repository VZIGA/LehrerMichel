# LehrerMichel – Version 0.5

**LehrerMichel** ist eine browserbasierte Web-App für DaF/DaZ-Lehrkräfte zur Planung von Unterricht und zur KI-gestützten Erstellung von Tests und Materialien.

## Aktueller Funktionsumfang

- Lehrwerke verwalten
- Lektionen mit Lernzielen, Wortschatz, Grammatik und Redemitteln anlegen
- KI-Tests aus Lektionsdaten generieren
- Tests bearbeiten und einzelne Aufgaben mit KI überarbeiten
- Schüler- und Lehrerfassung anzeigen
- A4-PDF über den Browser-Druckdialog speichern
- Materialien in Supabase speichern
- OpenAI-Provider vorbereitet

## Browserbasierte Nutzung

Die App läuft als Next.js-Webanwendung und kann lokal im Browser oder später online gehostet werden.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Danach im Browser öffnen:

```text
http://localhost:3000
```

## Umgebungsvariablen

```env
SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=DEIN_SERVICE_ROLE_KEY
OPENAI_API_KEY=DEIN_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.6-luna
```

## Sicherheit

Der Supabase-Service-Role-Key und der OpenAI-API-Key bleiben serverseitig. Für ein öffentliches Deployment sollte als nächster Schritt Login + Row Level Security ergänzt werden.

## Nächste Ausbaustufe

PDF-/Lehrwerk-Import: PDF hochladen → Inhalte analysieren → Thema, Lernziele, Wortschatz, Grammatik und Redemittel vorschlagen → prüfen → als Lektion speichern.
