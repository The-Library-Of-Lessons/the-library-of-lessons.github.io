(function () {
  "use strict";

  // =========================================================================
  // 1. SUPABASE & STORAGE CONFIG
  // =========================================================================
  const USERNAME = "The-Library-Of-Lessons";
  const SUPABASE_URL = "https://gtwqjkrkupkcpxafdepg.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_bYetZP5wIfGluCKzTjfcbg_O0FdpXwj";
  const HEARTS_ENABLED = !!window.supabase && SUPABASE_URL.indexOf("YOUR_") !== 0;
  const sb = HEARTS_ENABLED ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const VOTER_KEY = "lol_voter_id_v1";
  const VISITED_KEY = "lol_visited_v1";
  const CACHE_KEY = "lol_guides_cache_v1";
  const DAYPART_KEY = "lol_daypart_override";

  function getVoterId() {
    try {
      let id = localStorage.getItem(VOTER_KEY);
      if (!id) {
        id = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : ("v-" + Date.now() + "-" + Math.random().toString(16).slice(2));
        localStorage.setItem(VOTER_KEY, id);
      }
      return id;
    } catch {
      return "v-" + Date.now();
    }
  }
  const voterId = getVoterId();

  function readVisited() {
    try {
      const raw = localStorage.getItem(VISITED_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function markVisited(url) {
    try {
      const visited = readVisited();
      visited[url] = Date.now();
      localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
    } catch {}
    recordView(url);
    updateJourneyUI();
    document.querySelectorAll('[data-guide-url="' + CSS.escape(url) + '"]').forEach((el) => {
      el.classList.add("is-visited");
      const badges = el.querySelector(".catalog-plate__badges");
      if (badges && !badges.querySelector(".plate-flag--read")) {
        const span = document.createElement("span");
        span.className = "plate-flag plate-flag--read";
        span.textContent = "Read";
        badges.appendChild(span);
      }
    });
  }

  // =========================================================================
  // 2. SIGNATURE MOVE: ARCHITECTURAL READING LIGHT DIAL
  // =========================================================================
  const DAYPARTS = ["dawn", "day", "golden", "night"];
  const DAYPART_META = {
    dawn:   { label: "Dawn",   atmosphere: "Morning Mist" },
    day:    { label: "Day",    atmosphere: "Sunlit Canopy" },
    golden: { label: "Golden", atmosphere: "Late Amber Light" },
    night:  { label: "Night",  atmosphere: "Quiet Lantern" }
  };

  function calculateDaypart() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) return "dawn";
    if (hour >= 9 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "golden";
    return "night";
  }

  function setDaypart(part, persist = true) {
    const valid = DAYPARTS.includes(part) ? part : "day";
    document.documentElement.setAttribute("data-daypart", valid);
    const nameEl = document.getElementById("daypartName");
    if (nameEl) nameEl.textContent = DAYPART_META[valid].label;
    const captionEl = document.getElementById("atriumLightStatus");
    if (captionEl) captionEl.textContent = DAYPART_META[valid].atmosphere;
    if (persist) {
      try { localStorage.setItem(DAYPART_KEY, valid); } catch {}
    }
  }

  (function initDaypart() {
    let saved = null;
    try { saved = localStorage.getItem(DAYPART_KEY); } catch {}
    setDaypart(saved || calculateDaypart(), false);
  })();

  const daypartBtn = document.getElementById("daypartToggle");
  if (daypartBtn) {
    daypartBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-daypart") || "day";
      const next = DAYPARTS[(DAYPARTS.indexOf(current) + 1) % DAYPARTS.length];
      setDaypart(next, true);
    });
  }

  // =========================================================================
  // 3. LESSON OF THE DAY (100 TIMELESS QUOTES)
  // =========================================================================
  const QUOTES = [
    { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { text: "No person has the power to have everything they want, but it is in their power not to want what they haven't got.", author: "Seneca" },
    { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
    { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
    { text: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Lao Tzu" },
    { text: "Simplicity is the prerequisite for reliability.", author: "Edsger W. Dijkstra" },
    { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
    { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
    { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
    { text: "Waste no more time arguing about what a good person should be. Be one.", author: "Marcus Aurelius" },
    { text: "Make each day your masterpiece.", author: "John Wooden" },
    { text: "Discipline equals freedom.", author: "Jocko Willink" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Tell me and I forget, teach me and I may remember, involve me and I learn.", author: "Benjamin Franklin" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "He who conquers himself is the mightiest warrior.", author: "Confucius" },
    { text: "An unexamined life is not worth living.", author: "Socrates" },
    { text: "The secret of change is to focus all your energy not on fighting the old, but on building the new.", author: "Socrates" },
    { text: "Patience is bitter, but its fruit is sweet.", author: "Jean-Jacques Rousseau" },
    { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { text: "Courage is not the absence of fear, but rather the judgment that something else is more important than fear.", author: "Ambrose Redmoon" },
    { text: "Everything should be made as simple as possible, but not simpler.", author: "Albert Einstein" },
    { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
    { text: "Muddy water is best cleared by leaving it alone.", author: "Alan Watts" },
    { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
    { text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson" },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
    { text: "I went to the woods because I wished to live deliberately.", author: "Henry David Thoreau" },
    { text: "Simplify, simplify.", author: "Henry David Thoreau" },
    { text: "Things do not change; we change.", author: "Henry David Thoreau" },
    { text: "The quiet mind is richer than a crown.", author: "Robert Greene" },
    { text: "Let everything happen to you: beauty and terror. Just keep going. No feeling is final.", author: "Rainer Maria Rilke" },
    { text: "Be patient toward all that is unsolved in your heart and try to love the questions themselves.", author: "Rainer Maria Rilke" },
    { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus" },
    { text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus" },
    { text: "Action cures fear. Inaction creates terror.", author: "Douglas Horton" },
    { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
    { text: "If a man knows not to which port he sails, no wind is favorable.", author: "Seneca" },
    { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
    { text: "Never let the future disturb you. You will meet it with the same weapons of reason which today arm you against the present.", author: "Marcus Aurelius" },
    { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
    { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
    { text: "Don't explain your philosophy. Embody it.", author: "Epictetus" },
    { text: "He who laughs at himself never runs out of things to laugh at.", author: "Epictetus" },
    { text: "Silence is a source of great strength.", author: "Lao Tzu" },
    { text: "When you are content to be simply yourself and don't compare or compete, everyone will respect you.", author: "Lao Tzu" },
    { text: "To the mind that is still, the whole universe surrenders.", author: "Lao Tzu" },
    { text: "Be like water making its way through cracks. Do not be assertive, but adjust to the object.", author: "Bruce Lee" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "Knowing is not enough, we must apply. Willing is not enough, we must do.", author: "Johann Wolfgang von Goethe" },
    { text: "Whatever you can do, or dream you can, begin it. Boldness has genius, power and magic in it.", author: "Johann Wolfgang von Goethe" },
    { text: "Rest is not idleness, and to lie sometimes on the grass under trees is by no means a waste of time.", author: "John Lubbock" },
    { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
    { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha" },
    { text: "The mind is everything. What you think you become.", author: "Buddha" },
    { text: "Drop by drop is the water pot filled. Likewise, the wise man, gathering it little by little, fills himself with good.", author: "Dhammapada" },
    { text: "Better than a thousand hollow words, is one word that brings peace.", author: "Dhammapada" },
    { text: "Nothing is permanent except change.", author: "Heraclitus" },
    { text: "No man ever steps in the same river twice, for it's not the same river and he's not the same man.", author: "Heraclitus" },
    { text: "Character is destiny.", author: "Heraclitus" },
    { text: "The greatest wealth is to live content with little.", author: "Plato" },
    { text: "Wise men speak because they have something to say; fools because they have to say something.", author: "Plato" },
    { text: "There are two things a person should never be angry at: what they can help, and what they cannot.", author: "Plato" },
    { text: "Educating the mind without educating the heart is no education at all.", author: "Aristotle" },
    { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Hope is a waking dream.", author: "Aristotle" },
    { text: "The energy of the mind is the essence of life.", author: "Aristotle" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle Onassis" },
    { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
    { text: "Be kind, for everyone you meet is fighting a hard battle.", author: "Philo" },
    { text: "Order and simplification are the first steps toward the mastery of a subject.", author: "Thomas Mann" },
    { text: "The art of being wise is the art of knowing what to overlook.", author: "William James" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
    { text: "A great deal of intelligence can be invested in ignorance when the need for illusion is deep.", author: "Saul Bellow" },
    { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
    { text: "Courage is grace under pressure.", author: "Ernest Hemingway" },
    { text: "There is nothing noble in being superior to your fellow man; true nobility is being superior to your former self.", author: "Ernest Hemingway" },
    { text: "The master has failed more times than the beginner has even tried.", author: "Stephen McCranie" },
    { text: "Wisdom begins in wonder.", author: "Socrates" },
    { text: "Attention is the rarest and purest form of generosity.", author: "Simone Weil" },
    { text: "Life can only be understood backwards; but it must be lived forwards.", author: "S\u00f8ren Kierkegaard" },
    { text: "Anxiety is the dizziness of freedom.", author: "S\u00f8ren Kierkegaard" },
    { text: "To dare is to lose one's footing momentarily. Not to dare is to lose oneself.", author: "S\u00f8ren Kierkegaard" },
    { text: "Everything has beauty, but not everyone sees it.", author: "Confucius" },
    { text: "He who learns but does not think, is lost! He who thinks but does not learn is in great danger.", author: "Confucius" },
    { text: "The green reed which bends in the wind is stronger than the mighty oak which breaks in a storm.", author: "Confucius" },
    { text: "Clear thinking requires courage rather than intelligence.", author: "Thomas Szasz" },
    { text: "Give me six hours to chop down a tree and I will spend the first four sharpening the axe.", author: "Abraham Lincoln" },
    { text: "A room without books is like a body without a soul.", author: "Cicero" },
    { text: "If you have a garden and a library, you have everything you need.", author: "Cicero" },
    { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" }
  ];

  (function initDailyQuote() {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const quote = QUOTES[dayOfYear % QUOTES.length];
    const textEl = document.getElementById("dailyQuoteText");
    const authorEl = document.getElementById("dailyQuoteAuthor");
    if (textEl) textEl.textContent = `"${quote.text}"`;
    if (authorEl) authorEl.textContent = quote.author;
  })();

  const copyQuoteBtn = document.getElementById("copyQuoteBtn");
  if (copyQuoteBtn) {
    copyQuoteBtn.addEventListener("click", () => {
      const text = (document.getElementById("dailyQuoteText")?.textContent || "") + " (" + (document.getElementById("dailyQuoteAuthor")?.textContent || "") + ")";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast("Quote copied to clipboard"));
      }
    });
  }

  // =========================================================================
  // 4. TOPIC DETECTION & DATA HELPERS
  // =========================================================================
  function detectTopic(name, desc) {
    const text = (name + " " + (desc || "")).toLowerCase().replace(/[-_]+/g, " ");
    if (/leader|coach|team|manager|shepherd|heart framework|humor|level 5/i.test(text)) return "Leadership";
    if (/peace|stress|worry|flow state|calm|mind|subconscious/i.test(text)) return "Mind & Calm";
    if (/care|connect|friend|acquaintance|speak|giving|blessing|wife|love/i.test(text)) return "Connection";
    if (/wisdom|god|sabbath|christian|armor|spiritual|forgiveness|principles/i.test(text)) return "Wisdom";
    if (/framework|project|cleared|risk|problem|smart|scope|quality|systems|ladder|software|planning|calculator|storage|upload/i.test(text)) return "Work & Systems";
    return "Growth & Habits";
  }

  function titleCase(slug) {
    return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function estimateReadTime(text) {
    const words = (text || "").split(/\s+/).length;
    return Math.max(3, Math.min(12, Math.round(words / 150) + 4));
  }

  const FALLBACK_GUIDES = [
    {
      name: "The-CARE-Framework-for-Connecting-with-Others",
      title: "The CARE Framework for Connecting with Others",
      desc: "Discover four Scripture-rooted habits (Curiosity, Acceptance, Reach out, Empathy) for truly connecting with coworkers, family, and friends with real-life scenes.",
      url: "https://the-library-of-lessons.github.io/The-CARE-Framework-for-Connecting-with-Others/",
      updated: new Date().toISOString(),
      added: "2024-01-10T00:00:00Z"
    },
    {
      name: "HEART-framework-for-Leading-People",
      title: "HEART Framework for Leading People",
      desc: "Timeless lessons from managing from the heart: Honesty, Empathy, Acceptance, Respect, and Trust to inspire and build teams.",
      url: "https://the-library-of-lessons.github.io/HEART-framework-for-Leading-People/",
      updated: new Date(Date.now() - 86400000 * 2).toISOString(),
      added: "2024-01-15T00:00:00Z"
    },
    {
      name: "The-CLEARED-Framework",
      title: "The CLEARED Framework",
      desc: "How organizations and teams structure clear processes to provide reliable quality to clients and clarity to teammates.",
      url: "https://the-library-of-lessons.github.io/The-CLEARED-Framework/",
      updated: new Date(Date.now() - 86400000 * 5).toISOString(),
      added: "2024-02-01T00:00:00Z"
    },
    {
      name: "Comprehensive-Guide-for-Stress-Management",
      title: "Comprehensive Guide for Stress Management",
      desc: "A holistic, grounded manual on nervous system regulation, mental framing, and sustained inner peace under high demand.",
      url: "https://the-library-of-lessons.github.io/Comprehensive-Guide-for-Stress-Management/",
      updated: new Date(Date.now() - 86400000 * 8).toISOString(),
      added: "2024-02-14T00:00:00Z"
    },
    {
      name: "The-One-Minute-Manager-Summary",
      title: "The One Minute Manager Summary",
      desc: "Essential principles of setting clear one-minute goals, giving prompt one-minute praisings, and offering corrective redirects.",
      url: "https://the-library-of-lessons.github.io/The-One-Minute-Manager-Summary/",
      updated: new Date(Date.now() - 86400000 * 12).toISOString(),
      added: "2024-02-20T00:00:00Z"
    },
    {
      name: "Difference-Between-Planning-and-Worrying",
      title: "Difference Between Planning and Worrying",
      desc: "Disentangling productive forward-looking preparation from cyclical anxiety and learned helplessness.",
      url: "https://the-library-of-lessons.github.io/Difference-Between-Planning-and-Worrying/",
      updated: new Date(Date.now() - 86400000 * 18).toISOString(),
      added: "2024-03-01T00:00:00Z"
    },
    {
      name: "The-Flow-State",
      title: "The Flow State",
      desc: "Cultivating conditions for effortless concentration, deep focus, and high creative output without friction.",
      url: "https://the-library-of-lessons.github.io/The-Flow-State/",
      updated: new Date(Date.now() - 86400000 * 22).toISOString(),
      added: "2024-03-10T00:00:00Z"
    },
    {
      name: "Think-in-Systems-Change-the-World",
      title: "Think in Systems: Change the World",
      desc: "Mental models for recognizing feedback loops, systemic bottlenecks, and high-leverage intervention points.",
      url: "https://the-library-of-lessons.github.io/Think-in-Systems-Change-the-World/",
      updated: new Date(Date.now() - 86400000 * 30).toISOString(),
      added: "2024-03-25T00:00:00Z"
    }
  ];

  // =========================================================================
  // 5. SUPABASE HEARTS & VIEWS
  // =========================================================================
  let heartCounts = {};
  let myHearts = new Set();
  let viewCounts = {};

  async function loadHearts() {
    if (!sb) return;
    try {
      const [countsRes, mineRes] = await Promise.all([
        sb.from("guide_heart_counts").select("guide_url, hearts"),
        sb.from("guide_hearts").select("guide_url").eq("voter_id", voterId)
      ]);
      if (countsRes.data) countsRes.data.forEach((r) => { heartCounts[r.guide_url] = r.hearts; });
      if (mineRes.data) myHearts = new Set(mineRes.data.map((r) => r.guide_url));
    } catch {}
  }

  async function loadViews() {
    if (!sb) return;
    try {
      const res = await sb.from("guide_view_counts").select("guide_url, views");
      if (res.data) res.data.forEach((r) => { viewCounts[r.guide_url] = r.views; });
    } catch {}
  }

  async function recordView(url) {
    if (!sb) return;
    try {
      await sb.from("guide_views").upsert(
        { guide_url: url, voter_id: voterId, viewed_at: new Date().toISOString() },
        { onConflict: "guide_url,voter_id" }
      );
    } catch {}
  }

  function spawnLeafBurst(btn) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement("span");
      dot.className = "leaf-burst-particle";
      const angle = (i / 6) * Math.PI * 2;
      const dist = 18 + Math.random() * 16;
      dot.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      dot.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      dot.style.left = "50%";
      dot.style.top = "50%";
      btn.appendChild(dot);
      setTimeout(() => dot.remove(), 540);
    }
  }

  async function toggleHeart(url, btn) {
    if (!sb) return;
    const nowActive = !myHearts.has(url);
    if (nowActive) {
      myHearts.add(url);
      spawnLeafBurst(btn);
    } else {
      myHearts.delete(url);
    }
    heartCounts[url] = Math.max(0, (heartCounts[url] || 0) + (nowActive ? 1 : -1));
    syncHeartUI(url);

    try {
      if (nowActive) {
        const { error } = await sb.from("guide_hearts").insert({ guide_url: url, voter_id: voterId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await sb.from("guide_hearts").delete().eq("guide_url", url).eq("voter_id", voterId);
        if (error) throw error;
      }
    } catch {
      if (nowActive) myHearts.delete(url); else myHearts.add(url);
      heartCounts[url] = Math.max(0, (heartCounts[url] || 0) + (nowActive ? -1 : 1));
      syncHeartUI(url);
    }
  }

  function syncHeartUI(url) {
    const count = heartCounts[url] || 0;
    const active = myHearts.has(url);
    document.querySelectorAll(`.heart-btn[data-url="${CSS.escape(url)}"]`).forEach((b) => {
      b.setAttribute("aria-pressed", active ? "true" : "false");
      const countSpan = b.querySelector(".heart-count");
      if (countSpan) countSpan.textContent = count;
      const svg = b.querySelector("svg");
      if (svg) svg.setAttribute("fill", active ? "currentColor" : "none");
    });
  }

  document.addEventListener("click", (e) => {
    const heartBtn = e.target.closest(".heart-btn");
    if (heartBtn) {
      e.preventDefault();
      e.stopPropagation();
      const url = heartBtn.dataset.url;
      if (url) toggleHeart(url, heartBtn);
    }
  });

  // =========================================================================
  // 6. COMPONENT BUILDERS (FOLIO RAIL & ARCHIVE PLATES)
  // =========================================================================
  const ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>';
  const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.8"/></svg>';
  const ICON_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

  function buildFolioCard(g, idx) {
    const card = document.createElement("a");
    card.className = "folio-card";
    card.href = g.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.dataset.guideUrl = g.url;
    card.setAttribute("data-sc-tilt", "6");

    const callNo = "LOL · " + String(idx + 1).padStart(3, "0");
    const readTime = estimateReadTime(g.desc);

    card.innerHTML = `
      <div>
        <div class="folio-card__top">
          <span class="folio-card__call">${callNo}</span>
          <span class="folio-card__topic">${g.topic}</span>
        </div>
        <h3 class="folio-card__title">${g.title}</h3>
        <p class="folio-card__desc">${g.desc || "A distilled guide on " + g.title.toLowerCase() + " with practical frameworks."}</p>
      </div>
      <div class="folio-card__foot">
        <div class="folio-card__stats">
          <span class="folio-card__stat" title="Estimated reading time">${ICON_CLOCK} ${readTime}m</span>
          <span class="folio-card__stat" title="Unique readers">${ICON_EYE} ${g.uniqueViews || 0}</span>
        </div>
        <button class="heart-btn" type="button" data-url="${g.url}" aria-pressed="${g.heartedByMe ? "true" : "false"}" title="Appreciate this lesson">
          ${ICON_HEART}
          <span class="heart-count">${g.hearts || 0}</span>
        </button>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".heart-btn")) { e.preventDefault(); return; }
      markVisited(g.url);
    });
    return card;
  }

  function buildCatalogPlate(g, idx, visitedMap) {
    const card = document.createElement("a");
    card.className = "catalog-plate";
    card.href = g.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.dataset.guideUrl = g.url;
    card.dataset.topic = g.topic;

    const isVisited = !!visitedMap[g.url];
    if (isVisited) card.classList.add("is-visited");

    const callNo = "LOL · " + String(idx + 1).padStart(3, "0");
    const readTime = estimateReadTime(g.desc);
    const days = (Date.now() - new Date(g.updated).getTime()) / 86400000;

    let flags = "";
    if (days <= 3) flags += '<span class="plate-flag plate-flag--new">New</span>';
    else if (days <= 14) flags += '<span class="plate-flag plate-flag--updated">Updated</span>';
    if (isVisited) flags += '<span class="plate-flag plate-flag--read">Read</span>';

    card.innerHTML = `
      <div>
        <div class="catalog-plate__head">
          <span class="catalog-plate__call">${callNo}</span>
          <div class="catalog-plate__badges">${flags}</div>
        </div>
        <div class="catalog-plate__topic">${g.topic}</div>
        <h3 class="catalog-plate__title">${g.title}</h3>
        <p class="catalog-plate__desc">${g.desc || "A focused practical guide on " + g.title.toLowerCase() + " with actionable principles."}</p>
      </div>
      <div class="catalog-plate__foot">
        <div class="catalog-plate__meta">
          <span class="meta-item" title="Estimated reading time">${ICON_CLOCK} ${readTime}m read</span>
          <span class="meta-item" title="Unique readers">${ICON_EYE} ${g.uniqueViews || 0}</span>
        </div>
        <button class="heart-btn" type="button" data-url="${g.url}" aria-pressed="${g.heartedByMe ? "true" : "false"}" title="Appreciate this lesson">
          ${ICON_HEART}
          <span class="heart-count">${g.hearts || 0}</span>
        </button>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".heart-btn")) { e.preventDefault(); return; }
      markVisited(g.url);
    });
    return card;
  }

  // =========================================================================
  // 7. CATALOG STATE, READING ROOM RAIL & SHELF COMPASS
  // =========================================================================
  let allGuides = [];
  let activeTopic = "all";
  let activeShelf = "favorites"; // "favorites" | "recent"
  let currentRailGuides = [];
  let scInstance = null;

  function hydrateGuides(rawGuides) {
    return rawGuides.map((g) => ({
      ...g,
      topic: detectTopic(g.name, g.desc),
      hearts: heartCounts[g.url] || 0,
      heartedByMe: myHearts.has(g.url),
      uniqueViews: viewCounts[g.url] || 0
    }));
  }

  function renderReadingRoom() {
    const rail = document.getElementById("readingRoomRail");
    if (!rail) return;
    rail.innerHTML = "";

    const sorted = activeShelf === "favorites"
      ? [...allGuides].sort((a, b) => (b.hearts || 0) - (a.hearts || 0) || new Date(b.updated) - new Date(a.updated))
      : [...allGuides].sort((a, b) => new Date(b.updated) - new Date(a.updated));

    currentRailGuides = sorted.slice(0, 8);
    currentRailGuides.forEach((g, idx) => {
      rail.appendChild(buildFolioCard(g, idx));
    });

    updateShelfCompass(0);
    if (scInstance && typeof scInstance.layout === "function") {
      scInstance.layout();
    }
  }

  function updateShelfCompass(p) {
    if (!currentRailGuides.length) return;
    const clamped = Math.max(0, Math.min(1, p));
    const idx = Math.min(currentRailGuides.length - 1, Math.floor(clamped * currentRailGuides.length));
    const g = currentRailGuides[idx];
    const callEl = document.getElementById("compassCall");
    const titleEl = document.getElementById("compassTitle");
    if (callEl) callEl.textContent = "LOL · " + String(idx + 1).padStart(3, "0");
    if (titleEl && g) titleEl.textContent = g.title;
  }

  // Observe --sc-p on the pinned Reading Room act to drive the Shelf Compass
  const readingRoomAct = document.getElementById("readingRoom");
  if (readingRoomAct) {
    let lastP = -1;
    function pollCompass() {
      const val = parseFloat(readingRoomAct.style.getPropertyValue("--sc-p"));
      if (!isNaN(val) && Math.abs(val - lastP) > 0.005) {
        lastP = val;
        updateShelfCompass(val);
      }
      requestAnimationFrame(pollCompass);
    }
    requestAnimationFrame(pollCompass);
  }

  document.querySelectorAll("[data-shelf-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-shelf-mode]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeShelf = btn.dataset.shelfMode;
      renderReadingRoom();
    });
  });

  function renderFeaturedGem(guides) {
    if (!guides.length) return;
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const gem = guides[dayOfYear % guides.length];

    const titleEl = document.getElementById("gemTitle");
    const descEl = document.getElementById("gemDesc");
    const topicEl = document.getElementById("gemTopic");
    const linkEl = document.getElementById("gemLink");
    if (titleEl) titleEl.textContent = gem.title;
    if (descEl) descEl.textContent = gem.desc || "A distilled handbook on the core principles and practical habits of " + gem.title.toLowerCase() + ".";
    if (topicEl) topicEl.textContent = gem.topic;
    if (linkEl) {
      linkEl.href = gem.url;
      linkEl.onclick = () => markVisited(gem.url);
    }
  }

  function renderGrid(guides, visitedMap) {
    const grid = document.getElementById("mainCardGrid");
    if (!grid) return;
    grid.innerHTML = "";

    let filtered = activeTopic === "all" ? [...guides] : guides.filter((g) => g.topic === activeTopic);
    const sortVal = document.getElementById("sortSelect")?.value || "recent";
    if (sortVal === "recent") filtered.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    else if (sortVal === "added") filtered.sort((a, b) => new Date(b.added) - new Date(a.added));
    else if (sortVal === "alpha") filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortVal === "hearts") filtered.sort((a, b) => (b.hearts || 0) - (a.hearts || 0));
    else if (sortVal === "unvisited") {
      filtered.sort((a, b) => (visitedMap[a.url] ? 1 : 0) - (visitedMap[b.url] ? 1 : 0));
    }

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="catalog-empty">
          <h3>No lessons found on this shelf</h3>
          <p>Select All Lessons or adjust your filter to view the full archive.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((g, idx) => grid.appendChild(buildCatalogPlate(g, idx, visitedMap)));
  }

  function renderAll() {
    const visitedMap = readVisited();
    const counts = {
      all: allGuides.length,
      Leadership: 0,
      "Mind & Calm": 0,
      "Work & Systems": 0,
      Connection: 0,
      Wisdom: 0,
      "Growth & Habits": 0
    };
    allGuides.forEach((g) => { if (counts[g.topic] !== undefined) counts[g.topic]++; });

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt("countAll", counts.all);
    setTxt("countLeadership", counts.Leadership);
    setTxt("countMind", counts["Mind & Calm"]);
    setTxt("countWork", counts["Work & Systems"]);
    setTxt("countConnection", counts.Connection);
    setTxt("countWisdom", counts.Wisdom);
    setTxt("countGrowth", counts["Growth & Habits"]);
    setTxt("catalogStatus", `${allGuides.length} lessons in the archive`);

    const censusEl = document.getElementById("archiveCensusCount");
    if (censusEl) {
      censusEl.setAttribute("data-sc-count", `0 ${allGuides.length}`);
      censusEl.textContent = String(allGuides.length);
    }

    renderReadingRoom();
    renderFeaturedGem(allGuides);
    renderGrid(allGuides, visitedMap);
    updateJourneyUI();
  }

  // Topic & Sort Listeners
  document.querySelectorAll(".topic-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".topic-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeTopic = chip.dataset.topic;
      renderGrid(allGuides, readVisited());
    });
  });

  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => renderGrid(allGuides, readVisited()));
  }

  // =========================================================================
  // 8. READING JOURNEY UI & MODAL
  // =========================================================================
  function updateJourneyUI() {
    const visited = readVisited();
    const visitedCount = Object.keys(visited).length;
    const total = allGuides.length || 1;
    const pct = Math.min(100, Math.round((visitedCount / total) * 100));

    let stage = "A Seed Is Planted";
    if (pct > 75) stage = "Ancient Grove of Wisdom";
    else if (pct > 50) stage = "Flourishing Oak Canopy";
    else if (pct > 25) stage = "Budding Young Sapling";
    else if (pct > 0) stage = "Fresh Green Sprout";

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt("journeySummary", `${visitedCount} / ${total}`);
    setTxt("journeyStageTitle", stage);
    setTxt("journeyDesc", `You have explored ${visitedCount} of ${total} lessons in the library.`);
    setTxt("journeyPercent", `${pct}%`);
    setTxt("journeyRemaining", `${Math.max(0, total - visitedCount)} remaining`);

    setTxt("colophonStage", stage);
    setTxt("colophonGroveDesc", `You have explored ${visitedCount} of ${total} distilled lessons. Progress stays private in your browser.`);
    setTxt("colophonPercent", `${pct}% explored`);
    setTxt("colophonRemaining", `${Math.max(0, total - visitedCount)} unread`);

    const fillModal = document.getElementById("journeyProgressFill");
    if (fillModal) fillModal.style.width = `${pct}%`;
    const fillColophon = document.getElementById("colophonProgressFill");
    if (fillColophon) fillColophon.style.width = `${pct}%`;
  }

  const journeyModal = document.getElementById("journeyModal");
  const openJourney = () => journeyModal?.classList.add("open");
  const closeJourney = () => journeyModal?.classList.remove("open");

  document.getElementById("journeyPill")?.addEventListener("click", openJourney);
  document.getElementById("journeyCloseBtn")?.addEventListener("click", closeJourney);
  journeyModal?.addEventListener("click", (e) => { if (e.target === journeyModal) closeJourney(); });

  function filterToUnread() {
    closeJourney();
    if (sortSelect) sortSelect.value = "unvisited";
    renderGrid(allGuides, readVisited());
    document.getElementById("completeArchive")?.scrollIntoView({ behavior: "smooth" });
  }

  document.getElementById("journeyFilterBtn")?.addEventListener("click", filterToUnread);
  document.getElementById("colophonUnreadBtn")?.addEventListener("click", filterToUnread);

  // =========================================================================
  // 9. COMMAND PALETTE (CTRL+K / ⌘K / /)
  // =========================================================================
  const cmdOverlay = document.getElementById("cmdOverlay");
  const cmdInput = document.getElementById("cmdInput");
  const cmdResults = document.getElementById("cmdResults");
  let selectedIndex = 0;
  let filteredCmdGuides = [];

  function openCommandPalette() {
    if (!cmdOverlay || !cmdInput) return;
    cmdOverlay.classList.add("open");
    cmdInput.value = "";
    updateCmdResults("");
    setTimeout(() => cmdInput.focus(), 40);
  }

  function closeCommandPalette() {
    cmdOverlay?.classList.remove("open");
  }

  document.getElementById("searchTriggerBtn")?.addEventListener("click", openCommandPalette);
  document.getElementById("heroSearchBtn")?.addEventListener("click", openCommandPalette);
  cmdOverlay?.addEventListener("click", (e) => { if (e.target === cmdOverlay) closeCommandPalette(); });

  cmdInput?.addEventListener("input", (e) => updateCmdResults(e.target.value));

  function updateCmdResults(query) {
    const q = query.trim().toLowerCase();
    filteredCmdGuides = allGuides.filter((g) => {
      if (!q) return true;
      return g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q) || g.topic.toLowerCase().includes(q);
    }).slice(0, 10);
    selectedIndex = 0;
    renderCmdItems();
  }

  function renderCmdItems() {
    if (!cmdResults) return;
    cmdResults.innerHTML = "";
    const countEl = document.getElementById("cmdResultCount");
    if (countEl) countEl.textContent = `${filteredCmdGuides.length} guides`;

    if (!filteredCmdGuides.length) {
      cmdResults.innerHTML = '<li style="padding: 1.5rem; text-align: center; color: var(--lol-ink-faint); font-family: var(--sc-font-mono); font-size: 0.82rem;">No matching lessons found</li>';
      return;
    }

    filteredCmdGuides.forEach((g, idx) => {
      const li = document.createElement("li");
      li.className = `cmd-item ${idx === selectedIndex ? "selected" : ""}`;
      li.innerHTML = `
        <div class="cmd-item-left">
          <span class="cmd-item-title">${g.title}</span>
          <div class="cmd-item-meta">
            <span>${g.topic}</span>
            <span>·</span>
            <span>${estimateReadTime(g.desc)}m read</span>
          </div>
        </div>
        <div class="cmd-item-right">Open</div>
      `;
      li.addEventListener("click", () => {
        markVisited(g.url);
        window.open(g.url, "_blank", "noopener,noreferrer");
        closeCommandPalette();
      });
      cmdResults.appendChild(li);
    });
  }

  cmdInput?.addEventListener("keydown", (e) => {
    if (!filteredCmdGuides.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredCmdGuides.length;
      renderCmdItems();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredCmdGuides.length) % filteredCmdGuides.length;
      renderCmdItems();
    } else if (e.key === "Enter" && filteredCmdGuides[selectedIndex]) {
      e.preventDefault();
      const g = filteredCmdGuides[selectedIndex];
      markVisited(g.url);
      window.open(g.url, "_blank", "noopener,noreferrer");
      closeCommandPalette();
    }
  });

  // =========================================================================
  // 10. SUPPORT MODAL (GCASH / MARIBANK) & SHARE SHEET
  // =========================================================================
  const coffeeModal = document.getElementById("coffeeModal");
  const openCoffee = () => coffeeModal?.classList.add("open");
  const closeCoffee = () => coffeeModal?.classList.remove("open");

  document.getElementById("coffeeBtn")?.addEventListener("click", openCoffee);
  document.getElementById("coffeeCloseBtn")?.addEventListener("click", closeCoffee);
  document.getElementById("colophonCoffeeBtn")?.addEventListener("click", openCoffee);
  coffeeModal?.addEventListener("click", (e) => { if (e.target === coffeeModal) closeCoffee(); });

  const tabGcash = document.getElementById("tabGcash");
  const tabMaribank = document.getElementById("tabMaribank");
  const coffeeQrImg = document.getElementById("coffeeQrImg");
  const coffeeAccountNote = document.getElementById("coffeeAccountNote");

  tabGcash?.addEventListener("click", () => {
    tabGcash.classList.add("active");
    tabMaribank?.classList.remove("active");
    if (coffeeQrImg) coffeeQrImg.src = "assets/qr-gcash.png";
    if (coffeeAccountNote) coffeeAccountNote.textContent = "Scan with your GCash app";
  });

  tabMaribank?.addEventListener("click", () => {
    tabMaribank.classList.add("active");
    tabGcash?.classList.remove("active");
    if (coffeeQrImg) coffeeQrImg.src = "assets/qr-maribank.png";
    if (coffeeAccountNote) coffeeAccountNote.textContent = "Scan with your MariBank or Seabank app";
  });

  const shareBtn = document.getElementById("shareBtn");
  const shareMenu = document.getElementById("shareMenu");
  const shareToast = document.getElementById("shareToast");

  function showToast(msg) {
    if (!shareToast) return;
    shareToast.textContent = msg;
    shareToast.classList.add("show");
    setTimeout(() => shareToast.classList.remove("show"), 2200);
  }

  async function triggerShare(e) {
    if (e) e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: window.location.href });
        return;
      } catch {}
    }
    shareMenu?.classList.toggle("open");
  }

  shareBtn?.addEventListener("click", triggerShare);
  document.getElementById("colophonShareBtn")?.addEventListener("click", () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => showToast("Archive link copied"));
    }
  });

  document.addEventListener("click", (e) => {
    if (shareMenu && !shareMenu.contains(e.target) && e.target !== shareBtn) {
      shareMenu.classList.remove("open");
    }
  });

  shareMenu?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-share]");
    if (!item) return;
    const act = item.dataset.share;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    if (act === "copy" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast("Archive link copied");
        shareMenu.classList.remove("open");
      });
    } else if (act === "x") {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, "_blank", "noopener,noreferrer");
      shareMenu.classList.remove("open");
    } else if (act === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
      shareMenu.classList.remove("open");
    } else if (act === "whatsapp") {
      window.open(`https://wa.me/?text=${title}%20${url}`, "_blank", "noopener,noreferrer");
      shareMenu.classList.remove("open");
    }
  });

  // Global keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (cmdOverlay?.classList.contains("open")) closeCommandPalette();
      else openCommandPalette();
    } else if (e.key === "Escape") {
      closeCommandPalette();
      closeCoffee();
      closeJourney();
      shareMenu?.classList.remove("open");
    } else if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      openCommandPalette();
    }
  });

  // =========================================================================
  // 11. BOOTSTRAP: IMMEDIATE FALLBACK PAINT + SCROLLCRAFT MOUNT + LIVE FETCH
  // =========================================================================
  async function fetchGuides() {
    try {
      const resp = await fetch("https://api.github.com/users/" + USERNAME + "/repos?per_page=100");
      if (!resp.ok) throw new Error("GitHub fetch failed");
      const repos = await resp.json();
      const guides = repos
        .filter((r) => !r.fork && r.name.toLowerCase() !== (USERNAME + ".github.io").toLowerCase())
        .map((r) => ({
          name: r.name,
          title: titleCase(r.name),
          desc: r.description ? r.description.trim() : "",
          url: "https://" + USERNAME.toLowerCase() + ".github.io/" + r.name + "/",
          updated: r.pushed_at,
          added: r.created_at
        }))
        .sort((a, b) => new Date(b.updated) - new Date(a.updated));

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ guides, time: Date.now() }));
      } catch {}
      return guides;
    } catch {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.guides?.length) return parsed.guides;
        }
      } catch {}
      return FALLBACK_GUIDES;
    }
  }

  // Paint immediately with fallback so ScrollCraft measures a populated pan rail
  allGuides = hydrateGuides(FALLBACK_GUIDES);
  renderAll();

  if (window.ScrollCraft && typeof window.ScrollCraft.mount === "function") {
    scInstance = window.ScrollCraft.mount(document);
  }

  // Hydrate with live GitHub repos + Supabase hearts & views
  Promise.all([fetchGuides(), loadHearts(), loadViews()]).then(([guides]) => {
    allGuides = hydrateGuides(guides);
    renderAll();
  });
})();
