export type PhoneLanguage = 'en' | 'uk' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'ja' | 'zh';

export type PhoneDeviceId = 'iphone-15-pro-max' | 'iphone-17-pro-max' | 'iphone-17-pro' | 'galaxy-s25-ultra';

export type PhoneOrientation = 'portrait' | 'landscape';

export type PhonePresetId =
  | 'hero'
  | 'straight'
  | 'floating'
  | 'tilt'
  | 'back'
  | 'low-angle'
  | 'top-down'
  | 'back-angle'
  | 'profile'
  | 'dramatic'
  | 'isometric'
  | 'overhead'
  | 'custom';

export type PhoneRotation = {
  x: number;
  y: number;
  z: number;
};

export type PhoneFilters = {
  brightness: number;
  contrast: number;
  saturation: number;
};

export type PhoneSceneSettings = {
  exposure: number;
  rotation: PhoneRotation;
};

export type PhoneMockupProject = {
  language: PhoneLanguage;
  deviceId: PhoneDeviceId;
  orientation: PhoneOrientation;
  presetId: PhonePresetId;
  mirrored: boolean;
  filters: PhoneFilters;
  scene: PhoneSceneSettings;
};

export type PhoneModelConfig = {
  id: PhoneDeviceId;
  label: string;
  assetPath: string;
  screenMaterialName: string;
  baseRotation: [number, number, number];
  uv?: {
    rotation?: number;
    mirrorX?: boolean;
    flipY?: boolean;
    repeat?: [number, number];
    offset?: [number, number];
    clamp?: boolean;
  };
  screenInset?: {
    border: number;
    radius: number;
  };
  brightenBodyMaterials?: boolean;
  flattenGlossyPlainMaterials?: boolean;
  materialTweaks?: Record<string, PhoneMaterialTweak>;
};

export type PhoneMaterialTweak = {
  color?: number;
  emissive?: number;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  envMapIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  toneMapped?: boolean;
  emissiveFromMap?: boolean;
};

export type PhonePreset = {
  id: Exclude<PhonePresetId, 'custom'>;
  label: string;
  azimuth: number;
  elevation: number;
  distance: number;
  rotationY: number;
  rotationZ: number;
};

export type PhoneMockupJson = Partial<{
  language: PhoneLanguage;
  deviceId: PhoneDeviceId;
  orientation: PhoneOrientation;
  presetId: PhonePresetId;
  mirrored: boolean;
  filters: Partial<PhoneFilters>;
  scene: Partial<PhoneSceneSettings> & {
    rotation?: Partial<PhoneRotation>;
  };
}>;
