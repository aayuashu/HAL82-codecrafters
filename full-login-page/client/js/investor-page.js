import { listPosts } from "./posts.js";
import { api } from "./api.js";
import { fetchMe, getToken, clearSession } from "./auth.js";
import { toast } from "./ui.js";

/* =====================================================
   SESSION GUARD
===================================================== */

if (!getToken()) {
  window.location.href = "../index.html";
}

const statusEl = document.getElementById("status");
const feedEl = document.getElementById("feed");

/* =====================================================
   LOGOUT
===================================================== */

document.getElementById("logout").addEventListener("click", () => {
  clearSession();
  toast("Logged out", "success");
  setTimeout(() => (window.location.href = "../index.html"), 400);
});

/* =====================================================
   UTIL
===================================================== */

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =====================================================
   PROFILE LOAD
===================================================== */

async function loadProfile() {
  const me = await fetchMe();

  document.getElementById("name").textContent = me.full_name || "User";

  document.getElementById("email").textContent = me.email;

  document.getElementById("role").textContent = `Role: ${me.role}`;

  const img = document.getElementById("avatar");

  if (me.avatar_url) {
    img.src = me.avatar_url;
    img.style.display = "block";
  } else {
    img.style.display = "none";
  }

  // Hard guard: investor only
  if (me.role !== "INVESTOR") {
    window.location.href = "./unauthorized.html";
  }

  return me;
}

/* =====================================================
   TAG LOGIC (Category Color)
===================================================== */

function pickTag(p) {
  return p.category || p.industry || "Startup";
}

function tagClass(tag) {
  const t = String(tag || "").toLowerCase();

  if (t.includes("tech")) return "tag-blue";
  if (t.includes("health")) return "tag-green";
  if (t.includes("fin")) return "tag-cyan";

  return "tag-gray";
}

/* =====================================================
   RENDER FEED
===================================================== */

function renderFeed(posts) {
  if (!posts || posts.length === 0) {
    feedEl.innerHTML = `<p class="inv-empty">No startup ideas yet.</p>`;
    return;
  }

  feedEl.innerHTML = posts
    .map((p) => {
      const title = escapeHtml(p.title);
      const body = escapeHtml(p.body);
      const author = escapeHtml(p.full_name || p.email || "Startup");

      const count = Number(p.interest_count || 0);

      const tag = escapeHtml(pickTag(p));
      const tClass = tagClass(tag);

      return `
        <article class="pitch-card">

          <div class="pitch-top">
            <span class="pitch-tag ${tClass}">
              ${tag}
            </span>

            <button
              class="like-btn ${p.liked_by_me ? "liked" : ""}"
              data-id="${p.id}"
              aria-label="Interested"
              title="Interested"
            >
              ❤️ <span class="like-count">${count}</span>
            </button>
          </div>

          <h3 class="pitch-title">
            ${title}
          </h3>

          <div class="pitch-sub">
            ${author}
          </div>

          <p class="pitch-body">
            ${body}
          </p>

        </article>
      `;
    })
    .join("");

  attachLikeHandlers();
}

/* =====================================================
   LIKE HANDLERS
===================================================== */

function attachLikeHandlers() {
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.id;

      try {
        const res = await api(`/posts/${postId}/interested`, {
          method: "POST",
          token: getToken(),
        });

        const countEl = btn.querySelector(".like-count");
        const current = parseInt(countEl?.textContent || "0", 10) || 0;

        if (res.liked) {
          btn.classList.add("liked");
          countEl.textContent = String(current + 1);
        } else {
          btn.classList.remove("liked");
          countEl.textContent = String(Math.max(0, current - 1));
        }
      } catch (e) {
        toast(e.message || "Failed to update interest", "error");
      }
    });
  });
}

/* =====================================================
   MAIN
===================================================== */

async function main() {
  try {
    statusEl.textContent = "Loading your profile...";
    await loadProfile();

    statusEl.textContent = "Loading startup ideas...";
    const data = await listPosts();

    statusEl.textContent = "";
    renderFeed(data.posts);
  } catch (e) {
    console.error(e);

    toast("Session expired or API error. Please login again.", "error");

    clearSession();

    setTimeout(() => {
      window.location.href = "../index.html";
    }, 800);
  }
}

main();
