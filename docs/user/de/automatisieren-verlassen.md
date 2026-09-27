# Beim Verlassen der Arbeit ausstempeln

1. Kurzbefehle → **Automation** → **+** → **Verlassen** → Arbeitsadresse wählen.
2. Aktion **URLs öffnen** → `wtt://clock-out?source=geofence`.
3. Optional **Ankommen** → `wtt://clock-in?place=HQ&source=geofence`.

`clock-in`/`clock-out` tun nichts, wenn der Zustand schon stimmt. iOS fragt je nach Version bei Orts-Automationen nach (nicht geprüft).
