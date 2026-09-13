# Verwendete Grafiken

Wortschmiede benutzt zwei quelloffene Icon-Sets. Beide sind mit
`tools/build-icons.mjs` einmalig geholt und in `js/icons.js` eingebettet
worden – die App lädt zur Laufzeit nichts von fremden Servern nach.

## game-icons.net

Thematische Motive für alle Themes: Amboss, Hammer, Barren, Wachssiegel,
Gürtel, Bücher, Schriftrolle, Federkiel, Zahnräder, Kamera, Lorbeer, Funken,
Sterne, Katana, Fußball und Pokal, Eiche und Runenstein, Rakete und Planet.

Lizenz: [Creative Commons BY 3.0](https://creativecommons.org/licenses/by/3.0/)
Quelle: <https://game-icons.net>

Autoren der verwendeten Icons:

- **Lorc** – anvil, energy-arrow, flat-hammer, gears, laurel-crown, leaf-swirl, metal-bar, oak, open-book, pine-tree, quill-ink, ringed-planet, rocket, rune-stone, scroll-unfurled, spark-spirit, wax-seal
- **Delapouite** – astronaut-helmet, black-belt, book-cover, bow-arrow, katana, photo-camera, soccer-ball, soccer-field, spaceship, sparkles, star-formation, star-medal, torch, trophy-cup, whistle

Änderungen gegenüber dem Original: Das schwarze Hintergrundquadrat wurde
entfernt und die Füllfarbe auf `currentColor` umgestellt, damit die Motive
die Farbe des jeweiligen Themes annehmen. Die Formen selbst sind unverändert.

## Lucide

Neutrale Bedienelemente (15 Symbole): Lautsprecher, Mischen,
Wiederholen, Haken, Kreuz, Pfeil, Flamme, Glühbirne, Lupe, Plus, Stift, Pfeile
für Import und Export, Papierkorb, Zurücksetzen.

Lizenz: [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE)
Quelle: <https://lucide.dev>

## App-Icon

Der Amboss im App-Icon ist das Motiv `anvil` von **Lorc** (game-icons.net,
CC BY 3.0), eingefärbt und auf einen Glut-Hintergrund gesetzt. Erzeugt mit
`tools/build-app-icon.mjs`.
