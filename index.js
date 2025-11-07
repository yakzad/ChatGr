
const $ = (id) => document.getElementById(id);
const showError = (msg, color="#d33") => {
  const el = $("authError");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  el.style.color = color;
};



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

document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = $("btnLogin");
  console.log("[ChatGr] binding btnLogin =", !!btnLogin);
  if (btnLogin) btnLogin.addEventListener("click", onLogin);
});


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
const infoPanel = (typeof byId === "function" ? byId : (id)=>document.getElementById(id))('contactInfoPanel');
let activeFriendUid = null;
const emojiBtn       = byId('emojiBtn');
const emojiPanel     = byId('emojiPanel');
const listEl         = byId('contactList');
const searchInput    = byId('chatSearch');
const enterChatBtn   = byId('enterChatbtn');


function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


document.addEventListener('click', (e) => {
  if (!emojiPanel?.classList.contains('visible')) return;
  const insidePanel = e.target.closest('#emojiPanel');
  const onButton    = e.target.closest('#emojiBtn');
  if (!insidePanel && !onButton) emojiPanel.classList.remove('visible');
});

function updateHeaderWithFriend(friend) {
  chatHeaderName.textContent = friend.displayName || friend.email || "GrFriend";

  infoBtn.textContent = "ⓘ";

  infoPanel.innerHTML = `
    <div class="friendHeader">
      <img class="avatar" src="${friend.photoURL || 'img/default-avatar.png'}" alt="">
      <div class="meta">
        <div class="name">${friend.displayName || friend.email || ''}</div>
        <div class="email">${friend.email || ''}</div>
        <div class="status">${friend.statusMessage || ''}</div>
      </div>
    </div>
  `;
}


let CONTACTS_CACHE = [];
let unsubscribeMsgs = null;
let CURRENT_PEER_UID = null;
const chatIdFor = (a,b) => [a,b].sort().join('_');

async function ensureChatExists(myUid, peerUid) {
  const cid = chatIdFor(myUid, peerUid);
  await setDoc(
    doc(db, "chats", cid),
    { members: [myUid, peerUid].sort(), updatedAt: serverTimestamp() },
    { merge: true }
  );
  return cid;
}


btnSignup?.addEventListener('click', signup);
btnLogin ?.addEventListener('click', login);
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
    chatHeaderName.textContent = "Select a friend";
    infoPanel.innerHTML = "";
    activeFriendUid = null;

    if (u) {
      await ensureUserProfile(u);
      listenForContacts();
      messages && (messages.innerHTML = '');
    if (CONTACTS_CACHE.length) openChatFor(CONTACTS_CACHE[0].id);

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
      const u = d.data() || {};
      if (d.id === me.uid) return; 
      users.push({
        id: d.id,
        displayName: u.displayName || "",
        email: (u.email || "").toLowerCase(),
        photoURL: u.photoURL || "",
        statusMessage: u.statusMessage || "",
        name: u.displayName || (u.email ? u.email.split("@")[0] : "User"),
      });
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
    .map(c => `
      <button
        class="contactItem ${c.id === activeFriendUid ? 'active' : ''}"
        data-id="${c.id}" type="button">
        ${c.name}
      </button>
    `)
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
  const btn = e.target.closest?.('.contactItem');
  if (!btn) return;

  const friend = CONTACTS_CACHE.find(x => x.id === btn.dataset.id);
  if (!friend) return;

  activeFriendUid = friend.id;
  listEl.querySelectorAll('.contact').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  updateHeaderWithFriend({
    displayName: friend.displayName || friend.name,
    email: friend.email || '',
    photoURL: friend.photoURL || '',
    statusMessage: friend.statusMessage || friend.status || ''
  });

  openChatFor(friend.id);
});





async function openChatFor(peerId) {
  const me = auth.currentUser;
  if (!me) return;
  CURRENT_PEER_UID = peerId;

  if (unsubscribeMsgs) { unsubscribeMsgs(); unsubscribeMsgs = null; }

  try {
    const cid = await ensureChatExists(me.uid, peerId); 

    const qMsg = query(
      collection(db, "chats", cid, "messages"),
      orderBy("createdAt", "asc")
    );

    unsubscribeMsgs = onSnapshot(qMsg, (snap) => {
      const box = document.getElementById("messages");
      if (!box) return;
      box.innerHTML = "";

      snap.forEach(docSnap => {
        const m = docSnap.data({ serverTimestamps: "estimate" });

        const div = document.createElement("div");
        div.className = (m.senderId === me.uid) ? "msg me" : "msg other";
        div.textContent = m.text || "";

        const t = document.createElement("span");
        t.className = "timeStamp";
        t.textContent = formatTime(m.createdAt || m.localCreatedAt || null);
        div.appendChild(t);

        box.appendChild(div);
      });

      box.classList.toggle("hasMessages", box.children.length > 0);
      box.scrollTop = box.scrollHeight;
    }, (err) => {
      console.error("messages listener error:", err);
    });

  } catch (e) {
    console.error("openChatFor error:", e);
  }
}

document.querySelector('.show-pass')?.addEventListener('click', () => {
  const input = document.getElementById('password');
  if (!input) return;
  input.type = (input.type === 'password') ? 'text' : 'password';
});

async function onLogin(e) {
  e.preventDefault();
  e.stopPropagation();

  console.log("[ChatGr] login clicked");

  const email = ($("email")?.value || "").trim().toLowerCase();
  const pass  = ($("password")?.value || "");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return showError("Email no válido.");
  if (!pass) return showError("Ingresa tu contraseña.");

  try {
    showError("Loading...", "#555");

    const { user } = await signInWithEmailAndPassword(auth, email, pass);
    console.log("[ChatGr] login OK →", user.uid);

    if (!user.emailVerified) {
      return showError("Tu email no está verificado. Revisa tu correo.");
    }

    $("authView")?.classList.add("hidden");
    $("chatView")?.classList.remove("hidden");
   


  } catch (e) {
    console.error("[LOGIN ERROR]", e.code, e.message);
    const map = {
      "auth/invalid-email": "Email no válido.",
      "auth/user-not-found": "Usuario no encontrado.",
      "auth/wrong-password": "Contraseña incorrecta.",
      "auth/operation-not-allowed": "Habilita Email/Password en Firebase Auth.",
      "auth/network-request-failed": "Problema de red. Verifica tu conexión."
    };
    showError(map[e.code] || "Error al iniciar sesión.");
  }
}




