import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!cancelled) setEntries(data.leaderboard ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <p role="status">Loading leaderboard...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <p role="alert">Unable to load leaderboard: {error}</p>
      </CapabilityCard>
    );
  }

  if (entries.length === 0) {
    return (
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <p>No leaderboard</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li key={`${entry.teamName}-${entry.rank}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{entry.rank}. {entry.teamName}</span>
            <span>{entry.totalPoints} pts</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
