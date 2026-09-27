import { useRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMagnetic } from '../hooks/useMagnetic';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined; href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; href?: undefined };

type Props = ButtonAsButton | ButtonAsLink;

function classesFor(variant: Variant, size: Size, block: boolean, extra: string) {
  const variantClass =
    variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : variant === 'danger' ? 'btn-danger' : 'btn-ghost';
  return ['btn', variantClass, size === 'sm' ? 'btn-sm' : '', block ? 'btn-block' : '', extra].filter(Boolean).join(' ');
}

/**
 * Shared button used across the whole site. Applies a subtle magnetic
 * hover pull on fine-pointer devices. Renders a <Link> when `to` is
 * provided, otherwise a real <button>.
 */
export default function Button(props: Props) {
  const { variant = 'primary', size = 'md', block = false, className = '', children, ...rest } = props;
  const btnRef = useRef<HTMLButtonElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  useMagnetic(btnRef, 0.25);
  useMagnetic(linkRef, 0.25);

  const classes = classesFor(variant, size, block, className);

  if ('to' in props && props.to) {
    const { to, ...anchorRest } = rest as Omit<ButtonAsLink, keyof CommonProps>;
    return (
      <Link to={to} ref={linkRef} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={btnRef} className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
