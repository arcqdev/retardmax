import { useState } from 'react';

export default function PayButton({ postId }: { postId: string }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  async function pay() {
    if (busy) return;
    setBusy(true); setProblem('');
    try {
      const response = await fetch('/api/checkout/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ postId }) });
      const data = await response.json().catch(() => ({})) as { redirect?: string; error?: string };
      if (response.redirected) { location.href = response.url; return; }
      if (data.redirect) { location.href = data.redirect; return; }
      if (response.status === 503) setProblem('Checkout is down. Not your fault. Try again in a bit.');
      else setProblem(data.error ?? 'Didn’t go through. It’s fine. Run it back.');
    } catch { setProblem('Didn’t go through. It’s fine. Run it back.'); }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <button className="btn-flame w-full py-3 text-base" onClick={pay} disabled={busy}>{busy ? 'Opening checkout...' : '$1 — supports the site & gates the bots.'}</button>
      {problem && <p className="notice-bad" role="alert">{problem}</p>}
    </div>
  );
}
