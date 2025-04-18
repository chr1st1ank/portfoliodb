## 📘 Projektbeschreibung: **Wertpapierportfolio-Tracker**

### Ziel  
Ein webbasiertes Tool zur Verwaltung und Auswertung eines privaten Wertpapierportfolios. Es ermöglicht den Import von PDF-Buchungen (z. B. von Flatex), speichert die Daten persistent, zeigt die Wertentwicklung einzelner Papiere sowie des Gesamtportfolios grafisch an und aktualisiert Kursdaten regelmäßig per Web-Scraping.

---

### Hauptfunktionen

#### 📈 Portfolio-Auswertung

- Gesamtportfolio-Entwicklung inkl. Einzahlungen/Entnahmen
- Anzeige der historischen Wertentwicklung einzelner Wertpapiere
- Diagramme (z. B. Linien-, Balken- oder Tortendiagramme) zur Visualisierung

#### 📄 Buchungen

- Upload von PDF-Dokumenten (z. B. Kauf/Verkauf von Flatex)
- Parsing und Extraktion von Buchungsdaten (Datum, ISIN, Stückzahl, Kurs, Gebühren, etc.)
- Möglichkeit zur manuellen Korrektur und Ergänzung über Web-UI oder Admin-Interface

#### 🔁 Kursaktualisierung

- Täglicher Abruf aktueller Kurse via Web-Scraping (z. B. von Bankwebseite)
- Automatisch per Cronjob oder geplanter Hintergrundtask

#### 💻 Frontend

- Moderne React-App mit sauberem UI
- Übersichtliche Darstellung von Buchungen, Performance, Depotzusammensetzung

#### 🗃️ Datenhaltung

- Lokale SQLite-Datenbank
- Persistente Speicherung aller Buchungen und Kurse
- Keine Benutzerverwaltung notwendig (Single-User)

---

### Architektur

- **Backend**: Django + Django REST Framework
- **Frontend**: React + Vite + Tailwind + Chart.js/Recharts
- **Deployment**: Lokal startbar, optional als Docker-Container für Serverbetrieb
- **Dependency management für Python**: Mit uv

---
