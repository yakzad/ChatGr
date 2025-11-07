import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyByrOeXA8JobmukItt1rafgCroAciHpwcM",
  authDomain: "chatgr-6ec4e.firebaseapp.com",
  projectId: "chatgr-6ec4e",
  storageBucket: "chatgr-6ec4e.firebasestorage.app",
  messagingSenderId: "937292188482",
  appId: "1:937292188482:web:3a6302fb9271a0ed95d6db"
};


const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const byId = (id) => document.getElementById(id);


const authView       = byId('authView');
const chatView       = byId('chatView');
const emailEl        = byId('email');
const passEl         = byId('password');
const btnSignup      = byId('btnSignup');
const btnLogin       = byId('btnLogin');
const btnLogout      = byId('btnLogout');
const authError      = byId('authError');
const messages       = byId('messages');
const messageInput   = byId('messageInput');
const sendBtn        = byId('sendBtn');
const chatHeaderName = byId('chatHeaderName');
const infoBtn        = byId('contactInfoBtn');
const infoPanel      = byId('contactInfoPanel');
const emojiBtn       = byId('emojiBtn');
const emojiPanel     = byId('emojiPanel');
const listEl         = byId('contactList');
const searchInput    = byId('chatSearch');
const enterChatBtn   = byId('enterChatbtn');

let CONTACTS_CACHE = [];
let unsubscribeMsgs = null;
let CURRENT_PEER_UID = null;
const chatIdFor = (a,b) => [a,b].sort().join('_');

btnSignup?.addEventListener('click', signup);
btnLogin ?.addEventListener('click', login);
btnLogout?.addEventListener('click', () => signOut(auth));
btnLogout?.addEventListener('click', () => signOut(auth));


async function ensureUserProfile(user) {
  if (!user) return;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email || null,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });
}

async function signup() {
  const email = (emailEl?.value || '').trim();
  const pass  = passEl?.value || '';
  const cred  = await createUserWithEmailAndPassword(auth, email, pass);
  await ensureUserProfile(cred.user); 
}

async function login() {
  const email = (emailEl?.value || '').trim();
  const pass  = passEl?.value || '';
  await signInWithEmailAndPassword(auth, email, pass);
}

function showAuthError(e) {
  if (!authError) return;
  authError.textContent = e?.message ?? 'Auth error';
  authError.classList.remove('hidden');
}

onAuthStateChanged(auth, async (u) => {
  try {
    authView?.classList.toggle('hidden', !!u);
    chatView?.classList.toggle('hidden', !u);
    if (u) {
      chatHeaderName && (chatHeaderName.textContent = u.email || 'Chat');
      await ensureUserProfile(u);
      listenForContacts();
      messages && (messages.innerHTML = '');
      if (CONTACTS?.length) openChatFor(CONTACTS[0].id);

  } else {
    messages && (messages.innerHTML = '');
    CURRENT_PEER_UID = null;
    if (unsubscribeMsgs) { unsubscribeMsgs(); unsubscribeMsgs = null; }
  }
  } catch (e) {
    showAuthError(e);
  }
});

sendBtn?.addEventListener('click', sendMessageFirebase);
messageInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessageFirebase(); }
});

async function sendMessageFirebase() {
  try {
    const text = (messageInput?.value || '').trim();
    const me = auth.currentUser;
    if (!me || !text) return;
    if (!CURRENT_PEER_UID) { alert("Selecciona un contacto para chatear"); return; }
    const cid = chatIdFor(me.uid, CURRENT_PEER_UID);
    await setDoc(doc(db, "chats", cid), {
      members: [me.uid, CURRENT_PEER_UID].sort(),
      updatedAt: serverTimestamp(),
      lastMessage: text
    }, { merge: true });
    await addDoc(collection(db, "chats", cid, "messages"), {
      senderId: me.uid,
      text,
      createdAt: serverTimestamp()
    });
    messageInput.value = '';
  } catch (e) {
    console.error(e);
    alert(e?.message || 'send error');
  }
}


emojiBtn?.addEventListener("click", () => {
  emojiPanel?.classList.toggle("visible");
});
emojiPanel?.addEventListener("click", (e) => {
  const t = e.target;
  if (t?.classList?.contains("emoji") && messageInput) {
    messageInput.value += t.textContent;
  }
});



function listenForContacts() {
  const me = auth.currentUser;
  if (!me) return;

  const qUsers = query(collection(db, "users"), orderBy("email"));
  onSnapshot(qUsers, (snap) => {
    const users = [];
    snap.forEach((d) => {
      const u = d.data();
      if (u.uid !== me.uid) {
        users.push({
          id: u.uid,
          name: u.displayName || (u.email ? u.email.split("@")[0] : "User"),
          phone: u.phone || "N/A",
          status: u.status || "Online",
        });
      }
    });
    CONTACTS_CACHE = users;
    renderContacts(CONTACTS_CACHE);
  });
}

function renderContacts(list) {
  if (!listEl) return;
  if (!list?.length) {
    listEl.innerHTML = '<div class="emptyResults">No GrFriends found</div>';
    return;
  }
  listEl.innerHTML = list
    .map(c => `<button class="contact" data-id="${c.id}" type="button">${c.name}</button>`)
    .join('');
}

function searchContacts() {
  if (!searchInput) return;
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { renderContacts(CONTACTS_CACHE); return; }
  renderContacts(CONTACTS_CACHE.filter(c => c.name.toLowerCase().includes(q)));
}

enterChatBtn?.addEventListener('click', searchContacts);
searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchContacts(); });
searchInput?.addEventListener('input', searchContacts);

listEl?.addEventListener('click', (e) => {
  const btn = e.target.closest?.('.contact');
  if (!btn) return;
  const c = CONTACTS_CACHE.find(x => x.id === btn.dataset.id);
  if (!c) return;

  if (infoPanel) {
    infoPanel.innerHTML = `
      <p><strong>Name:</strong> ${c.name}</p>
      <p><strong>Status:</strong> ${c.status}</p>
      <p><strong>Phone:</strong> ${c.phone}</p>
    `;
  }

  openChatFor(c.id);
});




function openChatFor(peerId) {
  const me = auth.currentUser;
  if (!me) return;
  CURRENT_PEER_UID = peerId;
  if (unsubscribeMsgs) { unsubscribeMsgs(); unsubscribeMsgs = null; }
  const cid = chatIdFor(me.uid, peerId);
  const qMsg = query(collection(db, 'chats', cid, 'messages'), orderBy('createdAt', 'asc'));
  unsubscribeMsgs = onSnapshot(qMsg, (snap) => {
    if (!messages) return;
    messages.innerHTML = '';
    snap.forEach(docSnap => {
      const m = docSnap.data();
      const div = document.createElement('div');
      div.className = (m.senderId === me.uid) ? 'msg me' : 'msg';
      div.textContent = m.text;
      messages.appendChild(div);
    });
    messages.scrollTop = messages.scrollHeight;
  });
}

