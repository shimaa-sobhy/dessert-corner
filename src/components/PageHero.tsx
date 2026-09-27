import CloudLayer from './CloudLayer';

interface Props {
  title: string;
  subtitle?: string;
}

export default function PageHero({ title, subtitle }: Props) {
  return (
    <div className="page-hero">
      <CloudLayer density="light" />
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}
