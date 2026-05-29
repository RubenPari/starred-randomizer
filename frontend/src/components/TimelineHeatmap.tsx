import { useMemo } from 'react';
import type { StarActivity } from '../types';

interface TimelineHeatmapProps {
  activity: StarActivity[];
  title?: string;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function getColor(count: number, max: number): string {
  if (count === 0) return 'var(--color-surface-2)';
  const intensity = count / Math.max(max, 1);
  if (intensity < 0.2) return 'color-mix(in srgb, var(--color-brand) 20%, transparent)';
  if (intensity < 0.4) return 'color-mix(in srgb, var(--color-brand) 35%, transparent)';
  if (intensity < 0.6) return 'color-mix(in srgb, var(--color-brand) 55%, transparent)';
  if (intensity < 0.8) return 'color-mix(in srgb, var(--color-brand) 75%, transparent)';
  return 'var(--color-brand)';
}

const LEGEND_LEVELS = [
  'var(--color-surface-2)',
  'color-mix(in srgb, var(--color-brand) 20%, transparent)',
  'color-mix(in srgb, var(--color-brand) 35%, transparent)',
  'color-mix(in srgb, var(--color-brand) 55%, transparent)',
  'color-mix(in srgb, var(--color-brand) 75%, transparent)',
  'var(--color-brand)',
];

export default function TimelineHeatmap({ activity, title = 'Heatmap stellings' }: TimelineHeatmapProps) {
  const heatmapData = useMemo(() => {
    if (activity.length === 0) return { days: [], maxCount: 0, weeks: [] };

    const dataMap = new Map<string, number>();
    for (const item of activity) {
      dataMap.set(item.date, item.count);
    }

    const today = new Date();
    const days: { date: string; count: number; dayOfWeek: number; month: number; week: number }[] = [];

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      let dayOfWeek = date.getDay() - 1;
      if (dayOfWeek < 0) dayOfWeek = 6;

      const jan1 = new Date(date.getFullYear(), 0, 1);
      const week = Math.floor((date.getTime() - jan1.getTime()) / (7 * 24 * 60 * 60 * 1000));

      days.push({
        date: dateStr,
        count: dataMap.get(dateStr) ?? 0,
        dayOfWeek,
        month: date.getMonth(),
        week,
      });
    }

    const maxCount = days.reduce((max, d) => Math.max(max, d.count), 1);

    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];

    for (const day of days) {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { days, maxCount, weeks };
  }, [activity]);

  if (activity.length === 0) return null;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg animate-fade-in">
      <h2 className="text-lg font-semibold text-primary mb-4">{title}</h2>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-fit">
          <div className="flex flex-col justify-between py-1 text-xs text-muted w-8">
            {DAY_LABELS.map((label, i) => (
              <span key={i} className="h-3 flex items-center">
                {i % 2 === 0 ? label : ''}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            {heatmapData.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di];
                  if (!day) return <div key={di} className="w-3 h-3 rounded-sm" />;
                  return (
                    <div
                      key={di}
                      className="w-3 h-3 rounded-sm hover:ring-1 hover:ring-brand transition-all cursor-pointer relative group"
                      style={{ backgroundColor: getColor(day.count, heatmapData.maxCount) }}
                      aria-label={`${day.date}: ${day.count} repo`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface rounded text-xs text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.date}: {day.count} repo
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-muted">
        <span>Da un anno fa</span>
        <div className="flex items-center gap-1">
          <span>Meno</span>
          {LEGEND_LEVELS.map((color, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          ))}
          <span>Più</span>
        </div>
        <span>Recente</span>
      </div>
    </div>
  );
}