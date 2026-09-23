const socket = io({ transports: ["websocket", "polling"] });
const login = document.querySelector("#login");
const nameInput = document.querySelector("#name");
const joinBtn = document.querySelector("#join");
const text = document.querySelector("#text");
const send = document.querySelector("#send");
const form = document.querySelector("#form");
const messages = document.querySelector("#messages");
const count = document.querySelector("#count");

let me = null;
const rendered = new Set();

function esc(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function addMessage(m){
  if (!m || rendered.has(m.id)) return; // hard guard against duplicate rendering
  rendered.add(m.id);
  const mine = me && m.userId === me.id;
  const el = document.createElement("div");
  el.className = "msg " + (mine ? "mine" : "other");
  const time = new Date(m.time).toLocaleTimeString("ar-YE",{hour:"2-digit",minute:"2-digit"});
  el.innerHTML = `<div class="bubble"><div class="meta">${esc(m.name)} · ${time}</div><div class="body">${esc(m.text)}</div></div>`;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}
function join(){
  const name = nameInput.value.trim();
  if(!name) return nameInput.focus();
  socket.emit("join",{name});
}
joinBtn.onclick = join;
nameInput.addEventListener("keydown",e=>{if(e.key==="Enter")join()});
socket.on("joined", user=>{
  me=user;
  login.style.display="none";
  text.disabled=false; send.disabled=false; text.focus();
});
socket.on("history", list=>{
  messages.innerHTML="";
  rendered.clear();
  list.forEach(addMessage);
});
socket.on("message", addMessage);
socket.on("users", list=>count.textContent=list.length);

form.addEventListener("submit",e=>{
  e.preventDefault();
  const value=text.value.trim();
  if(!value || !me) return;
  const clientId=crypto.randomUUID();
  socket.emit("send_message",{clientId,text:value});
  text.value="";
  text.focus();
});
