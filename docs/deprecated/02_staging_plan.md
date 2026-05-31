## Gedankensammlung – Ansatz V2 (neuer Plan)

### Grundprinzip

* Vorgehen **inkrementell statt perfekt**.
* Fokus zunächst auf **schnell starten und lernen**, nicht auf vollständige Architektur.
* Eigene Stärken nutzen → **Backend-lastiger Ansatz**.
* Erst später über **Multi-Platform oder saubere Produktstruktur** nachdenken.

---

## Technische Grundentscheidung

**Start als lokale Web-App**

* Frontend: irgendein gängiges Web-Framework

  * mögliche Optionen:

    * Svelte
    * React
    * oder ähnliches
* Wichtig ist nicht das Framework selbst, sondern:

  * schnell etwas bauen
  * eventuell später **auf Mobile portierbar**

**Hosting**

* Am Anfang **kein Hosting**
* Alles läuft **lokal**
* Deployment-Fragen werden **erst später relevant**

---

## Datenquelle / Datensammlung

Schon vor der eigentlichen App wird ein **Datensatz aufgebaut**.

Idee:

* regelmäßig **Sprachnotizen aufnehmen**
* z. B.:

  * Memo-App
  * Sprachnachrichten an sich selbst
  * andere Audioaufnahmen

Ziel:

* ein **echtes persönliches Dataset** aus Alltagseinträgen haben
* dieses später mit der Pipeline testen


# Entwicklungsphasen

## Phase 1 – Input + Processing Pipeline

Ziel: **Daten überhaupt erst erzeugen**

### Minimal-Web-App

Sehr simples Interface:

* Button: **Record**
* Aufnahme wird gespeichert
* Upload der Audio-Datei

Optional:

* **Batch Upload**

  * vorhandene Audioaufnahmen hochladen

---

### Hauptfokus: Pipeline

Der wichtigste Teil ist nicht die UI, sondern:

**Transkriptions- und Verarbeitungspipeline**

Mögliche Schritte:

1. Audio speichern
2. Transkription
3. Information Extraction
4. Mapping auf internes Datenmodell

---

### Nutzer-Review

Die KI trifft Vorschläge, der Nutzer bestätigt oder korrigiert.

Beispiele:

* KI erkennt:

  * „Treffen mit Max“
  * Zuordnung zu **Kontakt: Max**
* Nutzer kann:

  * bestätigen
  * korrigieren
  * ergänzen

Ziel:

* **halbautomatische Strukturierung**

---

### Persistenz (vorerst unwichtig)

In Phase 1:

* **keine echte Datenbank nötig**
* vieles kann **gemockt sein**

Wichtiger:

* Audio-Dateien vorhanden
* Upload funktioniert
* Pipeline kann darauf arbeiten

---

## Phase 2 – Daten persistieren und anzeigen

Erst danach:

### Datenbank einführen

* Datenmodell wirklich speichern
* Struktur stabilisieren

---

### Daten sichtbar machen

Eine einfache Weboberfläche zum Beispiel:

* Tagebuchartige Ansicht
* Listenansicht
* Timeline

Ziel:

* prüfen, **ob die extrahierten Informationen sinnvoll nutzbar sind**

---

## Phase 3 – Chat-Interface

Erweiterung zu einem **Assistant-Modell**.

### Chat als zusätzlicher Input

Ein klassisches Interface ähnlich moderner KI-Systeme.

Nutzen:

* Informationen direkt eingeben
* Fragen stellen

---

### Natural Language Retrieval

Über Chat können Informationen abgefragt werden.

Beispiele:

* „Wann habe ich Max zuletzt gesehen?“
* „Was habe ich letzte Woche über Projekt X gesagt?“

Das System kann:

* gespeicherte Informationen durchsuchen
* relevante Daten zurückgeben

---

### Schwierigkeit

Das System muss unterscheiden zwischen:

* **Speichern**
* **Abrufen**

Also:

* ist eine Nachricht **ein neuer Eintrag**
  oder
* **eine Frage an das System**

Diese Logik wird erst **später relevant**.

---

## Aktueller Fokus

Der aktuelle Fokus liegt klar auf:

1. **Datensammlung**
2. **Audio → Text Pipeline**
3. **Informationsextraktion**
4. **Mapping auf ein Datenmodell**

Alles andere (Hosting, perfekte UI, komplexe Datenbanken) ist zunächst **zweitrangig**.
