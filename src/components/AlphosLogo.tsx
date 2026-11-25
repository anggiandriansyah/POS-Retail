export type AlphosLogoVariant = 'horizontal' | 'vertical' | 'light' | 'thermal';

export interface AlphosLogoProps {
  variant?: AlphosLogoVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
  showWordmark?: boolean;
  ariaLabel?: string;
  decorative?: boolean;
}

interface VariantSpec {
  defaultWidth: number;
  defaultHeight: number;
  vbWidth: number;
  vbHeight: number;
  viewBox: string;
  groupTransform: string;
  pathD: string;
  stroke: string;
  strokeWidth: number;
  titleX: number;
  titleY: number;
  titleFill: string;
  titleFontSize: number;
  titleFontWeight: number;
  titleLetterSpacing: number;
  subX: number;
  subY: number;
  subFill: string;
  subAccentFill: string | null;
  subFontSize: number;
  subFontWeight: number;
  subLetterSpacing: number;
  fontFamily: string;
  textAnchor?: 'middle';
}

const HORIZONTAL_PATH =
  'M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19';

const VARIANT_CONFIG: Record<AlphosLogoVariant, VariantSpec> = {
  horizontal: {
    defaultWidth: 340,
    defaultHeight: 80,
    vbWidth: 320,
    vbHeight: 74,
    viewBox: '0 0 320 74',
    groupTransform: 'translate(6, 6)',
    pathD: HORIZONTAL_PATH,
    stroke: '#10B981',
    strokeWidth: 5.5,
    titleX: 74,
    titleY: 42,
    titleFill: '#F8FAFC',
    titleFontSize: 28,
    titleFontWeight: 800,
    titleLetterSpacing: 2.5,
    subX: 76,
    subY: 58,
    subFill: '#10B981',
    subAccentFill: '#34D399',
    subFontSize: 10,
    subFontWeight: 700,
    subLetterSpacing: 3,
    fontFamily: 'system-ui, sans-serif',
  },
  vertical: {
    defaultWidth: 240,
    defaultHeight: 150,
    vbWidth: 260,
    vbHeight: 170,
    viewBox: '0 0 260 170',
    groupTransform: 'translate(98, 16)',
    pathD: 'M 52 26 C 37 21, 19 32, 19 46 C 19 58, 32 63, 42 55 L 48 63 L 64 26',
    stroke: '#10B981',
    strokeWidth: 7,
    titleX: 130,
    titleY: 124,
    titleFill: '#F8FAFC',
    titleFontSize: 30,
    titleFontWeight: 800,
    titleLetterSpacing: 3,
    subX: 130,
    subY: 148,
    subFill: '#10B981',
    subAccentFill: '#34D399',
    subFontSize: 11,
    subFontWeight: 700,
    subLetterSpacing: 3,
    fontFamily: 'system-ui, sans-serif',
    textAnchor: 'middle',
  },
  light: {
    defaultWidth: 340,
    defaultHeight: 80,
    vbWidth: 320,
    vbHeight: 74,
    viewBox: '0 0 320 74',
    groupTransform: 'translate(6, 6)',
    pathD: HORIZONTAL_PATH,
    stroke: '#059669',
    strokeWidth: 5.5,
    titleX: 74,
    titleY: 42,
    titleFill: '#0F172A',
    titleFontSize: 28,
    titleFontWeight: 800,
    titleLetterSpacing: 2.5,
    subX: 76,
    subY: 58,
    subFill: '#059669',
    subAccentFill: '#10B981',
    subFontSize: 10,
    subFontWeight: 700,
    subLetterSpacing: 3,
    fontFamily: 'system-ui, sans-serif',
  },
  thermal: {
    defaultWidth: 280,
    defaultHeight: 80,
    vbWidth: 260,
    vbHeight: 74,
    viewBox: '0 0 260 74',
    groupTransform: 'translate(4, 8)',
    pathD: 'M 40 16 C 28 12, 13 22, 13 34 C 13 44, 23 48, 32 42 L 37 48 L 49 16',
    stroke: '#000000',
    strokeWidth: 6.5,
    titleX: 68,
    titleY: 38,
    titleFill: '#000000',
    titleFontSize: 28,
    titleFontWeight: 900,
    titleLetterSpacing: 2,
    subX: 70,
    subY: 56,
    subFill: '#000000',
    subAccentFill: null,
    subFontSize: 10.5,
    subFontWeight: 700,
    subLetterSpacing: 2.5,
    fontFamily: 'monospace',
  },
};

function resolveDimensions(
  width: number | string | undefined,
  height: number | string | undefined,
  defaultWidth: number,
  defaultHeight: number,
  vbWidth: number,
  vbHeight: number
): { width?: number | string; height?: number | string } {
  if (width === undefined && height === undefined) {
    return { width: defaultWidth, height: defaultHeight };
  }
  if (width !== undefined && height !== undefined) {
    return { width, height };
  }
  if (width !== undefined) {
    return {
      width,
      height: typeof width === 'number' ? Math.round((width * vbHeight) / vbWidth) : undefined,
    };
  }
  return {
    width: typeof height === 'number' ? Math.round((height * vbWidth) / vbHeight) : undefined,
    height,
  };
}

export function AlphosLogo({
  variant = 'horizontal',
  width,
  height,
  className,
  showWordmark = true,
  ariaLabel = 'ALPHOS by AlphaGen',
  decorative = false,
}: AlphosLogoProps) {
  const spec = VARIANT_CONFIG[variant];
  const a11yProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': ariaLabel };

  if (!showWordmark) {
    const iconSize = resolveDimensions(width, height, 40, 40, 64, 64);
    return (
      <svg
        width={iconSize.width}
        height={iconSize.height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...a11yProps}
      >
        <g transform="translate(-11.5, -13.5) scale(1.3)">
          <path
            d={HORIZONTAL_PATH}
            stroke={spec.stroke}
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  }

  const size = resolveDimensions(
    width,
    height,
    spec.defaultWidth,
    spec.defaultHeight,
    spec.vbWidth,
    spec.vbHeight
  );

  return (
    <svg
      width={size.width}
      height={size.height}
      viewBox={spec.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...a11yProps}
    >
      <g transform={spec.groupTransform}>
        <path
          d={spec.pathD}
          stroke={spec.stroke}
          strokeWidth={spec.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <text
        x={spec.titleX}
        y={spec.titleY}
        textAnchor={spec.textAnchor}
        fill={spec.titleFill}
        fontSize={spec.titleFontSize}
        fontWeight={spec.titleFontWeight}
        fontFamily={spec.fontFamily}
        letterSpacing={spec.titleLetterSpacing}
      >
        ALPHOS
      </text>
      <text
        x={spec.subX}
        y={spec.subY}
        textAnchor={spec.textAnchor}
        fill={spec.subFill}
        fontSize={spec.subFontSize}
        fontWeight={spec.subFontWeight}
        fontFamily={spec.fontFamily}
        letterSpacing={spec.subLetterSpacing}
      >
        {spec.subAccentFill ? (
          <>
            by <tspan fill={spec.subAccentFill}>AlphaGen</tspan>
          </>
        ) : (
          'by AlphaGen'
        )}
      </text>
    </svg>
  );
}

export default AlphosLogo;
