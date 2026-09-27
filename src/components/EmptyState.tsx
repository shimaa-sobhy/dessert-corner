import type { ReactNode } from 'react';
import Button from './Button';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

export default function EmptyState({ icon, title, description, actionLabel, actionTo }: Props) {
  return (
    <div className="empty-state">
      <div style={{ color: 'var(--accent-deep)', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo ? <Button to={actionTo}>{actionLabel}</Button> : null}
    </div>
  );
}
