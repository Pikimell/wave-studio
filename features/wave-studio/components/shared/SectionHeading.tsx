import type { ReactNode } from 'react';

type SectionHeadingProps = {
  number: string;
  title: string;
  description: string;
  action?: ReactNode;
  titleId?: string;
};

export const SectionHeading = ({ number, title, description, action, titleId }: SectionHeadingProps) => (
  <div className={`section-heading ${action ? 'section-heading-action' : ''}`}>
    <div className="section-title">
      <span className="section-icon">{number}</span>
      <div>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
    {action}
  </div>
);
