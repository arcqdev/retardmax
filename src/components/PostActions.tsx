import { useState } from 'react';

const NETWORK_FAIL = 'Didn’t go through. It’s fine. Run it back.';

export default function PostActions({ postId, initialVotes, initialBoosts, voted = false, canVote = true, canBoost = false, canReport = false, body }: { postId: string; initialVotes: number; initialBoosts: number; voted?: boolean; canVote?: boolean; canBoost?: boolean; canReport?: boolean; body: string }) {
  const [votes, setVotes] = useState(initialVotes);
  const [boosts, setBoosts] = useState(initialBoosts);
  const [didVote, setDidVote] = useState(voted);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reason, setReason] = useState('');
  const [reportProblem, setReportProblem] = useState('');
  const [reporting, setReporting] = useState(false);

  async function vote() {
    if (!canVote || busy) return;
    setBusy(true); setProblem('');
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, { method: 'POST' });
      const data = await response.json().catch(() => ({})) as { voted?: boolean; error?: string };
      if (response.ok) { setDidVote(Boolean(data.voted)); setVotes((n) => n + (data.voted ? 1 : -1)); }
      else if (response.status === 429) setProblem('That’s 100 Ws today. Frontal lobe needs a break.');
      else if (response.status === 401) setProblem('Sign in first. Then hand out Ws.');
      else setProblem(data.error ?? 'That W didn’t land. Run it back.');
    } catch { setProblem(NETWORK_FAIL); }
    setBusy(false);
  }

  async function boost() {
    if (!canBoost || busy) return;
    setBusy(true); setProblem('');
    try {
      const response = await fetch('/api/checkout/boost', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ postId }) });
      const data = await response.json().catch(() => ({})) as { redirect?: string; error?: string };
      if (response.redirected) { location.href = response.url; return; }
      if (data.redirect) { setBoosts((n) => n + 1); location.href = data.redirect; return; }
      setProblem(!response.ok ? (data.error ?? 'Checkout didn’t open. It’s fine. Run it back.') : NETWORK_FAIL);
    } catch { setProblem(NETWORK_FAIL); }
    setBusy(false);
  }

  function share() {
    const url = `${location.origin}/p/${postId}`;
    void fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event: 'share_clicked', properties: { post_id: postId } }) });
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(`${body} — RETARDMAX\n${url}`)}`, '_blank', 'noopener,noreferrer');
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reporting) return;
    setReporting(true); setReportProblem('');
    try {
      const response = await fetch(`/api/posts/${postId}/report`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason: reason.trim() }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (response.ok) { setReportSent(true); setReportOpen(false); setReason(''); }
      else setReportProblem(data.error ?? NETWORK_FAIL);
    } catch { setReportProblem(NETWORK_FAIL); }
    setReporting(false);
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 font-black uppercase tracking-wide transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed ${didVote ? 'border-flame bg-flame text-white shadow-lg shadow-flame/25' : 'border-white/15 bg-white/5 text-white/75 enabled:hover:border-flame/60 enabled:hover:text-white'}`} onClick={vote} disabled={!canVote || busy} aria-pressed={didVote} title={didVote ? 'Take back your W' : 'Give this a W'}>W <span className="tabular-nums">{votes}</span></button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-1.5 font-black uppercase tracking-wide text-white/75 transition enabled:hover:-translate-y-0.5 enabled:hover:border-flame/60 enabled:hover:text-white disabled:cursor-not-allowed" onClick={boost} disabled={!canBoost || busy} title={canBoost ? 'Boost this post for $1' : 'Boosts'}><span aria-hidden="true">⚡</span> <span className="tabular-nums">{boosts}</span>{canBoost ? <span>Boost $1</span> : null}</button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-1.5 font-bold uppercase tracking-wide text-white/60 transition hover:-translate-y-0.5 hover:border-white/30 hover:text-white" onClick={share} title="Share to X">Share</button>
        {canReport && !reportSent && (
          <button className="rounded-lg px-2 py-1.5 text-xs font-bold leading-none text-white/25 transition hover:text-white/60" onClick={() => { setReportOpen((open) => !open); setReportProblem(''); }} aria-expanded={reportOpen} title="Report this post">⋯<span className="sr-only"> Report this post</span></button>
        )}
      </div>

      {problem && <p className="notice-bad" role="alert">{problem}</p>}
      {reportSent && <p className="notice-ok">Flagged. A human will look. Back to your own moves.</p>}

      {reportOpen && (
        <form className="rounded-xl border border-white/10 bg-black/40 p-3" onSubmit={submitReport}>
          <p className="font-display text-lg leading-none">Report this post</p>
          <p className="mt-1.5 text-xs leading-5 text-white/45">Bold moves are the point. Doxxing, harassment, targeting people = deleted + banned.</p>
          <textarea required value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={2} placeholder="What’s wrong with it?" className="field mt-2.5 resize-none text-sm" />
          {reportProblem && <p className="notice-bad mt-2" role="alert">{reportProblem}</p>}
          <div className="mt-2.5 flex items-center gap-2">
            <button className="btn-quiet px-3 py-1.5 text-xs" disabled={reporting || reason.trim().length === 0}>{reporting ? 'Sending...' : 'Send report'}</button>
            <button type="button" className="px-2 py-1.5 text-xs font-bold text-white/40 transition hover:text-white" onClick={() => { setReportOpen(false); setReason(''); setReportProblem(''); }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
