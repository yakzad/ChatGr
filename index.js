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


