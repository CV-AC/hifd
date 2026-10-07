/* HiFDScore leaderboard: render, sort, filter, profile toggle, expand row. */
(() => {
  'use strict';

  const PROFILES = ['Balanced', 'PrivacyFirst', 'Clinical'];
  const NUMERIC_KEYS = ['privacy','quality','U1','U2','U3','HiFD'];

  const state = {
    entries: [],
    profile: 'Balanced',
    paradigms: new Set(['adversarial','gan','diffusion','other']),
    verifiedOnly: false,
    sortKey: 'HiFD',
    sortDir: 'desc',
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const fmt = (v) => v == null ? '—' : v.toFixed(3);

  function hifdValue(e, profile) {
    return e.scores[`HiFD_${profile}`];
  }

  function rowValue(e, key, profile) {
    if (key === 'rank') return e[`rank_${profile}`];
    if (key === 'method') return e.method.toLowerCase();
    if (key === 'paradigm') return e.paradigm;
    if (key === 'verified') return e.verified ? 1 : 0;
    if (key === 'HiFD') return hifdValue(e, profile);
    const v = e.scores[key];
    return v == null ? -Infinity : v;
  }

  function visibleEntries() {
    return state.entries
      .filter(e => state.paradigms.has(e.paradigm))
      .filter(e => !state.verifiedOnly || e.verified);
  }

  function sortedEntries() {
    const dir = state.sortDir === 'asc' ? 1 : -1;
    return visibleEntries().sort((a, b) => {
      const va = rowValue(a, state.sortKey, state.profile);
      const vb = rowValue(b, state.sortKey, state.profile);
      if (va < vb) return -1 * dir;
      if (va > vb) return  1 * dir;
      return a.method.localeCompare(b.method);
    });
  }

  function paradigmTag(p) {
    const label = { adversarial:'Adv', gan:'GAN', diffusion:'Diff', other:'Other' }[p] || p;
    return `<span class="paradigm-tag ${p}">${label}</span>`;
  }

  function expandedRow(e) {
    const subKeys = [
      ['Age','age'], ['Gender','gender'], ['Ethnicity','ethnicity'],
      ['Macro-Exp','macro_exp'], ['Landmark','landmark'],
      ['Gaze','gaze'], ['Micro-Exp','micro_exp'],
      ['BVP','bvp'], ['HR','hr'],
    ];
    const bars = subKeys.map(([label, k]) => {
      const v = e.scores[k];
      const w = v == null ? 0 : Math.round(v * 100);
      return `
        <div>${label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
        <div>${fmt(v)}</div>`;
    }).join('');
    const venue = `${e.venue} · ${e.year}`;
    return `
      <tr class="lb-expand-row"><td colspan="10" class="lb-expand">
        <div class="bars">${bars}</div>
        <p style="margin-top:.75rem;">
          <a href="${e.paper}">Paper ↗</a> ·
          <a href="${e.code}">Code ↗</a> ·
          ${venue}${e.notes ? ` · ${e.notes}` : ''}
        </p>
      </td></tr>`;
  }

  function render() {
    const tbody = $('#lb tbody');
    const rows = sortedEntries();
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="lb-status">No methods match the current filters.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((e, i) => {
      const cls = (state.sortKey === 'HiFD' && state.sortDir === 'desc' && i === 0) ? ' class="top"' : '';
      return `
        <tr data-method="${e.method}"${cls}>
          <td>${i + 1}</td>
          <td>${e.method}</td>
          <td>${paradigmTag(e.paradigm)}</td>
          <td>${fmt(e.scores.privacy)}</td>
          <td>${fmt(e.scores.quality)}</td>
          <td>${fmt(e.scores.U1)}</td>
          <td>${fmt(e.scores.U2)}</td>
          <td>${fmt(e.scores.U3)}</td>
          <td><strong>${fmt(hifdValue(e, state.profile))}</strong></td>
          <td>${e.verified ? '<span class="verified" title="Verified by maintainers">✓</span>' : ''}</td>
        </tr>`;
    }).join('');
  }

  function bindHeaders() {
    $$('#lb thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
        } else {
          state.sortKey = key;
          state.sortDir = (key === 'method' || key === 'paradigm') ? 'asc' : 'desc';
        }
        $$('#lb thead th').forEach(t => t.classList.remove('sorted','asc'));
        th.classList.add('sorted');
        if (state.sortDir === 'asc') th.classList.add('asc');
        render();
      });
    });
  }

  function bindControls() {
    $$('input[name="profile"]').forEach(el => {
      el.addEventListener('change', () => { state.profile = el.value; render(); });
    });
    $$('input[name="paradigm"]').forEach(el => {
      el.addEventListener('change', () => {
        if (el.checked) state.paradigms.add(el.value);
        else state.paradigms.delete(el.value);
        render();
      });
    });
    $('input[name="verified-only"]').addEventListener('change', (e) => {
      state.verifiedOnly = e.target.checked;
      render();
    });
  }

  function bindRowExpand() {
    $('#lb tbody').addEventListener('click', (ev) => {
      const tr = ev.target.closest('tr[data-method]');
      if (!tr) return;
      const next = tr.nextElementSibling;
      if (next && next.classList.contains('lb-expand-row')) {
        next.remove();
        return;
      }
      const method = tr.dataset.method;
      const entry = state.entries.find(e => e.method === method);
      if (!entry) return;
      tr.insertAdjacentHTML('afterend', expandedRow(entry));
    });
  }

  function bindSubmitDialog() {
    const dlg = $('#submit-dialog');
    const tmpl = {
      method: "MyMethod",
      paradigm: "diffusion",
      year: 2026,
      venue: "CVPR 2026",
      paper: "https://arxiv.org/abs/2601.12345",
      code:  "https://github.com/user/repo",
      contact: "you@example.org",
      submitted_at: "2026-09-30",
      verified: false,
      scores: {
        privacy: 0.50, quality: 0.45,
        age: 0.90, gender: 0.90, ethnicity: 0.80,
        macro_exp: 0.90, landmark: 0.80,
        gaze: 0.90, micro_exp: 0.70,
        bvp: 0.40, hr: 0.40,
        U1: 0.86, U2: 0.80, U3: 0.40,
        HiFD_PrivacyFirst: 0.50, HiFD_Balanced: 0.55, HiFD_Clinical: 0.50
      }
    };
    $('#template-json').textContent = JSON.stringify(tmpl, null, 2);
    $('#submit-btn').addEventListener('click', () => dlg.showModal());
  }

  function bindBibtexCopy() {
    $$('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tgt = $('#' + btn.dataset.target);
        await navigator.clipboard.writeText(tgt.textContent);
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  }

  async function load() {
    bindHeaders(); bindControls(); bindRowExpand();
    bindSubmitDialog(); bindBibtexCopy();
    try {
      const res = await fetch('./data/leaderboard.json', { cache: 'no-cache' });
      const payload = await res.json();
      state.entries = payload.entries || [];
      const dt = payload.generated_at ? payload.generated_at.slice(0,10) : '—';
      const upd = $('#lb-updated');
      if (upd) upd.textContent = dt;
      const cnt = $('#lb-count');
      if (cnt) cnt.textContent = String(state.entries.length);
      render();
    } catch (err) {
      $('#lb tbody').innerHTML =
        `<tr><td colspan="10" class="lb-error">Failed to load leaderboard: ${err.message}</td></tr>`;
      console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
