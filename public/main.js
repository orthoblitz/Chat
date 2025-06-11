const socket = io();

let userName = "";
let typing = false;
let typingTimeout;

const entryScreen = document.getElementById("entry-screen");
const chatScreen = document.getElementById("chat-screen");
const nameInput = document.getElementById("nameInput");
const msgInput = document.getElementById("msgInput");
const chatBox = document.getElementById("chat-box");
const greeting = document.getElementById("greeting");
const userList = document.getElementById("user-list");

// User joins
function enterChat() {
  const name = nameInput.value.trim();
  if (!name) return;
  userName = name;
  entryScreen.style.display = "none";
  chatScreen.style.display = "block";
  greeting.innerText = `Welcome, ${userName}!`;
  socket.emit("join", userName);
}

// Sending messages
function sendMessage() {
  const message = msgInput.value.trim();
  if (!message) return;
  socket.emit("chat message", { user: userName, message });
  msgInput.value = "";
  stopTyping();
}

// Typing detection
msgInput.addEventListener("input", () => {
  if (!typing) {
    typing = true;
    socket.emit("typing", { user: userName, typing: true });
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTyping, 1000);
});

function stopTyping() {
  if (typing) {
    typing = false;
    socket.emit("typing", { user: userName, typing: false });
  }
}

// Add message to chat
function addMessage(msg, type = "normal") {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.innerText = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Add typing indicator
function addTyping(user) {
  let id = `typing-${user}`;
  if (!document.getElementById(id)) {
    const div = document.createElement("div");
    div.id = id;
    div.className = "typing";
    div.innerText = `${user} is typing...`;
    chatBox.appendChild(div);
  }
}

// Remove typing indicator
function removeTyping(user) {
  let id = `typing-${user}`;
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Clear chat (for this user only)
function clearChat() {
  if (confirm("Clear your chat view? This won’t delete it for others.")) {
    chatBox.innerHTML = "";
  }
}

// SOCKET EVENTS

// Receive past chat messages
socket.on("chat history", (messages) => {
  messages.forEach(({ user, message }) => {
    addMessage(`${user}: ${message}`);
  });
});

// When someone sends a message
socket.on("chat message", ({ user, message }) => {
  addMessage(`${user}: ${message}`);
});

// System messages (join/leave)
socket.on("system message", (msg) => {
  addMessage(msg, "system");
});

// Who's online
socket.on("user list", (users) => {
  userList.innerHTML = users.map(user => `<li>${user}</li>`).join("");
});

// Typing indicator
socket.on("typing", ({ user, typing }) => {
  if (typing) {
    addTyping(user);
  } else {
    removeTyping(user);
  }
});
