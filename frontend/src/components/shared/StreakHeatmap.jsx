// src/components/shared/StreakHeatmap.jsx — GitHub-style activity heatmap
import { useMemo } from 'react';

function getColor(count) {
  if (count === 0) return 'var(--surface3)';
  if (count < 30) return '#bbf7d0';  // light green
  if (count < 60) return '#4ade80';  // green
  if (count < 120) return '#16a34a'; // darker green
  return '#15803d';                  // darkest green
}

export default function StreakHeatmap({ sessions = [], days = 84 }) {
  const data = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const d = new Date(s.date || s.created_at || s.createdAt);
      if (!isNaN(d)) {
        const key = d.toISOString().slice(0, 10);
        map[key] = (map[key] || 0) + (s.duration_minutes || s.duration || 30);
      }
    });

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: map[key] || 0, day: d.getDay() });
    }
    return result;
  }, [sessions, days]);

  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const totalMinutes = data.reduce((s, d) => s + d.count, 0);
  const activeDays = data.filter(d => d.count > 0).length;
  const currentStreak = (() => {
    let streak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].count > 0) streak++;
      else break;
    }
    return streak;
  })();

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatChip label="Total Study Time" value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} color="#10b981" />
        <StatChip label="Active Days" value={`${activeDays} / ${days}`} color="#38bdf8" />
        <StatChip label="Current Streak" value={`🔥 ${currentStreak} days`} color="#f59e0b" />
      </div>

      {/* Heatmap grid */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 3, minWidth: 'fit-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count > 0 ? `${day.count} min studied` : 'No activity'}`}
                  style={{
                    width: 12, height: 12, borderRadius: 3,
                    background: getColor(day.count),
                    cursor: 'default',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.4)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text4)' }}>Less</span>
        {['var(--surface3)', '#bbf7d0', '#4ade80', '#16a34a', '#15803d'].map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text4)' }}>More</span>
      </div>
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 900, color }}>
        {value}
      </span>
    </div>
  );
}
