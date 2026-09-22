const socket = io();
const $ = id => document.getElementById(id);
const state = {room:"العام", name:localStorage.getItem("chatName")||"زائر"};

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function renderMsg(m){
  const mine=m.username===state.name;
  const el=document.createElement("article");
  el.className="message "+(mine?"mine":"");
  const time=new Date(m.created_at.replace(" ","T")+"Z").toLocaleTimeString("ar",{hour:"2-digit",minute:"2-digit"});
  el.innerHTML=`<div class="avatar">${esc(m.username[0]||"ز")}</div><div class="bubble-wrap"><div class="meta"><b>${esc(m.username)}</b><time>${time}</time></div><div class="bubble">${esc(m.body)}</div></div>`;
  $("messages").appendChild(el);
}
function scroll(){ $("messages").scrollTop=$("messages").scrollHeight; }
function join(){
  $("myName").textContent=state.name;
  socket.emit("join",{username:state.name,room:state.room});
}
socket.on("history", rows=>{ $("messages").innerHTML=""; rows.forEach(renderMsg); scroll(); });
socket.on("message", m=>{renderMsg(m);scroll();});
socket.on("system", t=>{
  const el=document.createElement("div"); el.className="system"; el.textContent=t; $("messages").appendChild(el); scroll();
});
socket.on("presence", names=>{
  $("onlineCount").textContent=names.length;
  $("rightUsers").innerHTML=names.map(n=>`<div class="user-row"><div class="avatar">${esc(n[0]||"ز")}</div><b>${esc(n)}</b><i class="dot"></i></div>`).join("");
});
$("composer").onsubmit=e=>{e.preventDefault();const v=$("messageInput").value.trim();if(v){socket.emit("message",v);$("messageInput").value="";}};
$("editName").onclick=()=>{$("nameInput").value=state.name;$("nameModal").classList.remove("hidden");$("nameInput").focus();};
$("saveName").onclick=()=>{const n=$("nameInput").value.trim().slice(0,24);if(n){state.name=n;localStorage.setItem("chatName",n);$("nameModal").classList.add("hidden");join();}};
$("themeBtn").onclick=()=>document.documentElement.classList.toggle("dark");
$("toggleSidebar").onclick=()=>$("sidebar").classList.toggle("open");
$("usersBtn").onclick=()=>$("sidebar").classList.toggle("open");
$("emojiBtn").onclick=()=>{$("messageInput").value+=" 😊";$("messageInput").focus();};
document.querySelectorAll(".room").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".room").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  state.room=btn.dataset.room;$("roomTitle").textContent=state.room;join();
});
if(!localStorage.getItem("chatName"))$("nameModal").classList.remove("hidden");
join();
