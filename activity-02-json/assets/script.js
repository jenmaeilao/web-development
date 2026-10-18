/* ============================================================
   IMAGES: paste your own image URLs between the quotes.
   Leave "" to show a plain color instead.
   (Trip card images are in DATA.tripTypes below, "image" field.)
   ============================================================ */
var IMAGES = { hero: "https://i.pinimg.com/1200x/50/49/3c/50493c2b1058a2adafe9bf753218485f.jpg" };

/* ============================================================
   EMBEDDED JSON DATA (no fetch, no .json file)
   ============================================================ */
var DATA = {
  categories: [
    { id: "documents", label: "Documents", icon: "file-earmark-text" },
    { id: "clothes", label: "Clothes", icon: "bag" },
    { id: "shoes", label: "Shoes", icon: "person-walking" },
    { id: "essentials", label: "Essentials", icon: "backpack" },
    { id: "toiletries", label: "Toiletries", icon: "droplet-half" },
    { id: "gadgets", label: "Gadgets", icon: "plug" }
  ],
  base: {
    documents: ["Valid ID", "Booking confirmation"],
    clothes: ["Underwear", "Socks", "Sleepwear", "Everyday tops", "Everyday bottoms"],
    shoes: ["Comfortable walking shoes"],
    essentials: ["Wallet and cash", "Medications", "Reusable water bottle"],
    toiletries: ["Toothbrush and toothpaste", "Deodorant", "Shampoo and soap"],
    gadgets: ["Phone and charger", "Power bank"]
  },

  suggestedSections: [
    { label: "Makeup", icon: "brush", items: ["Foundation", "Lipstick", "Makeup brushes", "Makeup remover"] },
    { label: "Skincare", icon: "droplet", items: ["Cleanser", "Moisturizer", "Face sunscreen"] },
    { label: "Pets", icon: "heart-fill", items: ["Pet food", "Leash", "Vaccination card"] },
    { label: "Work", icon: "briefcase", items: ["Laptop and charger", "Notebook", "Work ID"] },
    { label: "Kids", icon: "balloon", items: ["Diapers", "Favorite toy", "Snacks"] },
    { label: "Snacks", icon: "cup-hot", items: ["Trail mix", "Chips", "Instant coffee"] }
  ],

  iconChoices: ["puzzle", "star", "heart", "camera", "music-note-beamed", "book", "gift", "umbrella", "bicycle", "controller", "capsule", "brush"],

  travelTypes: {
    domestic: { label: "Domestic", icon: "bus-front", blurb: "Within your own country", items: {} },
    international: {
      label: "International", icon: "airplane", blurb: "Adds passport, visa and travel documents",
      items: {
        documents: ["Passport (valid 6+ months)", "Visa (if required)", "Travel insurance",
          "Return or onward ticket", "Immigration / arrival forms", "Photocopies of documents"],
        essentials: ["Foreign currency"], gadgets: ["Travel adapter"]
      }
    }
  },

  tripTypes: {
    beach: {
      label: "Beach", icon: "sun", blurb: "Sun, sand and swimming", image: "https://i.pinimg.com/736x/76/9f/97/769f9735f78949879ab484e98e8a317d.jpg",
      items: {
        clothes: ["Swimwear", "Cover-up", "Light summer clothes"], shoes: ["Flip-flops"],
        essentials: ["Sunglasses", "Hat or cap", "Beach towel", "Dry bag"],
        toiletries: ["Sunscreen", "After-sun lotion", "Lip balm with SPF"]
      }
    },
    mountain: {
      label: "Mountain", icon: "tree", blurb: "Hikes, cold nights and trails", image: "https://i.pinimg.com/736x/70/b2/5f/70b25f374eb7555fa3de15c820fca986.jpg",
      items: {
        clothes: ["Thermal wear", "Fleece jacket", "Rain jacket", "Hiking pants", "Beanie and gloves"],
        shoes: ["Hiking boots", "Extra wool socks"],
        essentials: ["Headlamp", "Daypack", "Trail snacks", "Offline maps"],
        toiletries: ["Insect repellent", "First-aid kit"]
      }
    },
    city: {
      label: "City", icon: "buildings", blurb: "Museums, food and lots of walking", image: "https://i.pinimg.com/736x/15/cb/f9/15cbf96e70071653184455abead19370.jpg",
      items: {
        clothes: ["Smart-casual outfit", "Light jacket"], shoes: ["Broken-in sneakers"],
        essentials: ["Day bag", "Umbrella", "Transit card"], gadgets: ["Portable Wi-Fi or SIM", "Camera"]
      }
    },
    province: {
      label: "Province", icon: "house", blurb: "Countryside, family and slow days", image: "https://i.pinimg.com/736x/ab/89/d8/ab89d863578a3d9df2e198c804b9f130.jpg",
      items: {
        clothes: ["Light layers", "Modest outfit for visits"], shoes: ["Sturdy sandals"],
        essentials: ["Pasalubong or gifts", "Extra cash (ATMs may be far)", "Flashlight"],
        toiletries: ["Insect repellent"]
      }
    },
    custom: { label: "Custom", icon: "pencil-square", blurb: "Start with the basics, add your own", image: "https://i.pinimg.com/1200x/86/37/95/86379547d1352a3469ae1b56314cc085.jpg", items: {} }
  }
};

function freshState(name) {
  return {
    name: name || "", travelType: null, tripType: null, query: "",
    checked: {}, removed: {}, custom: {}, customCats: [], depart: null, ret: null
  };
}

var state = freshState();
var today = new Date(); today.setHours(0, 0, 0, 0);
var calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
var secCounter = 0;
var pickIcon = "puzzle";

function $(id) { return document.getElementById(id); }
function ic(name) { return '<i class="bi bi-' + name + '" aria-hidden="true"></i>'; }
function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML.replace(/"/g, "&quot;"); }
function keyOf(cat, name) { return cat + "::" + name; }
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
function daysBetween(a, b) { return Math.round((b - a) / 864e5); }
function fmt(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtShort(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function allCats() { return DATA.categories.concat(state.customCats); }

function countItems(obj) {
  var keys = Object.keys(obj), n = 0;
  for (var i = 0; i < keys.length; i++) n += obj[keys[i]].length;
  return n;
}

function buildList() {
  var list = {};
  var sources = [
    DATA.base,
    state.travelType ? DATA.travelTypes[state.travelType].items : {},
    state.tripType ? DATA.tripTypes[state.tripType].items : {},
    state.custom
  ];
  for (var s = 0; s < sources.length; s++) {
    var src = sources[s], cats = Object.keys(src);
    for (var c = 0; c < cats.length; c++) {
      var cat = cats[c];
      list[cat] = list[cat] || [];
      for (var n = 0; n < src[cat].length; n++) {
        var name = src[cat][n];
        if (list[cat].indexOf(name) === -1 && !state.removed[keyOf(cat, name)]) list[cat].push(name);
      }
    }
  }
  for (var i = 0; i < state.customCats.length; i++) {
    var id = state.customCats[i].id;
    list[id] = list[id] || [];
  }
  return list;
}

function countCat(list, cat) {
  var items = list[cat] || [], done = 0;
  for (var i = 0; i < items.length; i++) {
    if (state.checked[keyOf(cat, items[i])]) done++;
  }
  return { total: items.length, done: done };
}

function getProgress(list) {
  var keys = Object.keys(list), t = 0, d = 0;
  for (var i = 0; i < keys.length; i++) {
    var x = countCat(list, keys[i]);
    t += x.total; d += x.done;
  }
  return { total: t, done: d, percent: t ? Math.round(d / t * 100) : 0 };
}

function addItem(cat, name) {
  name = (name || "").trim();
  if (!name) return false;
  var current = buildList()[cat] || [];
  for (var i = 0; i < current.length; i++) {
    if (current[i].toLowerCase() === name.toLowerCase()) return false;
  }
  delete state.removed[keyOf(cat, name)];
  state.custom[cat] = (state.custom[cat] || []).concat(name);
  return true;
}

function addSection(label, icon, items) {
  label = (label || "").trim();
  if (!label) return "Give your section a name first.";
  var cats = allCats();
  for (var i = 0; i < cats.length; i++) {
    if (cats[i].label.toLowerCase() === label.toLowerCase()) return '"' + label + '" already exists.';
  }
  var id = "c" + (++secCounter);
  state.customCats.push({ id: id, label: label, icon: icon || "puzzle" });
  if (items && items.length) state.custom[id] = items.slice();
  return 'Added section "' + label + '".';
}

function renderTrip() {
  var html = "", i, k, o;

  var travelKeys = Object.keys(DATA.travelTypes);
  for (i = 0; i < travelKeys.length; i++) {
    k = travelKeys[i]; o = DATA.travelTypes[k];
    var on = k === state.travelType;
    html += '<button type="button" class="tab' + (on ? " on" : "") + '" data-travel="' + k + '" aria-pressed="' + on + '">' +
      ic(o.icon) + " " + esc(o.label) + "<small>" + esc(o.blurb) + "</small></button>";
  }
  $("travelTabs").innerHTML = html;

  html = "";
  var tripKeys = Object.keys(DATA.tripTypes);
  for (i = 0; i < tripKeys.length; i++) {
    k = tripKeys[i]; o = DATA.tripTypes[k];
    var sel = k === state.tripType;
    var bg = o.image ? ' style="background-image:url(\'' + esc(o.image) + '\')"' : "";
    html += '<button type="button" class="dest g' + (i % 5) + (sel ? " sel" : "") + '" data-trip="' + k + '" aria-pressed="' + sel + '"' + bg + ">" +
      '<span class="big-e">' + ic(o.icon) + '</span><span class="pill">' + (sel ? "Selected" : countItems(o.items) + " items") + "</span>" +
      "<strong>" + esc(o.label) + "</strong><small>" + esc(o.blurb) + "</small></button>";
  }
  $("tripTrack").innerHTML = html;
}

function renderChecklist() {
  var list = buildList(), q = state.query.toLowerCase(), html = "", shown = 0;
  var cats = allCats();

  for (var c = 0; c < cats.length; c++) {
    var cat = cats[c], items = list[cat.id];
    if (!items) continue;

    var vis = [], j;
    for (j = 0; j < items.length; j++) {
      if (!q || items[j].toLowerCase().indexOf(q) !== -1) vis.push(items[j]);
    }
    if (q && !vis.length) continue;
    shown++;

    var mine = false;
    for (j = 0; j < state.customCats.length; j++) {
      if (state.customCats[j].id === cat.id) mine = true;
    }

    html += '<section class="cat"><div class="cat-head"><span class="cat-ico">' + ic(cat.icon) + "</span><h5>" + esc(cat.label) +
      '</h5><span class="tag" data-count="' + cat.id + '"></span>' +
      (mine ? '<button type="button" class="x" data-del-sec="' + cat.id + '" aria-label="Delete section ' + esc(cat.label) + '" title="Delete section">' + ic("trash3") + "</button>" : "") + "</div>";
    if (!vis.length) html += '<div class="empty">Nothing here yet. Add your first item below.</div>';

    for (var i = 0; i < vis.length; i++) {
      var name = vis[i], id = "chk-" + cat.id + "-" + i;
      html += '<div class="item-row"><input type="checkbox" id="' + id + '" data-cat="' + cat.id + '" data-name="' + esc(name) + '"' +
        (state.checked[keyOf(cat.id, name)] ? " checked" : "") + '><label for="' + id + '">' + esc(name) + "</label>" +
        '<button type="button" class="x" data-rm-cat="' + cat.id + '" data-name="' + esc(name) + '" aria-label="Remove ' + esc(name) + '">' + ic("x-lg") + "</button></div>";
    }
    html += '<form class="add-form" data-cat="' + cat.id + '"><input type="text" maxlength="60" placeholder="Add to ' + esc(cat.label.toLowerCase()) +
      '" aria-label="Add item to ' + esc(cat.label) + '"><button type="submit">Add</button></form></section>';
  }
  $("catGrid").innerHTML = shown ? html : '<p class="empty">No items match "' + esc(state.query) + '".</p>';
}

function renderIconPick() {
  var html = "";
  for (var i = 0; i < DATA.iconChoices.length; i++) {
    var n = DATA.iconChoices[i];
    html += '<button type="button" class="icon-btn' + (n === pickIcon ? " on" : "") + '" data-icon="' + n + '" role="radio" aria-checked="' + (n === pickIcon) +
      '" aria-label="' + n.replace(/-/g, " ") + '">' + ic(n) + "</button>";
  }
  $("iconPick").innerHTML = html;
}

function renderSuggestions() {
  var cats = allCats(), have = [], open = [], i;
  for (i = 0; i < cats.length; i++) have.push(cats[i].label.toLowerCase());
  for (i = 0; i < DATA.suggestedSections.length; i++) {
    if (have.indexOf(DATA.suggestedSections[i].label.toLowerCase()) === -1) open.push(DATA.suggestedSections[i]);
  }

  var chips = "";
  for (i = 0; i < open.length; i++) {
    chips += '<button type="button" class="chip" data-sugg="' + esc(open[i].label) + '">' + ic(open[i].icon) + " " + esc(open[i].label) + "</button>";
  }
  $("chips").innerHTML = open.length ? chips : '<span class="note">All suggestions added. Create your own above.</span>';

  var tiles = "";
  for (i = 0; i < open.length && i < 5; i++) {
    tiles += '<button type="button" class="tile" data-sugg="' + esc(open[i].label) + '" aria-label="Add ' + esc(open[i].label) + ' section">' +
      ic(open[i].icon) + "<span>" + esc(open[i].label) + "</span></button>";
  }
  tiles += '<button type="button" class="tile plus" data-go="addSec" aria-label="Create a custom section">' + ic("plus-lg") + "</button>";
  $("tiles").innerHTML = tiles;
}

function updateStats() {
  var list = buildList(), p = getProgress(list), docs = countCat(list, "documents");
  var h = new Date().getHours(), hello = h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  var days = state.depart ? daysBetween(today, parse(state.depart)) : null, left = p.total - p.done;
  var ready = state.travelType && state.tripType;

  $("greeting").textContent = hello + (state.name ? ", " + state.name : "");
  $("greetSub").textContent = ready ? "You have " + left + " items left to pack. Let's get you ready." : "Welcome! Pick your trip to build your packing list.";
  $("avatar").textContent = (state.name || "?").charAt(0).toUpperCase();
  $("profileName").textContent = state.name || "Traveler";
  $("profileSub").textContent = p.total + " items on your list";
  $("bigPct").textContent = p.percent + "%";
  $("barFill").style.width = p.percent + "%";
  $("packText").textContent = p.done + " of " + p.total + " packed";
  $("docsText").textContent = "Docs " + docs.done + "/" + docs.total;
  $("pcDays").textContent = days === null ? "No date yet" : days > 0 ? days + (days === 1 ? " day" : " days") + " to go" : days === 0 ? "Departing today" : "Trip started";
  $("listSub").textContent = ready ? left + " of " + p.total + " items left. Tick them off as you pack." : "Choose a travel type and trip type above to load defaults. You can still add items anytime.";
  $("doneBanner").innerHTML = p.total && p.done === p.total ? '<div class="done-banner"><strong>All packed.</strong> Have a great trip!</div>' : "";

  var bar = "Pick your dates";
  if (state.depart && state.ret) bar = fmtShort(parse(state.depart)) + " to " + fmtShort(parse(state.ret));
  else if (state.depart) bar = "From " + fmtShort(parse(state.depart));
  $("barDates").textContent = bar;

  var cats = allCats();
  for (var i = 0; i < cats.length; i++) {
    var el = document.querySelector('[data-count="' + cats[i].id + '"]');
    if (!el || !list[cats[i].id]) continue;
    var x = countCat(list, cats[i].id);
    el.textContent = x.done + "/" + x.total;
    el.className = "tag" + (x.total && x.done === x.total ? " done" : "");
  }
}

function renderCalendar() {
  var y = calMonth.getFullYear(), m = calMonth.getMonth();
  var offset = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  var dow = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], i, d;

  var html = '<div class="cal-head"><button type="button" class="cal-nav" data-cal="-1" aria-label="Previous month">' + ic("chevron-left") +
    '</button><span class="cal-month">' + calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }) +
    '</span><button type="button" class="cal-nav" data-cal="1" aria-label="Next month">' + ic("chevron-right") + '</button></div><div class="cal-grid">';
  for (i = 0; i < dow.length; i++) html += '<div class="cal-dow">' + dow[i] + "</div>";
  for (i = 0; i < offset; i++) html += "<div></div>";
  for (d = 1; d <= days; d++) {
    var s = ymd(new Date(y, m, d)), cls = "cal-day";
    if (s === ymd(today)) cls += " today";
    if (state.depart && state.ret && s > state.depart && s < state.ret) cls += " range";
    if (s === state.depart || s === state.ret) cls += " edge";
    html += '<button type="button" class="' + cls + '" data-date="' + s + '">' + d + "</button>";
  }
  $("calendar").innerHTML = html + '</div><p class="cal-hint">Tap a date for departure, then another for return.</p>';
}

function renderTimeline() {
  var dep = state.depart ? parse(state.depart) : null, ret = state.ret ? parse(state.ret) : null;
  var rows = [["Departure", dep ? fmt(dep) : "Not set"], ["Return", ret ? fmt(ret) : "Not set"]];
  if (dep && ret) rows.push(["Trip length", (daysBetween(dep, ret) + 1) + " days"]);
  if (dep) {
    rows.push(["Start packing", fmt(addDays(dep, -3))]);
    if (state.travelType === "international") rows.push(["Documents ready by", fmt(addDays(dep, -7))]);
  }
  var html = "";
  for (var i = 0; i < rows.length; i++) {
    html += '<div class="tl-row"><span>' + rows[i][0] + "</span><span>" + rows[i][1] + "</span></div>";
  }
  $("timeline").innerHTML = html;
}

function renderAll() { renderTrip(); renderChecklist(); renderSuggestions(); renderTimeline(); updateStats(); }

/* ============================================================
   EVENTS
   ============================================================ */
document.addEventListener("click", function (e) {
  var t;
  if ((t = e.target.closest("[data-travel]"))) { state.travelType = t.dataset.travel; renderTrip(); renderChecklist(); renderTimeline(); updateStats(); return; }
  if ((t = e.target.closest("[data-trip]"))) { state.tripType = t.dataset.trip; renderTrip(); renderChecklist(); updateStats(); return; }

  if ((t = e.target.closest("[data-rm-cat]"))) {
    var cat = t.dataset.rmCat, name = t.dataset.name;
    if (state.custom[cat]) {
      var kept = [];
      for (var i = 0; i < state.custom[cat].length; i++) {
        if (state.custom[cat][i] !== name) kept.push(state.custom[cat][i]);
      }
      state.custom[cat] = kept;
    }
    state.removed[keyOf(cat, name)] = true; delete state.checked[keyOf(cat, name)];
    renderChecklist(); updateStats(); return;
  }

  if ((t = e.target.closest("[data-del-sec]"))) {
    var id = t.dataset.delSec, remaining = [], j;
    for (j = 0; j < state.customCats.length; j++) {
      if (state.customCats[j].id !== id) remaining.push(state.customCats[j]);
    }
    state.customCats = remaining; delete state.custom[id];
    var ck = Object.keys(state.checked);
    for (j = 0; j < ck.length; j++) {
      if (ck[j].indexOf(id + "::") === 0) delete state.checked[ck[j]];
    }
    renderChecklist(); renderSuggestions(); updateStats(); return;
  }

  if ((t = e.target.closest("[data-icon]"))) { pickIcon = t.dataset.icon; renderIconPick(); return; }

  if ((t = e.target.closest("[data-sugg]"))) {
    var s = null;
    for (var k = 0; k < DATA.suggestedSections.length; k++) {
      if (DATA.suggestedSections[k].label === t.dataset.sugg) s = DATA.suggestedSections[k];
    }
    if (s) $("secMsg").textContent = addSection(s.label, s.icon, s.items);
    renderChecklist(); renderSuggestions(); updateStats(); return;
  }

  if ((t = e.target.closest("[data-go]"))) {
    var target = $(t.dataset.go);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (t.dataset.go === "addSec") setTimeout(function () { $("secName").focus({ preventScroll: true }); }, 350);
    var btns = document.querySelectorAll(".nav-btn[data-go]");
    for (var b = 0; b < btns.length; b++) {
      btns[b].classList.toggle("active", btns[b].dataset.go === t.dataset.go);
    }
    var menu = $("menu");
    if (menu.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(menu).hide();
    return;
  }

  if ((t = e.target.closest("[data-cal]"))) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +t.dataset.cal, 1); renderCalendar(); return; }

  if ((t = e.target.closest("[data-date]"))) {
    var d = t.dataset.date;
    if (!state.depart || state.ret || d < state.depart) { state.depart = d; state.ret = null; }
    else if (d === state.depart) state.depart = null;
    else state.ret = d;
    renderCalendar(); renderTimeline(); updateStats();
  }
});

$("catGrid").addEventListener("change", function (e) {
  if (e.target.type !== "checkbox") return;
  var k = keyOf(e.target.dataset.cat, e.target.dataset.name);
  if (e.target.checked) state.checked[k] = true; else delete state.checked[k];
  updateStats();
});

$("catGrid").addEventListener("submit", function (e) {
  e.preventDefault();
  var form = e.target, cat = form.dataset.cat, input = form.querySelector("input");
  if (addItem(cat, input.value)) { renderChecklist(); updateStats(); }
  var again = document.querySelector('.add-form[data-cat="' + cat + '"] input');
  if (again) { again.value = ""; again.focus(); }
});

$("secForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var msg = addSection($("secName").value, pickIcon, []);
  $("secMsg").textContent = msg;
  if (msg.indexOf("Added") === 0) { $("secName").value = ""; renderChecklist(); renderSuggestions(); updateStats(); }
});

$("search").addEventListener("input", function (e) { state.query = e.target.value.trim(); renderChecklist(); updateStats(); });
$("nameInput").addEventListener("input", function (e) { state.name = e.target.value.trim(); updateStats(); });

$("btnReset").addEventListener("click", function () {
  if (!confirm("Clear your trip, list, custom sections and dates?")) return;
  state = freshState(state.name); $("search").value = ""; $("secMsg").textContent = "";
  renderCalendar(); renderAll();
});

if (IMAGES.hero) {
  document.querySelector(".hero").style.backgroundImage = "url('" + IMAGES.hero + "')";
}
renderCalendar();
renderIconPick();
renderAll();

(function () {
  var nav = document.getElementById("siteNav");
  var ticking = false;

  function updateNav() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var isCapsule = nav.classList.contains("is-capsule");
    if (!isCapsule && y > 60) nav.classList.add("is-capsule");
    else if (isCapsule && y < 20) nav.classList.remove("is-capsule");
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateNav); }
  }, { passive: true });

  updateNav();
})();