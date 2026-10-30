import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason?: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const email = 'mona@example.com';

    async function loadSuggestions() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`);
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <p role="status">Loading workout suggestions...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <p role="alert">Unable to load workout suggestions: {error}</p>
      </CapabilityCard>
    );
  }

  if (suggestions.length === 0) {
    return (
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <p>No workout suggestions</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title}-${index}`} className="list-group-item">
            <div className="fw-semibold">{suggestion.title}</div>
            {suggestion.reason ? <small>{suggestion.reason}</small> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
