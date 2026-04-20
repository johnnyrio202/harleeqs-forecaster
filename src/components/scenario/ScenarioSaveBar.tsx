'use client';

import { useState } from 'react';
import { useScenario } from '@/context/ScenarioContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ScenarioSaveBar() {
  const { activeScenario, save, saveAs, saving } = useScenario();
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [name, setName] = useState('');

  async function handleSaveAs() {
    if (!name.trim()) return;
    await saveAs(name.trim());
    setShowSaveAs(false);
    setName('');
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2">
        <span className="text-sm font-medium text-slate-700 mr-2">{activeScenario.name}</span>
        <Button size="sm" variant="outline" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setName(activeScenario.name); setShowSaveAs(true); }} disabled={saving}>
          Save as…
        </Button>
      </div>

      <Dialog open={showSaveAs} onOpenChange={setShowSaveAs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save scenario as</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Scenario name"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveAs()}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowSaveAs(false)}>Cancel</Button>
            <Button onClick={handleSaveAs} disabled={!name.trim() || saving}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
