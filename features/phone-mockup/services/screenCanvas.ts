import type { PhoneFilters, PhoneModelConfig } from '../domain/types';

export const SCREEN_CANVAS_SIZE = {
  width: 1179,
  height: 2556
};

export const createPortraitSource = (image: CanvasImageSource & { width: number; height: number }) => {
  if (image.width <= image.height) return image;

  const canvas = document.createElement('canvas');
  canvas.width = image.height;
  canvas.height = image.width;

  const context = canvas.getContext('2d');
  if (!context) return image;

  context.translate(image.height / 2, image.width / 2);
  context.rotate(Math.PI / 2);
  context.drawImage(image, -image.width / 2, -image.height / 2);

  return canvas;
};

export const createScreenCanvas = (
  image: CanvasImageSource & { width: number; height: number },
  model: PhoneModelConfig,
  filters: PhoneFilters
) => {
  const canvas = document.createElement('canvas');
  canvas.width = SCREEN_CANVAS_SIZE.width;
  canvas.height = SCREEN_CANVAS_SIZE.height;

  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const inset = model.screenInset;
  const border = inset?.border ?? 0;

  if (border > 0) {
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();
    context.roundRect(border, border, canvas.width - border * 2, canvas.height - border * 2, inset?.radius ?? 0);
    context.clip();
  }

  const targetWidth = canvas.width - border * 2;
  const targetHeight = canvas.height - border * 2;
  const scale = Math.max(targetWidth / image.width, targetHeight / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  context.filter = `brightness(${filters.brightness / 100}) contrast(${filters.contrast / 100}) saturate(${filters.saturation / 100})`;
  context.drawImage(image, border + (targetWidth - drawWidth) / 2, border + (targetHeight - drawHeight) / 2, drawWidth, drawHeight);
  context.filter = 'none';

  if (border > 0) context.restore();

  return canvas;
};
