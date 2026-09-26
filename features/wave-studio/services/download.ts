import { MAX_PNG_PIXELS } from '../domain/constants';
import { createSvgMarkup } from '../domain/svg';
import type { WaveProject } from '../domain/types';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

export const createFilename = (project: WaveProject, extension: string) =>
  `wave-studio-${project.width}x${project.height}.${extension}`;

export const exportSvg = (project: WaveProject) => {
  downloadBlob(new Blob([createSvgMarkup(project)], { type: 'image/svg+xml;charset=utf-8' }), createFilename(project, 'svg'));
};

export const exportPng = async (project: WaveProject) => {
  if (project.width * project.height > MAX_PNG_PIXELS) {
    throw new Error('PNG_TOO_LARGE');
  }

  const svgUrl = URL.createObjectURL(new Blob([createSvgMarkup(project)], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = project.width;
    canvas.height = project.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('CANVAS_UNAVAILABLE');

    context.drawImage(image, 0, 0, project.width, project.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG_EXPORT_FAILED');

    downloadBlob(blob, createFilename(project, 'png'));
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};
