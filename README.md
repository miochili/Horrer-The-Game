# 🎮 Horror-The-Game: Part 1 – Das Verlassene Labor

Ein atmosphä¬¬risches 3D-Horror-Spiel im Browser mit Google Sign-In, Save-System, Puzzles, Gegnern und Jump Scares.

![Horror Game Screenshot](https://via.placeholder.com/800x450/0a0a0a/8b0000?text=Horror-The-Game+Part+1)

## 🎯 Features

- **3D-Grafik** mit Three.js im Browser
- **Google Authentication** zum Speichern des Spielstands in der Cloud
- **Save/Load System** mit automatischem Speichern
- **Story-basiertes Gameplay** mit Dialogen und Events
- **Puzzles**: Keypad-Codes, Farbsequenzen, Items sammeln
- **Gegner**: KI-gesteuerte Kreaturen, die dich jagen
- **Jump Scares**: Procedural generierte Horror-Bilder
- **Atmosphä¬¬rischer Sound**: Procedurale Soundeffekte und Ambient-Drone
- **Checkpoint-System**: Stirb und respawn am letzten Checkpoint

## 🚀 Schnellstart

### Option 1: Direkt im Browser spielen (ohne Firebase)

1. **Repository klonen oder herunterladen**
   ```bash
   git clone https://github.com/miochili/Horrer-The-Game.git
   cd Horrer-The-Game
   ```

2. **index.html öffnen**
   - Einfach die `index.html` Datei in Chrome, Firefox oder Edge öffnen
   - **ODER** mit einem lokalen Server (empfohlen):
     ```bash
     # Mit Python
     python -m http.server 8000
     
     # Mit Node.js (http-server)
     npx http-server -p 8000
     ```
   - Dann im Browser: `http://localhost:8000`

3. **Spielen!**
   - Das Spiel funktioniert auch ohne Firebase mit lokalem Speichern

### Option 2: Mit Firebase (Google Sign-In + Cloud Save)

#### Schritt 1: Firebase Projekt erstellen

1. Gehe zu [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Klicke auf "Add project"
3. Gib einen Namen ein (z.B. "horror-game")
4. Google Analytics kann deaktiviert werden
5. Klicke "Create project"

#### Schritt 2: Authentication aktivieren

1. Im Firebase Dashboard links auf "Authentication" klicken
2. "Get started" klicken
3. Im Tab "Sign-in method" auf "Google" klicken
4. "Enable" aktivieren
5. Support email auswählen
6. "Save" klicken

#### Schritt 3: Firestore Database aktivieren

1. Links auf "Firestore Database" klicken
2. "Create database" klicken
3. "Start in test mode" auswählen (spä¬¬ter kannst du Regeln anpassen)
4. Eine Region auswählen (z.B. `europe-west`)
5. "Enable" klicken

#### Schritt 4: Firebase Config kopieren

1. Im Firebase Dashboard auf das Zahnrad-Icon ⚙️ klicken → "Project settings"
2. Nach unten scrollen zu "Your apps"
3. Auf das Web-Icon `</>` klicken
4. App registrieren (Name: "Horror Game")
5. Die `firebaseConfig` kopieren

#### Schritt 5: Config im Spiel eintragen

1. Öffne `js/config.js` in einem Texteditor
2. Ersetze die Platzhalter-Werte mit deinen Firebase-Daten:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...", // Dein API Key
    authDomain: "horror-game.firebaseapp.com",
    projectId: "horror-game",
    storageBucket: "horror-game.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

3. Speichern

#### Schritt 6: Spiel starten

```bash
# Lokalen Server starten
python -m http.server 8000
```

Dann im Browser: `http://localhost:8000`

## 🎮 Spielsteuerung

| Taste | Aktion |
|-------|--------|
| **W, A, S, D** | Bewegen |
| **Maus** | Umsehen |
| **Shift** | Sprinten (verbraucht Stamina) |
| **E** | Interagieren (Items, Puzzles, Türen) |
| **Esc** | Pause-Menü |
| **Klick** | Pointer Lock aktivieren |

## 📖 Story (Part 1)

Du wachst in einem verlassenen Untergrundlabor auf. Deine Erinnerung ist weg. Überwachungskameras zeigen, dass etwas Schreckliches passiert ist.

**Deine Ziele:**
1. Finde die Keycard, um die erste Tür zu öffnen
2. Löse das Keypad-Puzzle (Code: **7391**)
3. Sammle Battery und Fuse für das Labor
4. Löse das Farb-Puzzle: **Rot → Blau → Grün**
5. Finde die Log-Einträge, um herauszufinden, was passiert ist
6. Entkomme durch die Exit-Tür

**Aber vorsichtig:** Eine Kreatur jagt dich durch die Gänge...

## 🧩 Puzzle-Lösungen (Spoiler!)

<details>
<summary><strong>⚠️ Hier klicken für Puzzle-Lösungen</strong></summary>

### Keypad-Puzzle (Haupttür)
- **Code:** `7391`

### Farb-Puzzle (Labortür)
- **Reihenfolge:** Rot → Blau → Grün

### Exit-Tür
- Benötigte Items: Keycard, Battery, Fuse
- Alle drei Items müssen im Inventory sein

</details>

## 🏗️ Projektstruktur

```
Horrer-The-Game/
├── index.html              # Hauptseite
├── css/
│   └── style.css          # Styling für UI, Menüs, HUD
├── js/
│   ├── config.js          # Firebase-Konfiguration
│   ├── firebase-auth.js   # Google Authentication
│   ├── save-system.js     # Save/Load System
│   ├── audio.js           # Sound Manager
│   ├── entities.js        # Player, Enemy, Item Klassen
│   ├── puzzles.js         # Puzzle System
│   ├── story.js           # Story Manager
│   ├── jump-scares.js     # Jump Scare Manager
│   └── game.js            # Hauptspiel-Logik
└── README.md              # Diese Datei
```

## 🎨 Eigene Anpassungen

### Schwierigkeit ändern

In `js/config.js` kannst du Werte anpassen:

```javascript
const GAME_CONFIG = {
    playerSpeed: 5,           // Schneller = einfacher
    enemySpeed: 3.5,          // Langsamer = einfacher
    enemyDamage: 25,          // Weniger = einfacher
    playerMaxHealth: 100,     // Mehr = einfacher
    jumpScareMinInterval: 30000,  // Länger = weniger Jump Scares
};
```

### Eigene Jump Scares hinzufügen

In `js/jump-scares.js` kannst du neue `draw...()` Funktionen hinzufügen und im `jumpScares` Array registrieren.

### Neue Level erstellen

In `js/game.js` die `loadLevel1()` Funktion kopieren und als `loadLevel2()` anpassen.

## 🐛 Bekannte "Bugs"

- **Firebase nicht konfiguriert:** Das Spiel warnt beim Start, funktioniert aber mit LocalStorage weiter
- **Sound braucht User-Interaction:** Browser blockieren Auto-Play. Klicke einmal ins Spiel, dann funktioniert Sound.
- **Pointer Lock:** Escape drücken, um den Maus-Cursor zu befreien

## 📱 Browser-Kompatibilität

- ✅ Chrome/Edge (empfohlen)
- ✅ Firefox
- ✅ Safari (eingeschränkt, Web Audio kann Probleme machen)
- ❌ Mobile (nicht optimiert, Steuerung zu fummelig)

## 🔮 Part 2 Ideas

- Neue Map: Oberfläche / Stadt
- Mehr Gegner-Typen
- Waffen-System
- Multiplayer-Coop
- VR-Support

## 📄 Lizenz

Dieses Projekt ist Open Source. Du darfst den Code für deine eigenen Spiele verwenden!

## 👨‍💻 Credits

- **Game Design & Development:** Nicola Peter
- **Story:** AI Assistant
- **Engine:** Three.js
- **Backend:** Firebase

---

**Viel Spass beim Gruseln!** 👻🎮

Bei Fragen: Eröffne ein Issue auf GitHub oder schreibe mir.
