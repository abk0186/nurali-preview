import { esc, safeUrl, paras, rest, applyTheme, SECTION_DEFAULTS, KINDS, sectionOrder, sectionMeta } from './shared.js';

const $ = (s) => document.querySelector(s);
const lines = (t) => String(t || '').split('\n').map((s) => s.trim()).filter(Boolean).map((l) => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['', l]; });
const by = (items, kind) => items.filter((i) => i.section === kind);

function levelBadge(l) { if (!l) return ''; const c = { gold: 'gold', silver: 'silver', bronze: 'bronze', pending: 'pending' }[l.toLowerCase()] || ''; return `<span class="badge ${c}">${esc(l)}</span>`; }

const R = {
  about(s, items) {
    const p = s.profile || {};
    const ps = paras(p.about);
    const facts = [['Age', p.age], ['Grade', p.grade], ['School', p.school], ['Country', p.country]].filter((f) => f[1]);
    if (!ps.length && !facts.length) return '';
    return `<div class="about"><div class="txt">${ps.map((t) => `<p>${esc(t)}</p>`).join('')}</div><div class="facts">${facts.map(([a, b]) => `<div class="fact"><span>${a}</span><b>${esc(b)}</b></div>`).join('')}</div></div>`;
  },
  achievements(s, items) {
    const l = by(items, 'achievements'); if (!l.length) return '';
    return `<div class="grid g2">${l.map(({ data: d }) => `<article class="card">${levelBadge(d.level)}<h3>${esc(d.title)}</h3><div class="meta">${[d.org, d.date].filter(Boolean).map(esc).join(' · ')}</div>${d.description ? `<p>${esc(d.description)}</p>` : ''}</article>`).join('')}</div>`;
  },
  experience(s, items) {
    const l = by(items, 'experience'); if (!l.length) return '';
    return `<div class="tl">${l.map(({ data: d }) => { const ps = paras(d.description); const long = (d.description || '').length > 260; return `<article class="card"><div class="top2"><h3>${esc(d.title)}</h3><span class="meta">${esc(d.period || '')}</span></div><div class="meta">${[d.org, d.location].filter(Boolean).map(esc).join(' · ')}</div>${ps.length ? `<div class="desc ${long ? 'clamp' : ''}">${ps.map((t) => `<p>${esc(t)}</p>`).join('')}</div>${long ? '<button class="more" type="button">Read more</button>' : ''}` : ''}</article>`; }).join('')}</div>`;
  },
  tests(s, items) {
    const l = by(items, 'tests'); if (!l.length) return '';
    return `<div class="grid g2">${l.map(({ data: d }) => { const pend = (d.status || '') !== 'Completed' && d.status; const bd = lines(d.breakdown).filter((x) => x[0]); return `<article class="card">${pend ? levelBadge(d.status) : ''}<h3>${esc(d.name)}</h3><div class="meta">${esc(d.date || '')}</div>${d.score ? `<div class="score">${esc(d.score)}</div>` : '<div class="score" style="font-size:1.6rem">—</div>'}${bd.length ? `<div class="bd">${bd.map(([a, b]) => `<span>${esc(a)}<b>${esc(b)}</b></span>`).join('')}</div>` : ''}${d.note ? `<p>${esc(d.note)}</p>` : ''}${safeUrl(d.doc_url) ? `<p><a href="${esc(safeUrl(d.doc_url))}" target="_blank" rel="noopener">View score report →</a></p>` : ''}</article>`; }).join('')}</div>`;
  },
  education(s, items) {
    const l = by(items, 'education'); if (!l.length) return '';
    return `<div class="grid g2">${l.map(({ data: d }) => `<article class="card"><h3>${esc(d.school)}</h3><div class="meta">${[d.program, d.period].filter(Boolean).map(esc).join(' · ')}</div>${d.note ? `<p>${esc(d.note)}</p>` : ''}</article>`).join('')}</div>`;
  },
  skills(s, items) {
    const l = by(items, 'skills'); if (!l.length) return '';
    const groups = {}; l.forEach((i) => { (groups[i.data.group || ''] ||= []).push(i.data.name); });
    return Object.entries(groups).map(([g, n]) => `${g ? `<div class="grp">${esc(g)}</div>` : ''}<div class="chips" style="margin-bottom:16px">${n.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>`).join('');
  },
  languages(s, items) {
    const l = by(items, 'languages'); if (!l.length) return '';
    return `<div class="grid g3">${l.map(({ data: d }) => `<article class="card"><h3>${esc(d.language)}</h3><div class="score" style="font-size:1.8rem">${esc(d.level || '')}</div>${d.note ? `<div class="meta">${esc(d.note)}</div>` : ''}</article>`).join('')}</div>`;
  },
  documents(s, items) {
    const l = by(items, 'documents'); if (!l.length) return '';
    return `<p class="sub">Open the original files.</p><div class="grid g2">${l.map(({ data: d }) => { const u = safeUrl(d.file_url); const img = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u); return `<a class="card doc" href="${esc(u)}" target="_blank" rel="noopener"><div class="dic">${img ? `<img loading="lazy" src="${esc(u)}" alt="">` : 'PDF'}</div><div><h3>${esc(d.title)}</h3><div class="meta">${[d.type, d.date].filter(Boolean).map(esc).join(' · ')}</div>${d.description ? `<p>${esc(d.description)}</p>` : ''}</div></a>`; }).join('')}</div>`;
  },
  photography(s, items) {
    const p = s.profile || {}; const l = by(items, 'photos'); const link = safeUrl(p.photography_url);
    const intro = p.photography_text ? `<p class="sub">${esc(p.photography_text)}</p>` : '';
    const btn = link ? `<p><a class="btn pri" href="${esc(link)}" target="_blank" rel="noopener">View my photography profile →</a></p>` : '';
    if (!l.length && !link) return `<div class="empty">Photography portfolio is coming soon.</div>`;
    return `${intro}${l.length ? `<div class="gal">${l.map(({ data: d }) => `<button type="button" data-src="${esc(safeUrl(d.image_url))}" data-cap="${esc(d.caption || '')}"><img loading="lazy" src="${esc(safeUrl(d.image_url))}" alt="${esc(d.caption || 'Photo')}"></button>`).join('')}</div>` : ''}${btn}`;
  },
  plans(s, items) {
    const p = s.profile || {}; const u = by(items, 'universities'); const c = by(items, 'career');
    let h = p.plans_intro ? `<p class="sub">${esc(p.plans_intro)}</p>` : '';
    h += `<div class="grp">Where I want to study</div>`;
    h += u.length ? `<div class="grid g3" style="margin-bottom:26px">${u.map(({ data: d }) => { const url = safeUrl(d.url); const inner = `<h3>${esc(d.short)}</h3><div class="meta">${esc(d.name || '')}</div>${d.location ? `<div class="meta">${esc(d.location)}</div>` : ''}${d.note ? `<p>${esc(d.note)}</p>` : ''}`; return url ? `<a class="card doc" style="display:block" href="${esc(url)}" target="_blank" rel="noopener">${inner}</a>` : `<article class="card">${inner}</article>`; }).join('')}</div>` : '<div class="empty" style="margin-bottom:26px">Universities will be added soon.</div>';
    h += `<div class="grp">Where I want to work</div>`;
    h += c.length ? `<div class="grid g2">${c.map(({ data: d }) => `<article class="card"><h3>${esc(d.title)}</h3>${d.description ? `<p>${esc(d.description)}</p>` : ''}</article>`).join('')}</div>` : '<div class="empty">Career goals are coming soon.</div>';
    return h;
  },
};

function contactHtml(c) {
  c = c || {}; const b = [];
  const wa = String(c.whatsapp || '').replace(/\D/g, '');
  if (c.phone && c.show_phone !== false) b.push(`<a href="tel:${esc(String(c.phone).replace(/[^+\d]/g, ''))}">Phone<small>${esc(c.phone)}</small></a>`);
  if (wa) b.push(`<a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp<small>Message me</small></a>`);
  const tg = String(c.telegram || '').replace(/^@|^https?:\/\/t\.me\//i, '').trim();
  if (tg) b.push(`<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram<small>@${esc(tg)}</small></a>`);
  if (c.email) b.push(`<a href="mailto:${esc(c.email)}">Email<small>${esc(c.email)}</small></a>`);
  if (c.school_email && c.show_school_email !== false) b.push(`<a href="mailto:${esc(c.school_email)}">School email<small>${esc(c.school_email)}</small></a>`);
  return { n: b.length, html: `${c.intro ? `<p class="sub" style="margin-top:0">${esc(c.intro)}</p>` : ''}<div class="cbtn">${b.join('')}</div>` };
}

function render(data) {
  const s = data.settings || {}; const items = data.items || [];
  const p = s.profile || {}; const sec = s.sections || {};
  applyTheme(s.theme);
  const name = p.name || 'Nurali Kaldybay';
  document.title = `${name} — portfolio`;
  $('#brandName').textContent = name;
  $('#logo').textContent = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const stats = lines(p.stats);
  const cvDoc = by(items, 'documents').find((i) => /cv|resume/i.test((i.data.type || '') + ' ' + (i.data.title || '')));
  const [first, ...rest] = name.split(' ');
  let html = `<section class="hero" id="top"><div class="wrap"><div>
    ${p.kicker ? `<span class="kicker">${esc(p.kicker)}</span>` : ''}<h1>${esc(first)} <em>${esc(rest.join(' '))}</em></h1>
    ${p.tagline ? `<p class="lead">${esc(p.tagline)}</p>` : ''}
    ${stats.length ? `<div class="stats">${stats.map(([a, b]) => `<div class="stat"><b>${esc(b)}</b><span>${esc(a)}</span></div>`).join('')}</div>` : ''}
    <div class="cta"><a class="btn pri" href="#contact">Contact me</a>${cvDoc && safeUrl(cvDoc.data.file_url) ? `<a class="btn" href="${esc(safeUrl(cvDoc.data.file_url))}" target="_blank" rel="noopener">Open CV (PDF)</a>` : ''}</div>
  </div><div class="avatar">${safeUrl(p.photo_url) ? `<img src="${esc(safeUrl(p.photo_url))}" alt="${esc(name)}">` : `<div aria-hidden="true">${esc($('#logo').textContent)}</div>`}</div></div></section>`;
  const nav = [];
  for (const key of sectionOrder(sec)) {
    const m = sectionMeta(sec, key); if (!m.visible) continue;
    const body = R[key](s, items); if (!body) continue;
    html += `<section class="sec" id="${key}"><div class="wrap"><h2>${esc(m.title)}</h2>${body}</div></section>`;
    nav.push([key, m.nav]);
  }
  const cm = sectionMeta(sec, 'contact'); const ch = contactHtml(s.contact);
  if (cm.visible && ch.n) { html += `<section class="sec" id="contact"><div class="wrap"><div class="contact"><h2>${esc(cm.title)}</h2>${ch.html}</div></div></section>`; nav.push(['contact', 'Contact']); }
  $('#app').innerHTML = html;
  $('#nav').innerHTML = nav.map(([k, t]) => `<a href="#${k}">${esc(t)}</a>`).join('');
  $('#foot').textContent = `© ${new Date().getFullYear()} ${name}`;
}

async function load() {
  let cached = null; try { cached = JSON.parse(localStorage.getItem('nk_cache') || 'null'); } catch (e) {}
  if (cached && cached.items) render(cached);
  try {
    const [st, it] = await Promise.all([rest('settings?select=key,value'), rest('items?select=id,section,position,data,created_at&order=position.asc,created_at.asc')]);
    const settings = {}; st.forEach((r) => { settings[r.key] = r.value; });
    const data = { settings, items: it, theme: settings.theme };
    const j = JSON.stringify(data);
    if (!cached || JSON.stringify(cached) !== j) { render(data); try { localStorage.setItem('nk_cache', j); } catch (e) {} }
  } catch (e) {
    if (!cached) $('#app').innerHTML = `<div class="wrap" style="padding:80px 20px"><div class="empty">Could not load the content. Please refresh the page.</div></div>`;
  }
}

document.addEventListener('click', (e) => {
  const more = e.target.closest('.more'); if (more) { const d = more.previousElementSibling; const on = d.classList.toggle('clamp'); more.textContent = on ? 'Read more' : 'Show less'; return; }
  const g = e.target.closest('.gal button'); if (g) { $('#lbimg').src = g.dataset.src; $('#lbcap').textContent = g.dataset.cap; $('#lb').classList.add('on'); return; }
  if (e.target.closest('#lb')) $('#lb').classList.remove('on');
  if (e.target.closest('#burger')) { const n = $('#nav'); const o = n.classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); return; }
  if (e.target.closest('#nav a')) $('#nav').classList.remove('open');
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#lb').classList.remove('on'); });
load();
