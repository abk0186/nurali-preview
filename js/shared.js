// Shared config + helpers for public site and admin
export const SB_URL = 'https://iwpmrordpxrkxlpaxutx.supabase.co';
export const SB_KEY = 'sb_publishable_AbdSHjsV3Esw8ZwLlyzktA_2bScyiMe';
export const BUCKET = 'nurali-files';
export const publicUrlBase = `${SB_URL}/storage/v1/object/public/${BUCKET}/`;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeUrl = (u) => { u = String(u || '').trim(); return /^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : ''; };
export const paras = (t) => String(t || '').split(/\n{2,}|\r\n\r\n/).map((s) => s.trim()).filter(Boolean);

export async function rest(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY } });
  if (!r.ok) throw new Error('Request failed: ' + r.status);
  return r.json();
}

// ---------- sections & fields ----------
export const DEFAULT_ORDER = ['about', 'achievements', 'experience', 'tests', 'education', 'skills', 'languages', 'documents', 'photography', 'plans'];
export const SECTION_DEFAULTS = {
  about: { title: 'About me', nav: 'About' },
  achievements: { title: 'Achievements & awards', nav: 'Awards' },
  experience: { title: 'Experience & programs', nav: 'Experience' },
  tests: { title: 'Test results', nav: 'Tests' },
  education: { title: 'Education', nav: 'Education' },
  skills: { title: 'Skills', nav: 'Skills' },
  languages: { title: 'Languages', nav: 'Languages' },
  documents: { title: 'Documents & certificates', nav: 'Documents' },
  photography: { title: 'Photography', nav: 'Photography' },
  plans: { title: 'Future plans', nav: 'Plans' },
  contact: { title: 'Contact us', nav: 'Contact' },
};
// kinds of list items (stored in items.section)
export const KINDS = {
  achievements: { label: 'Achievements & awards', section: 'achievements', title: 'title', sub: 'org',
    fields: [
      { k: 'title', label: 'Title', type: 'text', req: true, ph: 'World Scholar\'s Cup — Team Bowl' },
      { k: 'level', label: 'Award level', type: 'select', options: ['', 'Gold', 'Silver', 'Bronze', 'Scholarship', 'Selected', 'Finalist', 'Pending', 'Other'] },
      { k: 'org', label: 'Organization / event', type: 'text' },
      { k: 'date', label: 'Date', type: 'text', ph: 'March 2025' },
      { k: 'description', label: 'Description', type: 'textarea' },
    ] },
  experience: { label: 'Experience & programs', section: 'experience', title: 'title', sub: 'org',
    fields: [
      { k: 'title', label: 'Title', type: 'text', req: true },
      { k: 'org', label: 'Organization', type: 'text' },
      { k: 'period', label: 'Dates', type: 'text', ph: 'Jun – Aug 2026' },
      { k: 'location', label: 'Location', type: 'text', ph: 'Online / Hong Kong' },
      { k: 'description', label: 'Description (blank line = new paragraph)', type: 'textarea', rows: 8 },
    ] },
  tests: { label: 'Test results', section: 'tests', title: 'name', sub: 'score',
    fields: [
      { k: 'name', label: 'Test', type: 'text', req: true, ph: 'IELTS' },
      { k: 'score', label: 'Score', type: 'text', ph: '7.5' },
      { k: 'status', label: 'Status', type: 'select', options: ['Completed', 'Pending', 'Planned'] },
      { k: 'date', label: 'Date', type: 'text', ph: 'September 2026' },
      { k: 'breakdown', label: 'Breakdown (one per line, "Label: value")', type: 'textarea', rows: 5, ph: 'Listening: 9.0\nReading: 8.0' },
      { k: 'note', label: 'Note', type: 'text', ph: 'Results announced 20 November' },
      { k: 'doc_url', label: 'Score report (optional file)', type: 'file' },
    ] },
  education: { label: 'Education', section: 'education', title: 'school', sub: 'program',
    fields: [
      { k: 'school', label: 'School', type: 'text', req: true },
      { k: 'program', label: 'Grade / program', type: 'text' },
      { k: 'period', label: 'Years', type: 'text' },
      { k: 'note', label: 'Notes', type: 'textarea' },
    ] },
  skills: { label: 'Skills', section: 'skills', title: 'name', sub: 'group',
    fields: [
      { k: 'name', label: 'Skill', type: 'text', req: true },
      { k: 'group', label: 'Group (optional, e.g. Academic)', type: 'text' },
    ] },
  languages: { label: 'Languages', section: 'languages', title: 'language', sub: 'level',
    fields: [
      { k: 'language', label: 'Language', type: 'text', req: true },
      { k: 'level', label: 'Level', type: 'text', ph: 'C1' },
      { k: 'note', label: 'Note', type: 'text', ph: 'IELTS 7.5' },
    ] },
  documents: { label: 'Documents & certificates', section: 'documents', title: 'title', sub: 'type',
    fields: [
      { k: 'title', label: 'Title', type: 'text', req: true },
      { k: 'type', label: 'Type', type: 'select', options: ['Certificate', 'CV', 'Test report', 'Transcript', 'Recommendation', 'Award', 'Other'] },
      { k: 'date', label: 'Date', type: 'text' },
      { k: 'description', label: 'Description', type: 'textarea' },
      { k: 'file_url', label: 'File (PDF or image, up to 12 MB)', type: 'file', req: true },
    ] },
  photos: { label: 'Photography gallery', section: 'photography', title: 'caption', sub: '',
    fields: [
      { k: 'image_url', label: 'Photo', type: 'image', req: true },
      { k: 'caption', label: 'Caption', type: 'text' },
    ] },
  universities: { label: 'Target universities', section: 'plans', title: 'short', sub: 'name',
    fields: [
      { k: 'short', label: 'Short name', type: 'text', req: true, ph: 'HKU' },
      { k: 'name', label: 'Full name', type: 'text' },
      { k: 'location', label: 'Location', type: 'text' },
      { k: 'url', label: 'Website', type: 'url' },
      { k: 'note', label: 'Note (e.g. major, status)', type: 'text' },
    ] },
  career: { label: 'Career goals', section: 'plans', title: 'title', sub: '',
    fields: [
      { k: 'title', label: 'Goal / where I want to work', type: 'text', req: true },
      { k: 'description', label: 'Description', type: 'textarea' },
    ] },
};

export const PROFILE_FIELDS = [
  { k: 'name', label: 'Name', type: 'text' },
  { k: 'kicker', label: 'Line above the name', type: 'text' },
  { k: 'tagline', label: 'Tagline under the name', type: 'textarea', rows: 3 },
  { k: 'photo_url', label: 'Profile photo', type: 'image' },
  { k: 'stats', label: 'Highlights in the hero (one per line, "Label: value")', type: 'textarea', rows: 4 },
  { k: 'age', label: 'Age (shown in About)', type: 'text' },
  { k: 'grade', label: 'Grade', type: 'text' },
  { k: 'school', label: 'School', type: 'text' },
  { k: 'country', label: 'Country', type: 'text' },
  { k: 'about', label: 'About me (blank line = new paragraph)', type: 'textarea', rows: 9 },
  { k: 'photography_url', label: 'Link to my photography profile (Instagram, Behance, ...)', type: 'url' },
  { k: 'photography_text', label: 'Photography intro text', type: 'textarea', rows: 3 },
  { k: 'plans_intro', label: 'Future plans intro text', type: 'textarea', rows: 3 },
];
export const CONTACT_FIELDS = [
  { k: 'phone', label: 'Phone (display)', type: 'text', ph: '+7 777 000 0000' },
  { k: 'show_phone', label: 'Show phone number on the site', type: 'bool' },
  { k: 'whatsapp', label: 'WhatsApp number (digits only, with country code)', type: 'text', ph: '77770000000' },
  { k: 'telegram', label: 'Telegram username (without @) — button hidden if empty', type: 'text' },
  { k: 'email', label: 'Main email', type: 'text' },
  { k: 'school_email', label: 'School email', type: 'text' },
  { k: 'show_school_email', label: 'Show school email', type: 'bool' },
  { k: 'intro', label: 'Text above the contact buttons', type: 'textarea', rows: 3 },
];

// ---------- theme ----------
export const FONTS = {
  inter: { label: 'Inter (clean sans)', css: "'Inter', system-ui, sans-serif", gf: 'Inter:wght@400;500;600;700;800' },
  poppins: { label: 'Poppins (friendly)', css: "'Poppins', system-ui, sans-serif", gf: 'Poppins:wght@400;500;600;700' },
  grotesk: { label: 'Space Grotesk (modern)', css: "'Space Grotesk', system-ui, sans-serif", gf: 'Space+Grotesk:wght@400;500;600;700' },
  playfair: { label: 'Playfair Display + Inter (editorial)', css: "'Inter', system-ui, sans-serif", head: "'Playfair Display', Georgia, serif", gf: 'Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800' },
  merri: { label: 'Merriweather (classic serif)', css: "'Merriweather', Georgia, serif", gf: 'Merriweather:wght@400;700;900' },
  system: { label: 'System default (fastest)', css: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", gf: '' },
};
export const DEFAULT_THEME = {
  mode: 'light', accent: '#2563eb', accent2: '#7c3aed', font: 'inter', radius: 'rounded', cards: 'elevated', density: 'comfy',
  bg: { type: 'default', color: '#f8fafc', color2: '#e0e7ff', angle: 160, image_url: '', overlay: 0.45 },
};

function hexRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function lum([r, g, b]) { return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

export function applyTheme(t) {
  t = { ...DEFAULT_THEME, ...(t || {}), bg: { ...DEFAULT_THEME.bg, ...((t || {}).bg || {}) } };
  const root = document.documentElement;
  let mode = t.mode === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t.mode;
  const bg = t.bg;
  let pageBg = '';
  if (bg.type === 'color') { mode = lum(hexRgb(bg.color)) < 0.5 ? 'dark' : 'light'; pageBg = bg.color; }
  else if (bg.type === 'gradient') { const l = (lum(hexRgb(bg.color)) + lum(hexRgb(bg.color2))) / 2; mode = l < 0.5 ? 'dark' : 'light'; pageBg = `linear-gradient(${+bg.angle || 160}deg, ${bg.color}, ${bg.color2})`; }
  else if (bg.type === 'image' && bg.image_url) { const o = Math.min(0.92, Math.max(0, +bg.overlay || 0)); const c = mode === 'dark' ? '0,0,0' : '255,255,255'; pageBg = `linear-gradient(rgba(${c},${o}), rgba(${c},${o})), url("${String(bg.image_url).replace(/"/g, '%22')}") center/cover fixed no-repeat`; }
  root.dataset.mode = mode;
  root.dataset.radius = t.radius; root.dataset.cards = t.cards; root.dataset.density = t.density;
  root.dataset.bg = bg.type === 'image' && !bg.image_url ? 'default' : bg.type;
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent2', t.accent2);
  const ar = hexRgb(t.accent); root.style.setProperty('--accent-rgb', ar.join(','));
  root.style.setProperty('--on-accent', lum(ar) > 0.62 ? '#111827' : '#ffffff');
  if (pageBg) root.style.setProperty('--page-bg', pageBg); else root.style.removeProperty('--page-bg');
  const f = FONTS[t.font] || FONTS.inter;
  root.style.setProperty('--font', f.css); root.style.setProperty('--font-head', f.head || f.css);
  let link = document.getElementById('gfont');
  if (f.gf) { const href = `https://fonts.googleapis.com/css2?family=${f.gf}&display=swap`; if (!link) { link = document.createElement('link'); link.id = 'gfont'; link.rel = 'stylesheet'; document.head.appendChild(link); } if (link.href !== href) link.href = href; }
  else if (link) link.remove();
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = mode === 'dark' ? '#0b1020' : '#ffffff';
}

export function sectionOrder(sections) {
  const o = (sections && sections.order) || [];
  const out = o.filter((k) => DEFAULT_ORDER.includes(k));
  DEFAULT_ORDER.forEach((k) => { if (!out.includes(k)) out.push(k); });
  return out;
}
export function sectionMeta(sections, key) {
  const m = ((sections && sections.meta) || {})[key] || {};
  return { title: m.title || SECTION_DEFAULTS[key].title, nav: SECTION_DEFAULTS[key].nav, visible: m.visible !== false };
}
