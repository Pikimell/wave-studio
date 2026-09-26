import { useMemo, useRef } from 'react';
import { createSvgMarkup } from '../../domain/svg';
import type { WaveProject } from '../../domain/types';
import { useArtworkFit } from '../../hooks/useArtworkFit';

type ArtworkPreviewProps = {
  project: WaveProject;
};

export const ArtworkPreview = ({ project }: ArtworkPreviewProps) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const artworkSize = useArtworkFit(stageRef, { width: project.width, height: project.height });
  const svgMarkup = useMemo(() => createSvgMarkup(project), [project]);

  return (
    <div className="preview-stage">
      <div className="stage-inner" ref={stageRef}>
        <div
          className="artwork"
          role="img"
          aria-label="Згенерований хвилястий фон"
          style={{ width: artworkSize.width, height: artworkSize.height }}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      </div>
      <span className="stage-corner top-left" />
      <span className="stage-corner top-right" />
      <span className="stage-corner bottom-left" />
      <span className="stage-corner bottom-right" />
    </div>
  );
};
