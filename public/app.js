const socket = io({
  transports: ["websocket", "polling"]
});

const login = document.querySelector("#login");
const nameInput = document.querySelector("#name");
const ageInput = document.querySelector("#age");
const genderInput = document.querySelector("#gender");
const avatarInput = document.querySelector("#avatar");
const avatarPreview = document.querySelector("#avatarPreview");
const joinBtn = document.querySelector("#join");
const text = document.querySelector("#text");
const send = document.querySelector("#send");
const form = document.querySelector("#form");
const messages = document.querySelector("#messages");
const count = document.querySelector("#count");
const usersList = document.querySelector("#usersList");
const errorBox = document.querySelector("#error");

let me = null;

const rendered = new Set();

let selectedAvatar = "";

// صورة افتراضية
const defaultAvatar =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="100%" height="100%" fill="#263238"/>
      <circle cx="100" cy="75" r="40" fill="#90a4ae"/>
      <path d="M35 180c10-40 35-60 65-60s55 20 65 60"
        fill="#90a4ae"/>
    </svg>
  `);

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );
}

function genderText(gender) {
  if (gender === "male") return "ذكر";
  if (gender === "female") return "أنثى";
  return "غير محدد";
}

function showError(message) {
  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.style.display = "block";

  setTimeout(() => {
    errorBox.style.display = "none";
  }, 4000);
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 400;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round(
              height * (maxSize / width)
            );
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(
              width * (maxSize / height)
            );
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        resolve(
          canvas.toDataURL("image/jpeg", 0.75)
        );
      };

      img.onerror = () => {
        reject(new Error("الصورة غير صالحة"));
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("تعذر قراءة الصورة"));
    };

    reader.readAsDataURL(file);
  });
}

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("اختر صورة فقط.");
    avatarInput.value = "";
    return;
  }

  try {
    selectedAvatar = await compressImage(file);

    avatarPreview.src = selectedAvatar;
  } catch {
    showError("تعذر تحميل الصورة.");
  }
});

function addMessage(message) {
  if (!message) return;

  // منع التكرار
  if (rendered.has(message.id)) return;

  rendered.add(message.id);

  const mine =
    me && message.userId === me.id;

  const element =
    document.createElement("div");

  element.className =
    "msg " + (mine ? "mine" : "other");

  const avatar =
    message.avatar || defaultAvatar;

  const time = new Date(
    message.time
  ).toLocaleTimeString("ar-YE", {
    hour: "2-digit",
    minute: "2-digit"
  });

  element.innerHTML = `
    <img
      class="message-avatar"
      src="${esc(avatar)}"
      alt=""
    >

    <div class="message-content">

      <div class="message-meta">
        <strong>${esc(message.name)}</strong>

        <span>
          ${esc(message.age)} سنة
          ·
          ${genderText(message.gender)}
        </span>

        <time>${esc(time)}</time>
      </div>

      <div class="bubble">
        ${esc(message.text)}
      </div>

    </div>
  `;

  messages.appendChild(element);

  messages.scrollTop =
    messages.scrollHeight;
}

function renderUsers(list) {
  if (!usersList) return;

  usersList.innerHTML = "";

  list.forEach((user) => {
    const avatar =
      user.avatar || defaultAvatar;

    const item =
      document.createElement("div");

    item.className = "user-item";

    item.innerHTML = `
      <img
        class="user-avatar"
        src="${esc(avatar)}"
        alt=""
      >

      <div class="user-info">
        <strong>${esc(user.name)}</strong>

        <span>
          ${esc(user.age)} سنة
          ·
          ${genderText(user.gender)}
        </span>
      </div>

      <span class="online-dot"></span>
    `;

    usersList.appendChild(item);
  });

  count.textContent = list.length;
}

function join() {
  const name =
    nameInput.value.trim();

  const age =
    Number(ageInput.value);

  const gender =
    genderInput.value;

  if (!name) {
    showError("اكتب اسمك.");
    nameInput.focus();
    return;
  }

  if (!age || age < 13 || age > 120) {
    showError(
      "العمر يجب أن يكون بين 13 و120 سنة."
    );
    ageInput.focus();
    return;
  }

  socket.emit("join", {
    name,
    age,
    gender,
    avatar: selectedAvatar
  });
}

joinBtn.addEventListener(
  "click",
  join
);

[nameInput, ageInput].forEach(
  (input) => {
    input.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          join();
        }
      }
    );
  }
);

socket.on("join_error", (data) => {
  showError(
    data?.message ||
    "تعذر الدخول."
  );
});

socket.on("joined", (user) => {
  me = user;

  login.style.display = "none";

  text.disabled = false;
  send.disabled = false;

  text.focus();
});

socket.on("history", (list) => {
  messages.innerHTML = "";

  rendered.clear();

  list.forEach(addMessage);
});

socket.on(
  "message",
  addMessage
);

socket.on(
  "users",
  renderUsers
);

form.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const value =
      text.value.trim();

    if (!value || !me) return;

    const clientId =
      crypto.randomUUID();

    socket.emit(
      "send_message",
      {
        clientId,
        text: value
      }
    );

    text.value = "";
    text.focus();
  }
);
