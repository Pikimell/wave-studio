'use client';

import { useRef } from 'react';
import { downloadPhoneProjectJson, readImageFile, readPhoneProjectFile } from '../services/projectFiles';
import { createPortraitSource } from '../services/screenCanvas';
import { usePhoneMockupProject } from '../hooks/usePhoneMockupProject';
import { usePhoneScene } from '../hooks/usePhoneScene';
import { PhoneControls } from './PhoneControls';
import { PhoneViewport } from './PhoneViewport';

export const PhoneMockupStudio = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { project, updateProject, replaceProject } = usePhoneMockupProject();
  const { loading, error, setScreenshot, exportPng } = usePhoneScene(viewportRef, project);

  const handleScreenshotImport = async (file: File) => {
    const image = await readImageFile(file);
    const portraitImage = createPortraitSource(image);
    setScreenshot(portraitImage);
    updateProject({ orientation: image.width > image.height ? 'landscape' : 'portrait' });
  };

  const handleJsonImport = async (file: File) => {
    const nextProject = await readPhoneProjectFile(file);
    replaceProject(nextProject);
  };

  return (
    <div className="phone-studio">
      <PhoneViewport containerRef={viewportRef} loading={loading} error={error} />
      <PhoneControls
        project={project}
        onProjectChange={updateProject}
        onScreenshotImport={handleScreenshotImport}
        onJsonImport={handleJsonImport}
        onJsonExport={() => downloadPhoneProjectJson(project)}
        onPngExport={exportPng}
      />
    </div>
  );
};
