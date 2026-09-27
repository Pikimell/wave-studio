import type { Metadata } from 'next';
import { ProjectHome } from '@/features/aso-screenshot-studio/components/home/ProjectHome';
export const metadata: Metadata = { title: 'Проєкти — ASO Screenshot Studio' };
export default function ProjectsPage({ searchParams }: { searchParams: { create?: string } }) {
  const { create } = searchParams;
  return <ProjectHome createInitially={create === '1'} />;
}
