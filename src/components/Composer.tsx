import { useState } from 'react';

const LIMIT = 280;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Group = { id: string; name: string };

export default function Composer({ groups = [] }: { groups?: Group[] }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [imageName, setImageName] = useState('');
  const over = body.length - LIMIT;
  const hot = body.length > LIMIT - 20;

  function pickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setProblem(''); setImageName('');
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) { event.currentTarget.value = ''; setProblem('JPEG, PNG, or WebP. Nothing exotic.'); return; }
    if (file.size > MAX_IMAGE_BYTES) { event.currentTarget.value = ''; setProblem('That image is too thicc. 2 MB max.'); return; }
    setImageName(file.name);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (over > 0) { setProblem(`Over by ${over}. Say less, mean more.`); return; }
    setBusy(true); setProblem('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/posts', { method: 'POST', body: form });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (response.ok) { location.reload(); return; }
      if (response.status === 409) setProblem('One a day. That’s the whole point. Come back tomorrow.');
      else if (response.status === 401) setProblem('Sign in first. Then make the move.');
      else setProblem(data.error ?? 'That move didn’t save. It’s fine. Run it back.');
    } catch { setProblem('Didn’t go through. It’s fine. Run it back.'); }
    setBusy(false);
  }

  return (
    <form className="card space-y-4 border-flame/25 p-5 sm:p-6" onSubmit={submit}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your move today</p>
          <h2 className="font-display text-3xl sm:text-4xl">MAKE IT COUNT.</h2>
        </div>
        <span className={`text-sm font-black tabular-nums ${hot ? 'text-flame' : 'text-white/40'}`} aria-live="polite">{body.length}/{LIMIT}</span>
      </div>
      <textarea required name="body" value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="cold-called 100 people before 9am..." className={`field resize-none text-lg ${over > 0 ? 'border-flame/60' : ''}`} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-white/60 transition hover:text-white">
          <span aria-hidden="true">+</span> {imageName || 'image'}
          <input className="hidden" type="file" name="image" accept="image/jpeg,image/png,image/webp" onChange={pickImage} />
        </label>
        {groups.length > 0 && (
          <select name="group_ids[]" className="rounded-lg border border-white/15 bg-black px-2 py-2 text-sm">
            <option value="">Keep it in the log</option>
            {groups.map((g) => <option key={g.id} value={g.id}>Share to {g.name}</option>)}
          </select>
        )}
        <button className="btn-flame ml-auto" disabled={busy || body.trim().length === 0 || over > 0}>{busy ? 'Logging...' : 'Log the move'}</button>
      </div>
      {over > 0 && <p className="notice-bad" role="alert">{over} over the line. Trim it — 280 or it doesn’t ship.</p>}
      {problem && <p className="notice-bad" role="alert">{problem}</p>}
    </form>
  );
}
