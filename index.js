const messages = document.getElementById('messages');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');


function sendMessage() {
  const messageText = input.value.trim();
  if (messageText === '') return;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'msg me';
  messageDiv.textContent = messageText;
  const timeSpan = document.createElement('span');
  timeSpan.className = 'timeStamp';
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  timeSpan.textContent = `${hours}:${minutes}`;
  messageDiv.appendChild(timeSpan);
  messages.appendChild(messageDiv);
  messages.classList.add('hasMessages');


  input.value = '';
  messages.scrollTop = messages.scrollHeight;
}

sendBtn.addEventListener('click', sendMessage);

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

const infoBtn = document.getElementById('contactInfoBtn');
const infoPanel = document.getElementById('contactInfoPanel');

infoBtn.addEventListener('click', () => {
  infoPanel.classList.toggle('visible');
});

const emojiBtn = document.getElementById("emojiBtn");
const emojiPanel = document.getElementById("emojiPanel");
const messageInput = document.getElementById("messageInput");

emojiBtn.addEventListener("click", () => {
  emojiPanel.classList.toggle("visible");
});

emojiPanel.addEventListener("click", (e) => {
  if (e.target.classList.contains("emoji")) {
    const emoji = e.target.textContent;
    messageInput.value += emoji;
  }
});

const CONTACTS = [
  { id: 'jack',  name: 'Jack Saad',  phone: '5568082799', status: 'Online' },
  { id: 'Moy',  name: 'Moises Sacal',  phone: '5582101378', status: 'Online' },
  { id: 'Yaacov',  name: 'Yaacov Cabasso',  phone: '5512155331', status: 'Offline' },
  { id: 'Gabriel',  name: 'Gabriel Tuachi',  phone: '5644666217', status: 'Offline' },
  { id: 'Isaac',  name: 'Isaac Dayan',  phone: '5576091770', status: 'Offline' },
 ];

const listEl = document.getElementById('contactList');

function renderContacts(list) {
  if (!list.length) {
    listEl.innerHTML = '<div class="emptyResults">No GrFriends found</div>';
    return;
  }
  listEl.innerHTML = list
    .map(c => `<button class="contact" data-id="${c.id}" type="button">${c.name}</button>`)
    .join('');
}

const searchInput = document.getElementById('chatSearch');

function searchContacts() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { renderContacts(CONTACTS); return; }
  const res = CONTACTS.filter(c => c.name.toLowerCase().includes(q));
  renderContacts(res);
}

document.getElementById('enterChatbtn').addEventListener('click', searchContacts);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchContacts();
});
searchInput.addEventListener('input', searchContacts);

const contactInfoBtn = document.getElementById('contactInfoBtn');

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.contact');
  if (!btn) return;
  const c = CONTACTS.find(x => x.id === btn.dataset.id);
  if (!c) return;
  contactInfoBtn.textContent = `${c.name} ⓘ`;
  
  infoPanel.innerHTML = `
    <p><strong>Name:</strong> ${c.name}</p>
    <p><strong>Status:</strong> ${c.status}</p>
    <p><strong>Phone:</strong> ${c.phone}</p>
  `;
});

renderContacts(CONTACTS);
