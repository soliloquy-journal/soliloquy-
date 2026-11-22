import React from 'react';
import { BatteryLow, CloudRain, CloudSun, Meh, Smile, Zap } from 'lucide-react';
import { getMoodMeta, normalizeMoodScore } from '../constants/moods';
import type { MoodScore } from '../types/journal';

export const MOOD_ICONS: Record<
  MoodScore,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  1: BatteryLow,
  2: CloudRain,
  3: Meh,
  4: CloudSun,
  5: Smile,
  6: Zap,
};

function createStarburstPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
  rotationDeg = -90
): string {
  const coords: string[] = [];
  const total = points * 2;
  const startRad = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = startRad + (i * Math.PI) / points;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return coords.join(' ');
}

function createPolygonPoints(
  cx: number,
  cy: number,
  r: number,
  sides: number,
  rotationDeg = -90
): string {
  const coords: string[] = [];
  const startRad = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < sides; i++) {
    const angle = startRad + (i * 2 * Math.PI) / sides;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return coords.join(' ');
}

export const MoodCharacterSVG: React.FC<{
  score: MoodScore | number;
  size?: number;
  withAura?: boolean;
  className?: string;
}> = ({ score, size = 180, withAura = true, className = '' }) => {
  const normalized = normalizeMoodScore(score);
  const mood = getMoodMeta(normalized);
  const Icon = MOOD_ICONS[normalized];

  // Original Neo-Brutalist geometric badge/sunburst shape per mood level
  const renderMainShape = (offsetX = 0, offsetY = 0, isShadow = false) => {
    const cx = 110 + offsetX;
    const cy = 110 + offsetY;
    const fill = isShadow ? '#111111' : mood.bgHex;
    const stroke = '#111111';
    const strokeWidth = isShadow ? 0 : 4.5;

    switch (normalized) {
      case 6:
        // Unstoppable: Crisp 14-point high-energy sunburst
        return (
          <polygon
            points={createStarburstPoints(cx, cy, 84, 65, 14)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="miter"
          />
        );
      case 5:
        // Happy: 10-point radiant geometric burst
        return (
          <polygon
            points={createStarburstPoints(cx, cy, 80, 63, 10)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );
      case 4:
        // Calm: Sunburst 8-point badge
        return (
          <polygon
            points={createStarburstPoints(cx, cy, 78, 64, 8, -67.5)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );
      case 3:
        // Neutral: Crisp geometric octagon
        return (
          <polygon
            points={createPolygonPoints(cx, cy, 74, 8, -67.5)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="miter"
          />
        );
      case 2:
        // Low: Bold hexagonal badge
        return (
          <polygon
            points={createPolygonPoints(cx, cy, 74, 6, -90)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="miter"
          />
        );
      case 1:
      default:
        // Burned Out: Heavy neo-brutalist rotated diamond-square
        return (
          <rect
            x={cx - 56}
            y={cy - 56}
            width={112}
            height={112}
            rx={16}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  const iconSize = Math.round(size * 0.34);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={mood.label}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {withAura && (
          <>
            {/* Crisp Neo-Brutalist geometric accent framing */}
            <circle
              cx="110"
              cy="110"
              r="98"
              stroke={mood.isLightBg ? '#111111' : '#FFFFFF'}
              strokeOpacity="0.22"
              strokeWidth="2.5"
              strokeDasharray="8 8"
            />
            <rect
              x="22"
              y="26"
              width="14"
              height="14"
              rx="3"
              transform="rotate(-12 22 26)"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="3"
            />
            <polygon
              points="186,28 198,48 174,48"
              fill="#E8C974"
              stroke="#111111"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle
              cx="192"
              cy="178"
              r="7"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="3"
            />
            <rect
              x="24"
              y="174"
              width="12"
              height="12"
              rx="2"
              transform="rotate(20 24 174)"
              fill={mood.bgHex}
              stroke="#111111"
              strokeWidth="3"
            />
          </>
        )}

        {/* Hard Neo-Brutalist offset shadow */}
        {renderMainShape(7, 7, true)}

        {/* Main geometric badge / sunburst */}
        {renderMainShape(0, 0, false)}

        {/* Inner high-contrast medallion */}
        <circle
          cx="110"
          cy="110"
          r="46"
          fill={mood.isLightBg ? '#FFFDF7' : '#111111'}
          stroke="#111111"
          strokeWidth="4"
        />
        <circle
          cx="110"
          cy="110"
          r="38"
          fill={mood.surfaceHex}
          fillOpacity={mood.isLightBg ? 0.14 : 0.9}
        />
      </svg>

      {/* Crisp Lucide icon centered inside the medallion */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ color: mood.isLightBg ? '#111111' : '#FFFFFF' }}
      >
        <span style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
          <Icon className="w-full h-full" strokeWidth={2.5} />
        </span>
      </div>
    </div>
  );
};

export const MoodBadge: React.FC<{
  score: MoodScore | number;
  size?: number;
  className?: string;
}> = ({ score, size = 40, className = '' }) => {
  const normalized = normalizeMoodScore(score);
  const mood = getMoodMeta(normalized);
  const Icon = MOOD_ICONS[normalized];
  const iconSize = Math.max(14, Math.round(size * 0.54));

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl border-2 border-[#111111] dark:border-zinc-200 shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000] shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: mood.bgHex,
        color: mood.isLightBg ? '#111111' : '#FFFFFF',
      }}
      aria-label={mood.label}
    >
      <span style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
        <Icon className="w-full h-full" strokeWidth={2.5} />
      </span>
    </span>
  );
};

export const StatsTrioIllustration: React.FC = () => (
  <div className="w-full rounded-xl bg-[#FFFDF7] dark:bg-[#232329] border-2 border-[#111111] dark:border-zinc-200 shadow-[4px_4px_0px_#111111] dark:shadow-[4px_4px_0px_#000000] overflow-hidden flex items-center justify-center gap-3 sm:gap-5 py-4 px-4">
    <MoodCharacterSVG score={4} size={86} withAura={false} />
    <MoodCharacterSVG score={6} size={106} withAura={false} />
    <MoodCharacterSVG score={5} size={86} withAura={false} />
  </div>
);
