'use client';

import { useCallback, useState } from 'react';
import { Sidebar } from './sidebar/Sidebar';
import { PreviewArea } from './preview/PreviewArea';
import { Topbar } from './layout/Topbar';
import { Toast } from './feedback/Toast';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useWaveProject } from '../hooks/useWaveProject';
import { exportPng, exportSvg } from '../services/download';

export const WaveStudio = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast, showToast } = useToast();
  const { project, dispatch, setDimension, setBackground, updateWaveColor, updateWaveNumber } = useWaveProject(showToast);
  const [pngExporting, setPngExporting] = useState(false);

  const handleSvgExport = useCallback(() => {
    exportSvg(project);
    showToast('SVG завантажено.');
  }, [project, showToast]);

  const handlePngExport = useCallback(async () => {
    setPngExporting(true);

    try {
      await exportPng(project);
      showToast('PNG завантажено.');
    } catch (error) {
      showToast(error instanceof Error && error.message === 'PNG_TOO_LARGE'
        ? 'PNG завеликий для браузера. Зменште розмір або завантажте SVG.'
        : 'Не вдалося створити PNG. Спробуйте SVG.');
    } finally {
      setPngExporting(false);
    }
  }, [project, showToast]);

  const handleRandomizeAll = useCallback(() => {
    dispatch({ type: 'randomize-all' });
    showToast('Усі хвилі перегенеровано.');
  }, [dispatch, showToast]);

  return (
    <div className="app-shell">
      <Topbar theme={theme} onThemeToggle={toggleTheme} />
      <main className="workspace">
        <Sidebar
          project={project}
          dispatch={dispatch}
          onSetDimension={setDimension}
          onSetBackground={setBackground}
          onUpdateWaveColor={updateWaveColor}
          onUpdateWaveNumber={updateWaveNumber}
        />
        <PreviewArea
          project={project}
          pngExporting={pngExporting}
          onExportPng={handlePngExport}
          onExportSvg={handleSvgExport}
          onRandomizeAll={handleRandomizeAll}
        />
      </main>
      <Toast toast={toast} />
    </div>
  );
};
