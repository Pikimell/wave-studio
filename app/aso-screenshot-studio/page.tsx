import type { Metadata } from 'next';
import { AsoScreenshotStudio } from '@/features/aso-screenshot-studio/components/AsoScreenshotStudio';
export const metadata: Metadata = {
  title: 'ASO Screenshot Studio — редактор скріншотів',
  description: 'Створюйте спільні композиції скріншотів App Store і Google Play: групи, слайди та елементи.'
};
export default function AsoScreenshotStudioPage() { return <AsoScreenshotStudio />; }
