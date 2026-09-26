import type { LucideIcon } from 'lucide-react';

type IconButtonContentProps = {
  icon: LucideIcon;
  label: string;
};

export const IconButtonContent = ({ icon: Icon, label }: IconButtonContentProps) => (
  <>
    <Icon aria-hidden="true" />
    <span>{label}</span>
  </>
);
