import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useThemeLang } from '../contexts/useThemeLang';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function DigitalClock({ label, compact = false }) {
  const { lang } = useThemeLang();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const dateString = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);

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
