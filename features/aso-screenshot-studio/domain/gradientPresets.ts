import type { Background } from './schema';

/** Original soft palettes inspired by the color language of modern system wallpapers. */
export const GRADIENT_PRESETS: { id: string; name: string; category: 'Світлі' | 'Насичені' | 'Темні'; background: Extract<Background, { type: 'gradient' }> }[] = [
  { id: 'dawn', name: 'Ранкове сяйво', category: 'Світлі', background: { type: 'gradient', from: '#FFE8D9', mid: '#F5C8E7', to: '#BFD8FF', angle: 32 } },
  { id: 'cloud', name: 'Перламутрові хмари', category: 'Світлі', background: { type: 'gradient', from: '#F7F4FF', mid: '#D8E5FF', to: '#C7F1ED', angle: 125 } },
  { id: 'peach', name: 'Персиковий туман', category: 'Світлі', background: { type: 'gradient', from: '#FFF2DF', mid: '#FFD6C8', to: '#E7C8F4', angle: 45 } },
  { id: 'glacier', name: 'Льодовик', category: 'Світлі', background: { type: 'gradient', from: '#EAF9FF', mid: '#C1E5F6', to: '#C3C9F6', angle: 145 } },
  { id: 'mint', name: 'М’ятне світло', category: 'Світлі', background: { type: 'gradient', from: '#E8FFF5', mid: '#BEEBE6', to: '#B4D8F6', angle: 52 } },
  { id: 'sand', name: 'Теплий пісок', category: 'Світлі', background: { type: 'gradient', from: '#FFF8EA', mid: '#F3D7C8', to: '#D4C8F5', angle: 110 } },
  { id: 'aurora', name: 'Північне сяйво', category: 'Насичені', background: { type: 'gradient', from: '#374DD1', mid: '#8D5EE7', to: '#EB81BA', angle: 38 } },
  { id: 'lagoon', name: 'Блакитна лагуна', category: 'Насичені', background: { type: 'gradient', from: '#146CC7', mid: '#42B8CB', to: '#8DDDC9', angle: 125 } },
  { id: 'coral', name: 'Кораловий захід', category: 'Насичені', background: { type: 'gradient', from: '#FD8D69', mid: '#F8619B', to: '#9C69E8', angle: 42 } },
  { id: 'orchid', name: 'Орхідея', category: 'Насичені', background: { type: 'gradient', from: '#6658D8', mid: '#B16CCB', to: '#F6A1BC', angle: 145 } },
  { id: 'citrus', name: 'Цитрус', category: 'Насичені', background: { type: 'gradient', from: '#F7BB5B', mid: '#ED8D8D', to: '#B879CE', angle: 35 } },
  { id: 'sea-glass', name: 'Морське скло', category: 'Насичені', background: { type: 'gradient', from: '#18AFAE', mid: '#56BBD0', to: '#878CE0', angle: 115 } },
  { id: 'midnight', name: 'Опівнічне небо', category: 'Темні', background: { type: 'gradient', from: '#101A3F', mid: '#293C79', to: '#7356A8', angle: 52 } },
  { id: 'violet-night', name: 'Фіолетова ніч', category: 'Темні', background: { type: 'gradient', from: '#1B123A', mid: '#452765', to: '#925284', angle: 128 } },
  { id: 'deep-ocean', name: 'Глибокий океан', category: 'Темні', background: { type: 'gradient', from: '#092C45', mid: '#145D78', to: '#247D85', angle: 48 } },
  { id: 'graphite', name: 'Графітове сяйво', category: 'Темні', background: { type: 'gradient', from: '#202536', mid: '#495276', to: '#8994B0', angle: 128 } },
  { id: 'wine', name: 'Вечірній рубін', category: 'Темні', background: { type: 'gradient', from: '#2A163F', mid: '#71345F', to: '#BE6B75', angle: 50 } },
  { id: 'forest', name: 'Тихий ліс', category: 'Темні', background: { type: 'gradient', from: '#102D39', mid: '#245A62', to: '#4D8E78', angle: 120 } }
];
