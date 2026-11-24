'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useThemeLang } from '../contexts/useThemeLang';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export interface DigitalClockProps {
  label?: string;
  compact?: boolean;
}

export default function DigitalClock({ label, compact = false }: DigitalClockProps) {
  const { lang } = useThemeLang();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setNow(new Date());
    }, 0);
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  const timeString = now
    ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    : '--:--:--';
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const dateString = now
    ? new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(now)
    : '-';

  return (
    <div className={`digital-clock ${compact ? 'digital-clock-compact' : ''}`}>
      <div className="digital-clock-meta">
        <Clock size={compact ? 14 : 16} />
        <span>{label || dateString}</span>
      </div>
      <div className="digital-clock-time" aria-live="off">
        {timeString}
      </div>
      {label && <div className="digital-clock-date">{dateString}</div>}
    </div>
  );
}
