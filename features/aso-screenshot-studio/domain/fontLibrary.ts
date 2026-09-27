export type FontCategory = 'Sans' | 'Display' | 'Serif' | 'Handwriting';
export interface BundledFont { name: string; slug: string; category: FontCategory; cyrillic: boolean; weights?: readonly number[] }
export const BUNDLED_FONTS: BundledFont[] = [
  { name: 'Inter', slug: 'inter', category: 'Sans', cyrillic: true },
  { name: 'Manrope', slug: 'manrope', category: 'Sans', cyrillic: true },
  { name: 'Montserrat', slug: 'montserrat', category: 'Sans', cyrillic: true },
  { name: 'Roboto', slug: 'roboto', category: 'Sans', cyrillic: true },
  { name: 'Open Sans', slug: 'open-sans', category: 'Sans', cyrillic: true },
  { name: 'Noto Sans', slug: 'noto-sans', category: 'Sans', cyrillic: true },
  { name: 'Rubik', slug: 'rubik', category: 'Sans', cyrillic: true },
  { name: 'Nunito Sans', slug: 'nunito-sans', category: 'Sans', cyrillic: true },
  { name: 'Nunito', slug: 'nunito', category: 'Sans', cyrillic: true },
  { name: 'Raleway', slug: 'raleway', category: 'Sans', cyrillic: true },
  { name: 'IBM Plex Sans', slug: 'ibm-plex-sans', category: 'Sans', cyrillic: true },
  { name: 'Source Sans 3', slug: 'source-sans-3', category: 'Sans', cyrillic: true },
  { name: 'Ubuntu Sans', slug: 'ubuntu-sans', category: 'Sans', cyrillic: true },
  { name: 'Exo 2', slug: 'exo-2', category: 'Sans', cyrillic: true },
  { name: 'Mulish', slug: 'mulish', category: 'Sans', cyrillic: true },
  { name: 'Jost', slug: 'jost', category: 'Sans', cyrillic: true },
  { name: 'Noto Sans Display', slug: 'noto-sans-display', category: 'Sans', cyrillic: true },
  { name: 'Oswald', slug: 'oswald', category: 'Display', cyrillic: true },
  { name: 'Comfortaa', slug: 'comfortaa', category: 'Display', cyrillic: true },
  { name: 'Fredoka One', slug: 'fredoka-one', category: 'Display', cyrillic: false, weights: [400] },
  { name: 'Lora', slug: 'lora', category: 'Serif', cyrillic: true },
  { name: 'Playfair Display', slug: 'playfair-display', category: 'Serif', cyrillic: true },
  { name: 'Merriweather', slug: 'merriweather', category: 'Serif', cyrillic: true },
  { name: 'Cormorant Garamond', slug: 'cormorant-garamond', category: 'Serif', cyrillic: true },
  { name: 'Roboto Slab', slug: 'roboto-slab', category: 'Serif', cyrillic: true },
  { name: 'Noto Serif', slug: 'noto-serif', category: 'Serif', cyrillic: true },
  { name: 'Noto Serif Display', slug: 'noto-serif-display', category: 'Serif', cyrillic: true },
  { name: 'Bitter', slug: 'bitter', category: 'Serif', cyrillic: true },
  { name: 'Alegreya', slug: 'alegreya', category: 'Serif', cyrillic: true },
  { name: 'Kalam', slug: 'kalam', category: 'Handwriting', cyrillic: false, weights: [300, 400, 700] }
];
export const SYSTEM_FONTS = ['Arial', 'Georgia', 'Verdana', 'Courier New'] as const;
export const FONT_FAMILIES: string[] = [...BUNDLED_FONTS.map(font => font.name), ...SYSTEM_FONTS];
export const isCustomFontFamily = (name: string) => /^custom-font-[a-f0-9-]{36}$/.test(name);
export const fontFiles = (font: BundledFont): { subset: 'latin' | 'cyrillic'; weight: number | null; url: string }[] => (font.cyrillic ? ['latin', 'cyrillic'] as const : ['latin'] as const).flatMap((subset): { subset: 'latin' | 'cyrillic'; weight: number | null; url: string }[] =>
  font.weights ? font.weights.map(weight => ({ subset, weight, url: `/aso-screenshot-studio/fonts/${font.slug}-${subset}-${weight}.woff2` })) :
    [{ subset, weight: null, url: `/aso-screenshot-studio/fonts/${font.slug}-${subset}.woff2` }]);
