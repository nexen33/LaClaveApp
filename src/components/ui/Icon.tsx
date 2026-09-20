import React from 'react';

interface IconProps {
  name: string;
  color?: string;
  size?: string | number;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, color, size, onClick, style, className }) => (
  <span
    className={`material-icons ${className || ''}`}
    onClick={onClick}
    style={{
      fontSize: size || 'var(--icon-base)',
      color: color,
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none',
      ...style
    }}
  >
    {name}
  </span>
);

export default Icon;
