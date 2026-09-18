// Builds a self-contained HTML card for sharing fishing regulations — the
// same summary the in-app panel shows (species, seasons & limits, key rules)
// with clickable official links at the bottom. Recipients don't need the app.

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function buildRegulationsShareCardHtml(regs, logoDataUrl = '') {
  if (!regs) throw new Error('No regulations data');

  const speciesBox = regs.waterbody?.speciesSummary
    ? `<div class="species">
        <div class="species-label">Species in this waterbody</div>
        <div class="species-list">${esc(regs.waterbody.speciesSummary)}</div>
      </div>`
    : '';

  const seasonRows = (regs.seasons || [])
    .map(
      (s, i) => `<tr class="${i % 2 ? 'alt' : ''}">
        <td>
          <div class="sp">${esc(s.species)}</div>
          <div class="sub">Season: ${esc(s.season)}</div>
          <div class="sub">Limits: ${esc(s.limit)}</div>
        </td>
      </tr>`
    )
    .join('');

  const ruleItems = (regs.generalRules || [])
    .map((r) => `<li>${esc(r)}</li>`)
    .join('');

  const linkItems = (regs.links || [])
    .map(
      (l) => `<a href="${esc(l.url)}">${esc(l.label)}<span>${esc(l.url)}</span></a>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Fishing Regulations — ${esc(regs.areaLabel || 'Summary')}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #eef2f6; color: #0f172a; padding: 20px; }
  .card { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15,23,42,.08); overflow: hidden; }
  .head { display: flex; align-items: center; gap: 12px; padding: 18px 20px 14px; border-bottom: 1px solid #e2e8f0; }
  .badge { width: 36px; height: 36px; border-radius: 10px; background: #1e5aa8; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; overflow: hidden; }
  .badge img { width: 100%; height: 100%; border-radius: 8px; object-fit: cover; display: block; }
  h1 { margin: 0; font-size: 19px; }
  .area { margin-top: 2px; color: #64748b; font-size: 13px; }
  .body { padding: 16px 20px 18px; }
  .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; margin: 14px 0 8px; }
  .species { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 10px 12px; }
  .species-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #0f766e; margin-bottom: 4px; }
  .species-list { font-size: 14px; line-height: 1.45; }
  table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  td { padding: 8px 12px; }
  tr.alt td { background: #f8fafc; }
  tr + tr td { border-top: 1px solid #e2e8f0; }
  .sp { font-size: 14px; font-weight: 600; }
  .sub { font-size: 12px; color: #64748b; margin-top: 1px; }
  ul { margin: 0; padding-left: 18px; }
  li { font-size: 14px; line-height: 1.5; margin-top: 4px; }
  .warn { margin-top: 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 10px 12px; font-size: 14px; line-height: 1.45; }
  .links a { display: block; margin-top: 8px; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; color: #1e5aa8; font-weight: 600; font-size: 14px; word-break: break-word; }
  .links a span { display: block; font-weight: 400; color: #94a3b8; font-size: 12px; margin-top: 1px; }
  footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 14px 0 4px; }
</style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="badge">${logoDataUrl ? `<img src="${esc(logoDataUrl)}" alt="HeronWise" />` : '&#9875;'}</div>
      <div>
        <h1>Fishing Regulations</h1>
        <div class="area">${esc(regs.areaLabel || '')}</div>
      </div>
    </div>
    <div class="body">
      ${speciesBox}
      ${seasonRows ? `<div><div class="label">Open seasons &amp; limits</div><table>${seasonRows}</table></div>` : ''}
      ${ruleItems ? `<div><div class="label">Key rules</div><ul>${ruleItems}</ul></div>` : ''}
      ${regs.exceptionsNote ? `<div class="warn">${esc(regs.exceptionsNote)}</div>` : ''}
      ${linkItems ? `<div><div class="label">Official sources</div><div class="links">${linkItems}</div></div>` : ''}
    </div>
  </div>
  <footer>Shared from HeronWise${regs.source === 'ai' ? ' — AI-generated summary' : ''}. Always verify with the official sources before fishing.</footer>
</body>
</html>`;
}