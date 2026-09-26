import type { PhoneDeviceId, PhoneModelConfig } from './types';

export const PHONE_MODELS: PhoneModelConfig[] = [
  {
    id: 'iphone-15-pro-max',
    label: 'iPhone 15 Pro Max',
    assetPath: '/phone-mockup-studio/source/apple_iphone_15_pro_max_black(2).glb',
    screenMaterialName: 'pIJKfZsazmcpEiU',
    baseRotation: [0, Math.PI, 0],
    uv: { rotation: Math.PI, mirrorX: true }
  },
  {
    id: 'iphone-17-pro-max',
    label: 'iPhone 17 Pro Max',
    assetPath: '/phone-mockup-studio/source/iphone_17_pro_max.glb',
    screenMaterialName: 'screen.001',
    baseRotation: [0, Math.PI / 2, 0],
    uv: {
      repeat: [-1.028278, -1],
      offset: [0.020257, 1.0019],
      clamp: true
    },
    screenInset: { border: 26, radius: 162 },
    materialTweaks: {
      'black.002': { color: 0x000000, emissive: 0x000000, emissiveIntensity: 1, metalness: 0, roughness: 1, envMapIntensity: 0, toneMapped: false },
      'basecolor.001': { color: 0xac3d04, metalness: 0.55, roughness: 0.8, envMapIntensity: 0.42 },
      logo_face: { color: 0x9d3804, metalness: 0.4, roughness: 0.88, envMapIntensity: 0.28 },
      'metalframe.002': { color: 0xa83a02, metalness: 0.5, roughness: 0.82, envMapIntensity: 0.35 },
      'backpanel.001': { color: 0xbd4304, metalness: 0.5, roughness: 0.82, envMapIntensity: 0.35 },
      'Material.005': { color: 0xbd4304, metalness: 0.5, roughness: 0.82, envMapIntensity: 0.35 }
    }
  },
  {
    id: 'iphone-17-pro',
    label: 'iPhone 17 Pro',
    assetPath: '/phone-mockup-studio/source/iphone_17_pro.glb',
    screenMaterialName: 'OLED',
    baseRotation: [0, Math.PI, 0],
    uv: { mirrorX: true },
    materialTweaks: {
      Glass: { roughness: 1, metalness: 0, envMapIntensity: 0, opacity: 0.03, transparent: true },
      Display_Frame: { color: 0x000000, emissive: 0x0d0d0f, emissiveIntensity: 1, metalness: 0, roughness: 1, envMapIntensity: 0, toneMapped: false },
      OLED_off: { color: 0x000000, emissive: 0x0d0d0f, emissiveIntensity: 1, metalness: 0, roughness: 1, envMapIntensity: 0, toneMapped: false }
    }
  },
  {
    id: 'galaxy-s25-ultra',
    label: 'Samsung Galaxy S25 Ultra',
    assetPath: '/phone-mockup-studio/source/samsung_galaxy_s25_ultra.glb',
    screenMaterialName: 'Screen',
    baseRotation: [0, 0, 0],
    materialTweaks: {
      'Screen glass': { roughness: 1, metalness: 0, envMapIntensity: 0, opacity: 0.03, transparent: true },
      Body: { color: 0x8a8a8d, metalness: 1, roughness: 1, envMapIntensity: 0.85 },
      'Body .001': { color: 0x848487, metalness: 1, roughness: 1, envMapIntensity: 0.85 },
      'Body .002': { color: 0x7d7d81, metalness: 1, roughness: 1, envMapIntensity: 0.8 },
      Button: { color: 0x888a8c, metalness: 0.9, roughness: 0.4, envMapIntensity: 0.8 },
      'Back glass': { color: 0x2b2927, metalness: 0, roughness: 0.9, envMapIntensity: 0.15 },
      'Back glass flash': { color: 0x000000, emissive: 0xf0dea0, emissiveIntensity: 1, metalness: 0, roughness: 1, envMapIntensity: 0, toneMapped: false },
      'Camera body': { color: 0x232326, metalness: 1, roughness: 0.28, envMapIntensity: 0.85 },
      Camera: { color: 0x000000, emissive: 0x000000, emissiveIntensity: 1, metalness: 0, roughness: 1, envMapIntensity: 0, toneMapped: false },
      'Camera glass': { color: 0x000000, metalness: 0, roughness: 1, envMapIntensity: 0, transparent: true, opacity: 0.04 },
      Dark: { color: 0x000000, emissive: 0x141416, emissiveIntensity: 1, metalness: 0, roughness: 1, envMapIntensity: 0, toneMapped: false },
      'Camera lens': { color: 0x000000, emissiveFromMap: true, emissiveIntensity: 1, metalness: 0, roughness: 1, envMapIntensity: 0 }
    }
  }
];

export const getPhoneModel = (id: PhoneDeviceId) => PHONE_MODELS.find((model) => model.id === id) ?? PHONE_MODELS[0];
