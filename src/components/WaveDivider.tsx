type Variant = 'scallop' | 'wave' | 'double-wave' | 'cloud' | 'blob' | 'curve';

interface Props {
  color?: string;
  variant?: Variant;
  flip?: boolean;
  height?: number;
}

const PATHS: Record<Variant, string> = {
  scallop:
    'M0,0 C60,80 120,80 180,0 C240,80 300,80 360,0 C420,80 480,80 540,0 C600,80 660,80 720,0 C780,80 840,80 900,0 C960,80 1020,80 1080,0 C1140,80 1200,80 1260,0 C1320,80 1380,80 1440,0 L1440,80 L0,80 Z',
  wave: 'M0,40 C120,65 240,65 360,40 C480,15 600,15 720,40 C840,65 960,65 1080,40 C1200,15 1320,15 1440,40 L1440,80 L0,80 Z',
  'double-wave':
    'M0,30 C100,55 200,55 300,30 C400,5 500,5 600,30 C700,55 800,55 900,30 C1000,5 1100,5 1200,30 C1300,55 1400,55 1440,30 L1440,80 L0,80 Z',
  cloud: 'M0,35 Q90,65 180,35 Q270,65 360,35 Q450,65 540,35 Q630,65 720,35 Q810,65 900,35 Q990,65 1080,35 Q1170,65 1260,35 Q1350,65 1440,35 L1440,80 L0,80 Z',
  blob: 'M0,60 C80,50 160,70 240,45 C380,20 460,55 580,35 C700,15 820,60 940,40 C1060,25 1200,55 1320,30 C1400,15 1440,25 1440,40 L1440,80 L0,80 Z',
  curve: 'M0,50 C360,80 1080,80 1440,50 L1440,80 L0,80 Z',
};

export default function WaveDivider({ color = '#FFFFFF', variant = 'scallop', flip = false, height = 80 }: Props) {
  return (
    <div
      className="wave-divider"
      style={{
        position: 'relative',
        width: '100%',
        height: Math.max(height, 20),
        lineHeight: 0,
        overflow: 'hidden',
        transform: flip ? 'scaleY(-1)' : undefined,
      }}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <path d={PATHS[variant]} fill={color} />
      </svg>
    </div>
  );
}
