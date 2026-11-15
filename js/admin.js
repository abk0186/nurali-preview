import { SB_URL, SB_KEY, BUCKET, publicUrlBase, esc, KINDS, PROFILE_FIELDS, CONTACT_FIELDS, FONTS, DEFAULT_THEME, DEFAULT_ORDER, SECTION_DEFAULTS, applyTheme, sectionOrder, sectionMeta, rest } from './shared.js';

const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
const $ = (s) => document.querySelector(s);
let S = {}; let ITEMS = []; let tab = 'profile'; let me = null;

const TABS = [['profile', 'Profile & About'], ['contact', 'Contact'], ['|'], ...Object.entries(KINDS).map(([k, v]) => [k, v.label]), ['|'], ['appearance', 'Appearance'], ['sections', 'Sections'], ['account', 'Account']];

function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (err ? ' err' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = 'toast'), err ? 5000 : 2200); }
const fail = (e) => { console.error(e); toast(e.message || String(e), true); };

// ---------- auth ----------
async function boot() {
  const { data } = await sb.auth.getSession();
  if (data.session) await enter(data.session); else showLogin();
}
function showLogin() { $('#login').hidden = false; $('#app').hidden = true; }
async function enter(session) {
  const { data: ok, error } = await sb.rpc('is_admin');
  if (error || !ok) { await sb.auth.signOut(); showLogin(); $('#lerr').textContent = 'This account is not an administrator.'; return; }
  me = session.user; $('#login').hidden = true; $('#app').hidden = false;
  await loadAll(); renderTabs(); renderPanel();
}
$('#lf').addEventListener('submit', async (e) => {
  e.preventDefault(); $('#lerr').textContent = ''; $('#lbtn').disabled = true;
  const { data, error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
  $('#lbtn').disabled = false;
  if (error) { $('#lerr').textContent = error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message; return; }
  await enter(data.session);
});
$('#so').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });

async function loadAll() {
  const [a, b] = await Promise.all([sb.from('settings').select('key,value'), sb.from('items').select('*').order('position').order('created_at')]);
  if (a.error) return fail(a.error); if (b.error) return fail(b.error);
  S = {}; a.data.forEach((r) => (S[r.key] = r.value)); ITEMS = b.data;
  applyTheme(S.theme);
}
async function saveSetting(key, value) {
  const { error } = await sb.from('settings').upsert({ key, value }); if (error) return fail(error);
  S[key] = value; toast('Saved ✓');
}

// ---------- tabs ----------
function renderTabs() {
  $('#tabs').innerHTML = TABS.map((t) => (t[0] === '|' ? '<span class="sep"></span>' : `<button data-t="${t[0]}" class="${t[0] === tab ? 'on' : ''}">${esc(t[1])}</button>`)).join('');
}
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-t]'); if (!b) return; tab = b.dataset.t; renderTabs(); renderPanel(); window.scrollTo(0, 0); });
function renderPanel() {
  const p = $('#panel');
  if (tab === 'profile') return formPanel(p, 'Profile & About', 'Name, tagline, About text and photo. Texts here appear on the public site.', PROFILE_FIELDS, 'profile');
  if (tab === 'contact') return formPanel(p, 'Contact', 'Buttons at the bottom of the site. Leave a field empty to hide its button.', CONTACT_FIELDS, 'contact');
  if (KINDS[tab]) return listPanel(p, tab);
  if (tab === 'appearance') return appearancePanel(p);
  if (tab === 'sections') return sectionsPanel(p);
  if (tab === 'account') return accountPanel(p);
}

// ---------- generic fields ----------
function fieldHtml(f, v) {
  const id = 'f_' + f.k; const lab = `<label for="${id}">${esc(f.label)}${f.req ? ' *' : ''}</label>`;
  if (f.type === 'textarea') return `<div class="f">${lab}<textarea id="${id}" data-k="${f.k}" rows="${f.rows || 4}" placeholder="${esc(f.ph || '')}">${esc(v ?? '')}</textarea></div>`;
  if (f.type === 'select') return `<div class="f">${lab}<select id="${id}" data-k="${f.k}">${f.options.map((o) => `<option value="${esc(o)}" ${o === (v ?? '') ? 'selected' : ''}>${esc(o || '—')}</option>`).join('')}</select></div>`;
  if (f.type === 'bool') return `<div class="f"><label class="chk"><input type="checkbox" id="${id}" data-k="${f.k}" ${v !== false && v !== undefined && v !== '' ? 'checked' : ''}> ${esc(f.label)}</label></div>`;
  if (f.type === 'file' || f.type === 'image') return `<div class="f">${lab}<div class="fileb" data-file="${f.k}" data-type="${f.type}"><input type="hidden" data-k="${f.k}" value="${esc(v || '')}"><div class="pv"></div><div class="nm"></div><label class="abtn sm">Choose…<input type="file" hidden accept="${f.type === 'image' ? 'image/*' : 'application/pdf,image/*'}"></label><button type="button" class="abtn sm danger rm">Remove</button></div></div>`;
  return `<div class="f">${lab}<input id="${id}" data-k="${f.k}" type="${f.type === 'url' ? 'url' : 'text'}" value="${esc(v ?? '')}" placeholder="${esc(f.ph || '')}" autocomplete="off"></div>`;
}
function bindFiles(root, folder) {
  root.querySelectorAll('.fileb').forEach((box) => {
    const hid = box.querySelector('input[type=hidden]'); const nm = box.querySelector('.nm'); const pv = box.querySelector('.pv');
    const paint = () => { const u = hid.value; nm.textContent = u ? decodeURIComponent(u.split('/').pop()) : 'No file'; pv.innerHTML = u && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u) ? `<img src="${esc(u)}" alt="">` : ''; box.querySelector('.rm').style.display = u ? '' : 'none'; };
    paint();
    box.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return; nm.textContent = 'Uploading…';
      try { const old = hid.value; hid.value = await uploadFile(f, folder); removeStored(old); } catch (er) { fail(er); }
      paint(); e.target.value = '';
    });
    box.querySelector('.rm').addEventListener('click', () => { removeStored(hid.value); hid.value = ''; paint(); });
  });
}
function readForm(root, fields) {
  const o = {};
  fields.forEach((f) => { const el = root.querySelector(`[data-k="${f.k}"]`); if (!el) return; o[f.k] = f.type === 'bool' ? el.checked : el.value.trim(); });
  return o;
}

// ---------- storage ----------
async function compress(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 350 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file); const max = 2200; const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch (e) { return file; }
}
async function uploadFile(file, folder) {
  file = await compress(file);
  if (file.size > 12 * 1024 * 1024) throw new Error('File is larger than 12 MB');
  if (!/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.type)) throw new Error('Allowed: PDF, JPG, PNG, WEBP, GIF');
  const ext = (file.name.match(/\.(\w+)$/) || [, 'bin'])[1].toLowerCase();
  const base = file.name.replace(/\.\w+$/, '').normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'file';
  const path = `${folder}/${Date.now().toString(36)}-${base}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  return publicUrlBase + path;
}
function removeStored(url) { if (url && url.startsWith(publicUrlBase)) sb.storage.from(BUCKET).remove([decodeURIComponent(url.slice(publicUrlBase.length))]).catch(() => {}); }

// ---------- profile/contact forms ----------
function formPanel(p, title, hint, fields, key) {
  p.innerHTML = `<h2>${title}</h2><p class="hint">${hint}</p><div id="ff">${fields.map((f) => fieldHtml(f, (S[key] || {})[f.k])).join('')}</div><button class="abtn pri" id="sv">Save</button>`;
  bindFiles(p, key);
  $('#sv').onclick = async () => { $('#sv').disabled = true; await saveSetting(key, { ...(S[key] || {}), ...readForm(p, fields) }); $('#sv').disabled = false; };
}

// ---------- item lists ----------
const kindItems = (kind) => ITEMS.filter((i) => i.section === kind).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
function listPanel(p, kind) {
  const K = KINDS[kind]; const list = kindItems(kind);
  const extra = kind === 'photos' ? `<label class="abtn pri">Upload photos<input type="file" id="multi" multiple accept="image/*" hidden></label>` : '';
  p.innerHTML = `<h2>${esc(K.label)}</h2><p class="hint">Add, edit, hide, reorder or delete items. Changes go live immediately.</p>
   <div class="row"><button class="abtn pri" id="add">+ Add</button>${extra}</div>
   <div class="list">${list.length ? list.map((it, i) => `<div class="it ${it.visible ? '' : 'off'}" data-id="${it.id}">${kind === 'photos' && it.data.image_url ? `<img src="${esc(it.data.image_url)}" style="width:48px;height:48px;object-fit:cover;border-radius:8px" alt="">` : ''}<div class="t"><b>${esc(it.data[K.title] || '(untitled)')}</b><span>${esc((K.sub && it.data[K.sub]) || '')}</span></div><div class="acts"><button class="abtn sm" data-a="up" ${i === 0 ? 'disabled' : ''}>↑</button><button class="abtn sm" data-a="down" ${i === list.length - 1 ? 'disabled' : ''}>↓</button><button class="abtn sm" data-a="vis">${it.visible ? 'Hide' : 'Show'}</button><button class="abtn sm" data-a="edit">Edit</button><button class="abtn sm danger" data-a="del">Delete</button></div></div>`).join('') : '<div class="empty">Nothing here yet.</div>'}</div>`;
  $('#add').onclick = () => editItem(kind, null);
  const multi = $('#multi'); if (multi) multi.onchange = async (e) => {
    toast('Uploading…'); let n = 0;
    for (const f of e.target.files) { try { const u = await uploadFile(f, 'photos'); await insertItem('photos', { image_url: u, caption: '' }); n++; } catch (er) { fail(er); } }
    await loadAll(); renderPanel(); toast(`${n} photo(s) added ✓`);
  };
  p.querySelectorAll('.it [data-a]').forEach((b) => (b.onclick = () => itemAction(kind, b.closest('.it').dataset.id, b.dataset.a)));
}
async function insertItem(kind, data) {
  const max = Math.max(-10, ...ITEMS.filter((i) => i.section === kind).map((i) => i.position));
  const { error } = await sb.from('items').insert({ section: kind, data, position: max + 10 }); if (error) throw error;
}
async function itemAction(kind, id, a) {
  const it = ITEMS.find((i) => i.id === id);
  try {
    if (a === 'edit') return editItem(kind, it);
    if (a === 'vis') { const { error } = await sb.from('items').update({ visible: !it.visible }).eq('id', id); if (error) throw error; }
    if (a === 'del') {
      if (!confirm('Delete this item? This cannot be undone.')) return;
      const { error } = await sb.from('items').delete().eq('id', id); if (error) throw error;
      KINDS[kind].fields.filter((f) => f.type === 'file' || f.type === 'image').forEach((f) => removeStored(it.data[f.k]));
    }
    if (a === 'up' || a === 'down') {
      const l = kindItems(kind); const i = l.findIndex((x) => x.id === id); const j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= l.length) return;
      [l[i], l[j]] = [l[j], l[i]];
      for (let n = 0; n < l.length; n++) { if (l[n].position !== n * 10) { const { error } = await sb.from('items').update({ position: n * 10 }).eq('id', l[n].id); if (error) throw error; } }
    }
    await loadAll(); renderPanel(); toast('Saved ✓');
  } catch (e) { fail(e); }
}
function openModal(html) { $('#mbox').innerHTML = html; $('#modal').classList.add('on'); }
function closeModal() { $('#modal').classList.remove('on'); }
$('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') closeModal(); });
function editItem(kind, it) {
  const K = KINDS[kind];
  openModal(`<h2 style="font-size:1.25rem;margin-bottom:14px">${it ? 'Edit' : 'Add'}: ${esc(K.label)}</h2><div id="mf">${K.fields.map((f) => fieldHtml(f, it ? it.data[f.k] : undefined)).join('')}</div><div class="row" style="margin-top:8px"><button class="abtn pri" id="msv">Save</button><button class="abtn" id="mcn">Cancel</button></div>`);
  bindFiles($('#mbox'), K.section === 'photography' ? 'photos' : kind);
  $('#mcn').onclick = closeModal;
  $('#msv').onclick = async () => {
    const data = readForm($('#mbox'), K.fields);
    const miss = K.fields.find((f) => f.req && !data[f.k]); if (miss) return toast(`Please fill: ${miss.label}`, true);
    $('#msv').disabled = true;
    try {
      if (it) { const { error } = await sb.from('items').update({ data }).eq('id', it.id); if (error) throw error; } else await insertItem(kind, data);
      closeModal(); await loadAll(); renderPanel(); toast('Saved ✓');
    } catch (e) { fail(e); $('#msv').disabled = false; }
  };
}

// ---------- appearance ----------
function appearancePanel(p) {
  const t = { ...DEFAULT_THEME, ...(S.theme || {}), bg: { ...DEFAULT_THEME.bg, ...((S.theme || {}).bg || {}) } };
  const sel = (id, label, opts, v) => `<div class="f"><label for="${id}">${label}</label><select id="${id}">${opts.map(([a, b]) => `<option value="${a}" ${a === v ? 'selected' : ''}>${b}</option>`).join('')}</select></div>`;
  const col = (id, label, v) => `<div class="f"><label for="${id}">${label}</label><input type="color" id="${id}" value="${esc(v)}"></div>`;
  const presets = [['#2563eb', '#7c3aed'], ['#0ea5e9', '#6366f1'], ['#059669', '#0ea5e9'], ['#e11d48', '#f97316'], ['#7c3aed', '#db2777'], ['#0f172a', '#475569'], ['#b45309', '#dc2626']];
  p.innerHTML = `<h2>Appearance</h2><p class="hint">Changes preview instantly on this page. Press “Save appearance” to publish them on the site.</p>
  ${sel('t_mode', 'Theme', [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto (follows the visitor’s device)']], t.mode)}
  <div class="f"><label>Color presets</label><div class="sw">${presets.map(([a, b], i) => `<button type="button" data-p="${i}" title="${a} → ${b}" style="background:linear-gradient(135deg,${a},${b})"></button>`).join('')}</div></div>
  <div class="grid2">${col('t_accent', 'Accent color', t.accent)}${col('t_accent2', 'Second accent (gradient)', t.accent2)}</div>
  ${sel('t_font', 'Font', Object.entries(FONTS).map(([k, v]) => [k, v.label]), t.font)}
  <div class="grid2">${sel('t_radius', 'Corners', [['sharp', 'Sharp'], ['rounded', 'Rounded'], ['pill', 'Very round']], t.radius)}${sel('t_cards', 'Card style', [['elevated', 'Shadow'], ['flat', 'Flat'], ['glass', 'Glass (best with image background)']], t.cards)}</div>
  ${sel('t_density', 'Spacing', [['comfy', 'Comfortable'], ['compact', 'Compact']], t.density)}
  <h3 style="margin:18px 0 10px">Background</h3>
  ${sel('b_type', 'Type', [['default', 'Default (follows theme)'], ['color', 'Solid color'], ['gradient', 'Gradient'], ['image', 'Uploaded image']], t.bg.type)}
  <p class="hint" style="margin-top:-6px">With a solid color or gradient, text color switches automatically between light and dark for readability.</p>
  <div class="grid2">${col('b_color', 'Color', t.bg.color)}${col('b_color2', 'Second color (gradient)', t.bg.color2)}</div>
  <div class="f"><label for="b_angle">Gradient angle: <span id="b_angle_v">${t.bg.angle}</span>°</label><input type="range" id="b_angle" min="0" max="360" value="${t.bg.angle}"></div>
  <div class="f"><label>Background image</label><div class="fileb" data-file="bgimg" data-type="image"><input type="hidden" data-k="bgimg" value="${esc(t.bg.image_url)}"><div class="pv"></div><div class="nm"></div><label class="abtn sm">Choose…<input type="file" hidden accept="image/*"></label><button type="button" class="abtn sm danger rm">Remove</button></div></div>
  <div class="f"><label for="b_over">Image fade (readability): <span id="b_over_v">${Math.round(t.bg.overlay * 100)}</span>%</label><input type="range" id="b_over" min="0" max="90" value="${Math.round(t.bg.overlay * 100)}"></div>
  <div class="row" style="margin-top:10px"><button class="abtn pri" id="tsv">Save appearance</button><button class="abtn" id="trs">Reset to default</button></div>`;
  bindFiles(p, 'background');
  const read = () => ({ mode: $('#t_mode').value, accent: $('#t_accent').value, accent2: $('#t_accent2').value, font: $('#t_font').value, radius: $('#t_radius').value, cards: $('#t_cards').value, density: $('#t_density').value, bg: { type: $('#b_type').value, color: $('#b_color').value, color2: $('#b_color2').value, angle: +$('#b_angle').value, image_url: p.querySelector('[data-k=bgimg]').value, overlay: +$('#b_over').value / 100 } });
  const live = () => { $('#b_angle_v').textContent = $('#b_angle').value; $('#b_over_v').textContent = $('#b_over').value; applyTheme(read()); };
  p.querySelectorAll('select,input').forEach((el) => { el.addEventListener('input', live); el.addEventListener('change', live); });
  p.querySelectorAll('.sw button').forEach((b) => (b.onclick = () => { const [a, c] = presets[b.dataset.p]; $('#t_accent').value = a; $('#t_accent2').value = c; live(); }));
  p.querySelector('.fileb input[type=file]').addEventListener('change', () => setTimeout(live, 1500));
  p.querySelector('.fileb .rm').addEventListener('click', () => setTimeout(live, 50));
  $('#tsv').onclick = () => saveSetting('theme', read());
  $('#trs').onclick = async () => { await saveSetting('theme', DEFAULT_THEME); applyTheme(DEFAULT_THEME); appearancePanel(p); };
}

// ---------- sections ----------
function sectionsPanel(p) {
  const sec = S.sections || {}; let order = sectionOrder(sec); const meta = JSON.parse(JSON.stringify(sec.meta || {}));
  const draw = () => {
    p.innerHTML = `<h2>Sections</h2><p class="hint">Rename, hide or reorder sections of the public site. Empty sections hide themselves automatically.</p><div class="list">${order.concat(['contact']).map((k, i) => { const m = { ...sectionMeta({ meta }, k) }; return `<div class="it" data-k="${k}"><div class="t"><input type="text" value="${esc(m.title)}" data-title placeholder="${esc(SECTION_DEFAULTS[k].title)}"></div><label class="chk"><input type="checkbox" data-vis ${m.visible ? 'checked' : ''}> show</label>${k !== 'contact' ? `<div class="acts"><button class="abtn sm" data-mv="-1" ${i === 0 ? 'disabled' : ''}>↑</button><button class="abtn sm" data-mv="1" ${i === order.length - 1 ? 'disabled' : ''}>↓</button></div>` : '<div class="acts" style="min-width:76px"></div>'}</div>`; }).join('')}</div><button class="abtn pri" id="ssv">Save sections</button>`;
    const sync = () => p.querySelectorAll('.it').forEach((r) => { const k = r.dataset.k; meta[k] = { title: r.querySelector('[data-title]').value.trim() || SECTION_DEFAULTS[k].title, visible: r.querySelector('[data-vis]').checked }; });
    p.querySelectorAll('[data-mv]').forEach((b) => (b.onclick = () => { sync(); const k = b.closest('.it').dataset.k; const i = order.indexOf(k); const j = i + +b.dataset.mv; [order[i], order[j]] = [order[j], order[i]]; draw(); }));
    $('#ssv').onclick = () => { sync(); saveSetting('sections', { order, meta }); };
  };
  draw();
}

// ---------- account ----------
function accountPanel(p) {
  p.innerHTML = `<h2>Account</h2><p class="hint">Signed in as <b>${esc(me && me.email)}</b>.</p>
  <h3 style="margin:10px 0">Change password</h3>
  <div class="f"><label for="np">New password (min. 8 characters)</label><input type="password" id="np" autocomplete="new-password"></div>
  <div class="f"><label for="np2">Repeat password</label><input type="password" id="np2" autocomplete="new-password"></div>
  <button class="abtn pri" id="cp">Change password</button>
  <p class="hint" style="margin-top:22px">Your public site is open to everyone with the link. Only this admin login can change content and files.</p>`;
  $('#cp').onclick = async () => {
    const a = $('#np').value; if (a.length < 8) return toast('Password must be at least 8 characters', true); if (a !== $('#np2').value) return toast('Passwords do not match', true);
    const { error } = await sb.auth.updateUser({ password: a }); if (error) return fail(error); $('#np').value = $('#np2').value = ''; toast('Password changed ✓');
  };
}

boot().catch(fail);
