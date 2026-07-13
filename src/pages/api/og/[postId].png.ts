import type { APIRoute } from 'astro';
import { ImageResponse } from 'workers-og';
import { feedPosts } from '@/lib/data';
import { getEnv } from '@/lib/env';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);

// Satori ships no font and no emoji table: without this the card renders in a
// serif fallback and every emoji comes out a tofu box. Fetched once per isolate.
let fontCache: ArrayBuffer | null = null;
async function antonFont(origin: string) {
  if (fontCache) return fontCache;
  try {
    const response = await fetch(new URL('/fonts/anton.woff', origin));
    if (!response.ok) return null;
    fontCache = await response.arrayBuffer();
    return fontCache;
  } catch { return null; }
}

const shell = (inner: string) => `<div style="display:flex;flex-direction:column;justify-content:space-between;width:1200px;height:630px;padding:60px;background:#090909;color:#f5f2eb;font-family:Anton">${inner}</div>`;
const wordmark = '<div style="display:flex;font-size:30px;letter-spacing:8px;color:#ff4d2e">RETARDMAX</div>';

export const GET: APIRoute = async ({ params, locals, request }) => {
  const origin = new URL(request.url).origin;
  const [post] = params.postId === 'site' ? [] : await feedPosts(getEnv(locals).DB, { publicOnly: true, postId: params.postId, limit: 1 });

  // Unknown/private post falls back to the site card rather than a broken preview.
  const inner = post
    ? `${wordmark}<div style="display:flex;font-size:64px;line-height:1.06;max-width:1080px">${escapeHtml(post.body)}</div><div style="display:flex;font-size:27px;letter-spacing:3px;color:#ffb4a6">W ${post.wCount} · BOOSTS ${post.boostCount} · STREAK ${post.streakCount} · @${escapeHtml((post.xHandle ?? post.handle).replace(/^@/, ''))}</div>`
    : `${wordmark}<div style="display:flex;flex-direction:column;font-size:96px;line-height:0.92"><div style="display:flex">MAKE ONE BOLD MOVE.</div><div style="display:flex;color:#ff4d2e">PROVE IT.</div></div><div style="display:flex;font-size:27px;letter-spacing:3px;color:#ffb4a6">ONE MOVE A DAY · $1 TO GO PUBLIC · THE BOARD DECIDES</div>`;

  const font = await antonFont(origin);
  return new ImageResponse(shell(inner), {
    width: 1200,
    height: 630,
    ...(font ? { fonts: [{ name: 'Anton', data: font, weight: 400, style: 'normal' as const }] } : {}),
  });
};
