import React from 'react';
import Svg, { G, Path, Text as SvgText, TSpan } from 'react-native-svg';

export type MobileLogoVariant = 'horizontal' | 'vertical' | 'light' | 'thermal';

export interface AlphosLogoProps {
  variant?: MobileLogoVariant;
  width?: number;
  height?: number;
}

const HORIZONTAL_PATH =
  'M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19';

export default function AlphosLogo({
  variant = 'horizontal',
  width = 210,
  height = 48,
}: AlphosLogoProps) {
  const isLight = variant === 'light' || variant === 'thermal';
  const stroke = variant === 'thermal' ? '#000000' : isLight ? '#047857' : '#10B981';
  const titleFill = variant === 'thermal' ? '#000000' : isLight ? '#0F172A' : '#F8FAFC';
  const subFill = variant === 'thermal' ? '#111827' : isLight ? '#047857' : '#10B981';
  const accentFill = variant === 'thermal' ? '#000000' : isLight ? '#059669' : '#34D399';

  return (
    <Svg width={width} height={height} viewBox="0 0 320 74">
      <G transform="translate(6, 6)">
        <Path
          d={HORIZONTAL_PATH}
          fill="none"
          stroke={stroke}
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <SvgText
        x={74}
        y={42}
        fill={titleFill}
        fontSize={28}
        fontWeight="800"
        letterSpacing={2.5}
      >
        ALPHOS
      </SvgText>
      <SvgText
        x={76}
        y={58}
        fill={subFill}
        fontSize={10}
        fontWeight="700"
        letterSpacing={3}
      >
        by <TSpan fill={accentFill}>AlphaGen</TSpan>
      </SvgText>
    </Svg>
  );
}
