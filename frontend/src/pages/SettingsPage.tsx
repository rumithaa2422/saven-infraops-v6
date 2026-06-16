import { useEffect, useState } from 'react';
import { api } from '../services/api';

type Setting = { key: string; value: string; group: string };

export function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data.items)).catch(() => setSettings([]));
  }, []);

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Configuration</span>
          <h2>Settings</h2>
        </div>
      </div>
      <div className="settings-grid">
        {settings.map((item) => (
          <label className="setting-card" key={item.key}>
            <span>{item.group}</span>
            <strong>{item.key}</strong>
            <input value={item.value} readOnly />
          </label>
        ))}
        {!settings.length && <p>No settings loaded. Check backend and database seed.</p>}
      </div>
    </div>
  );
}
