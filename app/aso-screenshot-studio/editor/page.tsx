import type { Metadata } from 'next';
import { AsoScreenshotStudio } from '@/features/aso-screenshot-studio/components/AsoScreenshotStudio';
export const metadata: Metadata = { title: 'Редактор — ASO Screenshot Studio' };
export default function EditorPage({ searchParams }: { searchParams: { project?: string } }) {
  const { project } = searchParams;
  return <AsoScreenshotStudio projectId={project ?? ''} />;
}
