import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Remote({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M15 9H9c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V10c0-.55-.45-1-1-1zm-3 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3-4H9v-6h6v6zM7.05 6.55l1.41 1.41C9.37 7.07 10.62 6.5 12 6.5s2.63.57 3.54 1.46l1.41-1.41C15.68 5.26 13.93 4.5 12 4.5s-3.68.76-4.95 2.05zM12 1.5c-2.76 0-5.26 1.12-7.07 2.93l1.41 1.41C7.79 4.37 9.79 3.5 12 3.5s4.21.87 5.66 2.34l1.41-1.41C17.26 2.62 14.76 1.5 12 1.5z"
        fill={color}
      />
    </Svg>
  );
}
