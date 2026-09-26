import { parsePhoneProjectJson } from '../domain/project';
import type { PhoneMockupProject } from '../domain/types';

export const readImageFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('IMAGE_LOAD_FAILED'));
    };

    image.src = url;
  });

export const readPhoneProjectFile = (file: File) =>
  new Promise<PhoneMockupProject>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        resolve(parsePhoneProjectJson(String(reader.result ?? '{}')));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('JSON_READ_FAILED'));
    reader.readAsText(file);
  });

export const downloadPhoneProjectJson = (project: PhoneMockupProject) => {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'phone-mockup-settings.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
