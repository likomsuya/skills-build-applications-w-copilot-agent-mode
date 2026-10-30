import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members?: Array<string | { _id?: string; name?: string }> };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJson<{ teams: Team[] }>('/api/teams');
        if (!cancelled) setTeams(data.teams ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <p role="status">Loading teams...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <p role="alert">Unable to load teams: {error}</p>
      </CapabilityCard>
    );
  }

  if (teams.length === 0) {
    return (
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <p>No teams</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name}-${index}`} className="list-group-item">
            <div className="fw-semibold">{team.name}</div>
            <small>{(team.members ?? []).length} member(s)</small>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
