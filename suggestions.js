// Suggestion box backed by Firebase (Firestore + anonymous sign-in).
// No accounts needed: each browser gets an invisible anonymous id so people
// can remove their own ideas. Config lives in firebase-config.js.
(function () {
  const sheet = document.getElementById('sheet');
  const openBtn = document.getElementById('open-sheet');
  const closeBtn = document.getElementById('close-sheet');
  const form = document.getElementById('suggest-form');
  const idea = document.getElementById('idea');
  const who = document.getElementById('who');
  const area = document.getElementById('area');
  const submit = document.getElementById('submit');
  const status = document.getElementById('status');
  const list = document.getElementById('list');
  const count = document.getElementById('count');

  function toggle(open) {
    sheet.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    if (open) idea.focus({ preventScroll: true });
  }
  openBtn.addEventListener('click', () => toggle(sheet.hidden));
  closeBtn.addEventListener('click', () => toggle(false));

  function readOnly(msg) {
    submit.disabled = true; idea.disabled = true; area.disabled = true; who.disabled = true;
    status.textContent = msg;
  }

  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey || !window.firebase) {
    readOnly('The suggestion box is not connected yet. Check back soon.');
    return;
  }

  firebase.initializeApp(cfg);
  const auth = firebase.auth();
  const fs = firebase.firestore();
  const col = fs.collection('suggestions');
  let myId = null, docs = [];

  try {
    const saved = localStorage.getItem('npwj-name');
    if (saved) who.value = saved;
  } catch (e) {}

  function fmt(d) {
    try { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (e) { return ''; }
  }

  function render() {
    count.textContent = String(docs.length);
    list.replaceChildren();
    if (!docs.length) {
      const p = document.createElement('p'); p.className = 'empty';
      p.textContent = 'No suggestions yet. Add the first one above.';
      list.append(p); return;
    }
    docs.forEach(d => {
      const v = d.data({ serverTimestamps: 'estimate' });
      const li = document.createElement('li'); li.className = 'item';
      const text = document.createElement('p'); text.className = 'text'; text.textContent = v.text || '';
      const meta = document.createElement('div'); meta.className = 'meta';
      const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = v.area || 'Other';
      meta.append(tag);
      if (v.status === 'in-model') {
        const t2 = document.createElement('span'); t2.className = 'tag in-model'; t2.textContent = 'In the model'; meta.append(t2);
      }
      const by = document.createElement('span');
      const when = v.createdAt && v.createdAt.toDate ? ' · ' + fmt(v.createdAt.toDate()) : '';
      by.textContent = (v.name || 'A teammate') + when;
      meta.append(by);
      li.append(text, meta);
      if (myId && v.authorId === myId) {
        const actions = document.createElement('div'); actions.className = 'actions';
        const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Remove mine';
        let armed = false;
        del.addEventListener('click', async () => {
          if (!armed) {
            armed = true; del.textContent = 'Tap again to remove';
            setTimeout(() => { armed = false; del.textContent = 'Remove mine'; }, 3000);
            return;
          }
          del.disabled = true;
          try { await col.doc(d.id).delete(); }
          catch (e) { status.textContent = 'Could not remove that suggestion.'; del.disabled = false; }
        });
        actions.append(del);
        li.append(actions);
      }
      list.append(li);
    });
  }

  idea.addEventListener('input', () => { submit.disabled = !myId || idea.value.trim().length < 3; });

  auth.onAuthStateChanged(u => {
    myId = u ? u.uid : null;
    if (u) { status.textContent = ''; submit.disabled = idea.value.trim().length < 3; }
    render();
  });
  status.textContent = 'Connecting to the suggestion box…';
  auth.signInAnonymously().catch(() => {
    readOnly('Could not connect to the suggestion box. Reload the page to try again.');
  });

  col.orderBy('createdAt', 'desc').limit(300).onSnapshot(
    snap => { docs = snap.docs; render(); },
    () => { status.textContent = 'The suggestion list could not load. Reload the page to try again.'; }
  );

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = idea.value.trim();
    const name = who.value.trim().slice(0, 40);
    if (!myId || text.length < 3) return;
    submit.disabled = true; status.textContent = 'Saving…';
    const data = {
      text: text.slice(0, 500),
      area: area.value,
      authorId: myId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'new',
    };
    if (name) data.name = name;
    try {
      await col.add(data);
      try { localStorage.setItem('npwj-name', name); } catch (err) {}
      idea.value = ''; status.textContent = 'Added. Thanks for the idea!';
    } catch (err) {
      status.textContent = err && err.code === 'permission-denied'
        ? 'That idea could not be saved. Keep it between 3 and 500 characters.'
        : 'That did not save. Try again in a moment.';
      submit.disabled = false;
    }
  });
})();
