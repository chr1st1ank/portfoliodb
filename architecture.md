## 📘 Projektbeschreibung: **Wertpapierportfolio-Tracker**

### Ziel  
Ein webbasiertes Tool zur Verwaltung und Auswertung eines privaten Wertpapierportfolios. Es ermöglicht den Import von PDF-Buchungen (z. B. von Flatex), speichert die Daten persistent, zeigt die Wertentwicklung einzelner Papiere sowie des Gesamtportfolios grafisch an und aktualisiert Kursdaten regelmäßig per Web-Scraping.

---

### Hauptfunktionen

#### 📄 Buchungen
- Upload von PDF-Dokumenten (z. B. Kauf/Verkauf von Flatex)
- Parsing und Extraktion von Buchungsdaten (Datum, ISIN, Stückzahl, Kurs, Gebühren, etc.)
- Möglichkeit zur manuellen Korrektur und Ergänzung über Web-UI oder Admin-Interface

#### 📈 Portfolio-Auswertung
- Anzeige der historischen Wertentwicklung einzelner Wertpapiere
- Gesamtportfolio-Entwicklung inkl. Einzahlungen/Entnahmen
- Diagramme (z. B. Linien-, Balken- oder Tortendiagramme) zur Visualisierung

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
- **PDF-Parsing**: PyMuPDF oder pdfplumber
- **Scraping**: BeautifulSoup
- **Deployment**: Lokal startbar, optional als Docker-Container für Serverbetrieb
- **Dependency management**: Mit uv

---
