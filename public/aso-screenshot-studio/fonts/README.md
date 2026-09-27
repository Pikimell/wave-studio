# Bundled fonts

30 font families are self-hosted from Fontsource packages version 5.3.0. Each includes its SIL Open Font License text beside the WOFF2 files. The 28 variable families include Latin and Cyrillic subsets; Kalam and Fredoka One are static, Latin-only faces.

| Family | Source package | Category | Bundled scripts |
| --- | --- | --- | --- |
| Inter | `@fontsource-variable/inter` | Sans | Latin + Cyrillic |
| Manrope | `@fontsource-variable/manrope` | Sans | Latin + Cyrillic |
| Montserrat | `@fontsource-variable/montserrat` | Sans | Latin + Cyrillic |
| Roboto | `@fontsource-variable/roboto` | Sans | Latin + Cyrillic |
| Open Sans | `@fontsource-variable/open-sans` | Sans | Latin + Cyrillic |
| Noto Sans | `@fontsource-variable/noto-sans` | Sans | Latin + Cyrillic |
| Rubik | `@fontsource-variable/rubik` | Sans | Latin + Cyrillic |
| Nunito Sans | `@fontsource-variable/nunito-sans` | Sans | Latin + Cyrillic |
| Nunito | `@fontsource-variable/nunito` | Sans | Latin + Cyrillic |
| Raleway | `@fontsource-variable/raleway` | Sans | Latin + Cyrillic |
| IBM Plex Sans | `@fontsource-variable/ibm-plex-sans` | Sans | Latin + Cyrillic |
| Source Sans 3 | `@fontsource-variable/source-sans-3` | Sans | Latin + Cyrillic |
| Ubuntu Sans | `@fontsource-variable/ubuntu-sans` | Sans | Latin + Cyrillic |
| Exo 2 | `@fontsource-variable/exo-2` | Sans | Latin + Cyrillic |
| Mulish | `@fontsource-variable/mulish` | Sans | Latin + Cyrillic |
| Jost | `@fontsource-variable/jost` | Sans | Latin + Cyrillic |
| Noto Sans Display | `@fontsource-variable/noto-sans-display` | Sans | Latin + Cyrillic |
| Oswald | `@fontsource-variable/oswald` | Display | Latin + Cyrillic |
| Comfortaa | `@fontsource-variable/comfortaa` | Display | Latin + Cyrillic |
| Fredoka One | `@fontsource/fredoka-one` | Display | Latin only |
| Lora | `@fontsource-variable/lora` | Serif | Latin + Cyrillic |
| Playfair Display | `@fontsource-variable/playfair-display` | Serif | Latin + Cyrillic |
| Merriweather | `@fontsource-variable/merriweather` | Serif | Latin + Cyrillic |
| Cormorant Garamond | `@fontsource-variable/cormorant-garamond` | Serif | Latin + Cyrillic |
| Roboto Slab | `@fontsource-variable/roboto-slab` | Serif | Latin + Cyrillic |
| Noto Serif | `@fontsource-variable/noto-serif` | Serif | Latin + Cyrillic |
| Noto Serif Display | `@fontsource-variable/noto-serif-display` | Serif | Latin + Cyrillic |
| Bitter | `@fontsource-variable/bitter` | Serif | Latin + Cyrillic |
| Alegreya | `@fontsource-variable/alegreya` | Serif | Latin + Cyrillic |
| Kalam | `@fontsource/kalam` | Handwriting | Latin only |

Only the families used by a project are embedded into exported SVG/PNG. User-uploaded WOFF2, WOFF, TTF and OTF fonts live in the browser’s IndexedDB and are also embedded during export; project JSON stores a reference, not the font bytes.
