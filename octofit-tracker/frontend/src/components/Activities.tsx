import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJson<{ activities: Activity[] }>('/api/activities');
        if (!cancelled) setActivities(data.activities ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadActivities();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <p role="status">Loading activities...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <p role="alert">Unable to load activities: {error}</p>
      </CapabilityCard>
    );
  }

  if (activities.length === 0) {
    return (
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <p>No activities</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type}-${activity.minutes}-${index}`} className="list-group-item">
            <strong>{activity.type}</strong> · {activity.minutes} minutes · {activity.points ?? 0} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
