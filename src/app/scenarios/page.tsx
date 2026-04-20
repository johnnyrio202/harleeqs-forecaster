'use client';

import { useScenario } from '@/context/ScenarioContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ScenariosPage() {
  const { savedScenarios, activeScenario, load, clone, remove, saving, loading } = useScenario();
  const router = useRouter();

  function handleLoad(id: string) {
    load(id);
    router.push('/dashboard');
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Scenarios</h1>
        <Link href="/scenarios/new">
          <Button size="sm">New scenario</Button>
        </Link>
      </div>

      {savedScenarios.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-8 text-center text-sm text-slate-500">
            No saved scenarios yet. Save your current working scenario to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedScenarios.map((row) => (
            <Card key={row.id} className="border-slate-200 shadow-sm">
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{row.name}</span>
                    {row.id === activeScenario.id && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Updated {format(new Date(row.updated_at), 'MMM d, yyyy h:mm a')}
                    {' · '}
                    Created {format(new Date(row.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleLoad(row.id)}>
                    Load
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => clone(row.id)} disabled={saving}>
                    Clone
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => {
                      if (confirm(`Delete "${row.name}"?`)) remove(row.id);
                    }}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
