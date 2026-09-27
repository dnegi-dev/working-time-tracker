# Mit NFC-Tags und QR-Codes automatisieren

1. **Einstellungen → Automatisierung → Link- & QR-Generator:** Befehl, Projekt/Ort und Auslöser wählen, Link kopieren.
2. **NFC:** Kurzbefehle → **Automation** → **+** → **NFC** → Tag scannen → Aktion **URLs öffnen** → Link einfügen (z. B. `wtt://toggle?source=nfc`) → sofort ausführen (Bezeichnung je nach iOS-Version, nicht geprüft).
3. **QR:** QR-Code aus dem Generator ausdrucken; die Kamera öffnet den Link.

Hinweise: `toggle` ignoriert einen zweiten Scan innerhalb von 60 s. Projekte und Orte werden per Name (ohne Groß/Klein) oder ID angegeben. `wtt://`-Links brauchen die iOS-App.
