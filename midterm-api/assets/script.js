const fallbackApod = {
  id: 'pillars',
  title: 'The Pillars of Creation',
  date: '2024-06-18',
  description: 'Towering columns of cool interstellar gas and dust appear otherworldly in this iconic view. Within these luminous pillars, new stars are being formed.',
  image: 'https://images-assets.nasa.gov/image/PIA17182/PIA17182~orig.jpg',
  credit: 'NASA, ESA, and the Hubble Heritage Team',
}

const fallbackGallery = [
  ['mars', 'The Red Planet', 'A global portrait of Mars, our intriguing planetary neighbor.', 'https://images-assets.nasa.gov/image/PIA00407/PIA00407~orig.jpg', 'NASA/JPL'],
  ['nebula', 'Carina Nebula', 'A spectacular stellar nursery filled with newborn stars.', 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000405/GSFC_20171208_Archive_e000405~orig.jpg', 'NASA, ESA, Hubble'],
  ['jupiter', 'Jupiter in Detail', 'Swirling storms and cloud bands across the gas giant.', 'https://images-assets.nasa.gov/image/PIA22946/PIA22946~orig.jpg', 'NASA/JPL-Caltech'],
  ['moon', 'Lunar Horizon', 'Earth rises above the quiet horizon of the Moon.', 'https://images-assets.nasa.gov/image/as11-44-6552/as11-44-6552~orig.jpg', 'NASA'],
  ['saturn', 'Saturn and Its Rings', 'The ringed world suspended against the dark of space.', 'https://images-assets.nasa.gov/image/PIA11141/PIA11141~orig.jpg', 'NASA/JPL'],
  ['galaxy', 'Andromeda Galaxy', 'Our closest large galactic neighbor, home to a trillion stars.', 'https://images-assets.nasa.gov/image/PIA04921/PIA04921~orig.jpg', 'NASA/JPL-Caltech'],
].map(([id, title, description, image, credit]) => ({ id, title, description, image, credit }))

const colors = ['#9d8cff', '#4987ff', '#e86baa', '#51c98b', '#ee8b4a', '#7950d8']
const defaultPlanet = { name: 'Aurelia', description: 'A quiet world drifting at the edge of a violet nebula.', color: colors[0], size: 74, atmosphere: 45, craters: true, rings: true, clouds: false, stripes: false, glow: true }
let apod = fallbackApod
let gallery = fallbackGallery
let selected = null
let planet = { ...defaultPlanet }
let favorites = readStore('cosmoview-favorites')
let planets = readStore('cosmoview-planets')
const apodCache = new Map()

const $ = selector => document.querySelector(selector)
const $$ = selector => [...document.querySelectorAll(selector)]
const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char])

function readStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function notify(message) {
  const toast = $('#toast')
  toast.textContent = `✦ ${message}`
  toast.hidden = false
  clearTimeout(notify.timer)
  notify.timer = setTimeout(() => { toast.hidden = true }, 2200)
}
function goToPage(page) {
  $$('.page-view').forEach(view => view.classList.toggle('active', view.id === page))
  $$('#nav-links [data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === page))
  $('#nav-links').classList.remove('open')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (page === 'apod') loadApod($('#apod-date').value)
  if (page === 'discoveries') renderDiscoveries()
}

$$('[data-page]').forEach(button => button.addEventListener('click', () => goToPage(button.dataset.page)))
$('#menu-toggle').addEventListener('click', () => $('#nav-links').classList.toggle('open'))

async function loadApod(date = '') {
  $('#apod-card').classList.add('loading')
  $('#apod-status').textContent = 'Contacting NASA’s astronomy archive…'
  if (date && apodCache.has(date)) {
    apod = apodCache.get(date)
    renderApod()
    $('#apod-card').classList.remove('loading')
    $('#apod-status').textContent = `Showing NASA’s picture for ${formatDate(apod.date)}`
    return
  }
  try {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true${date ? `&date=${date}` : ''}`)
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error?.message || `NASA request failed (${response.status})`)
    }
    const data = await response.json()
    apod = {
      id: data.date,
      title: data.title,
      description: data.explanation,
      image: data.hdurl || data.thumbnail_url || data.url,
      date: data.date,
      credit: data.copyright || 'NASA',
      mediaType: data.media_type,
      sourceUrl: data.url,
    }
    apodCache.set(data.date, apod)
    $('#apod-date').value = data.date
    $('#apod-status').textContent = data.media_type === 'video'
      ? `This date features a NASA video; showing its preview image.`
      : `Showing NASA’s picture for ${formatDate(data.date)}`
  } catch (error) {
    $('#apod-status').textContent = `${error.message}. Please try another date in a moment.`
    notify('NASA could not load that date.')
  }
  renderApod()
  $('#apod-card').classList.remove('loading')
}
function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
function renderApod() {
  $('#apod-image').src = apod.image
  $('#apod-image').alt = apod.title
  $('#apod-title').textContent = apod.title
  $('#apod-description').textContent = apod.description
  $('#apod-meta').textContent = `${apod.date || 'Featured image'} • ${apod.credit || 'NASA'}`
  $('#save-apod').textContent = favorites.some(item => item.id === apod.id) ? '♥ Saved' : '♡ Save discovery'
}
$('#apod-date').max = new Date().toISOString().slice(0, 10)
$('#apod-date-form').addEventListener('submit', event => {
  event.preventDefault()
  loadApod($('#apod-date').value)
})
$('#apod-date').addEventListener('change', event => loadApod(event.target.value))
function stepApodDate(amount) {
  const input = $('#apod-date')
  const base = input.value ? new Date(`${input.value}T12:00:00`) : new Date()
  base.setDate(base.getDate() + amount)
  const nextDate = base.toISOString().slice(0, 10)
  if (nextDate < input.min || nextDate > input.max) return
  input.value = nextDate
  loadApod(nextDate)
}
$('#apod-previous').addEventListener('click', () => stepApodDate(-1))
$('#apod-next').addEventListener('click', () => stepApodDate(1))
$('#apod-image-button').addEventListener('click', () => openModal(apod))
$('#save-apod').addEventListener('click', () => toggleFavorite(apod))

$('#search-form').addEventListener('submit', async event => {
  event.preventDefault()
  const button = event.currentTarget.querySelector('button')
  const term = $('#search-input').value.trim() || 'nebula'
  button.textContent = 'Searching…'
  try {
    const response = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(term)}&media_type=image&page_size=12`)
    if (!response.ok) throw new Error()
    const data = await response.json()
    gallery = data.collection.items.slice(0, 12).map(item => ({
      id: item.data[0].nasa_id, title: item.data[0].title,
      description: item.data[0].description || 'Explore this image from NASA’s archive.',
      date: item.data[0].date_created?.slice(0, 10), credit: item.data[0].center || 'NASA',
      image: item.links?.[0]?.href,
    })).filter(item => item.image)
    if (!gallery.length) gallery = fallbackGallery
  } catch {
    gallery = fallbackGallery
    notify('Could not reach NASA—showing curated discoveries.')
  }
  renderGallery($('#gallery'), gallery)
  button.textContent = 'Search the cosmos'
})
$$('[data-query]').forEach(button => button.addEventListener('click', () => {
  $('#search-input').value = button.dataset.query
  $('#search-form').requestSubmit()
}))

function renderGallery(container, items) {
  container.className = 'gallery-grid'
  container.innerHTML = items.map(item => `
    <article class="image-card">
      <button class="image-wrap" data-view="${escapeHtml(item.id)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy"><span class="view-label">View story →</span></button>
      <button class="favorite ${favorites.some(f => f.id === item.id) ? 'saved' : ''}" data-save="${escapeHtml(item.id)}" aria-label="Save image">♡</button>
      <div class="image-card-copy"><span>${escapeHtml(item.credit || 'NASA')}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div>
    </article>`).join('')
  container.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => openModal(items.find(item => item.id === button.dataset.view))))
  container.querySelectorAll('[data-save]').forEach(button => button.addEventListener('click', () => toggleFavorite(items.find(item => item.id === button.dataset.save))))
}

function toggleFavorite(item) {
  const exists = favorites.some(favorite => favorite.id === item.id)
  favorites = exists ? favorites.filter(favorite => favorite.id !== item.id) : [...favorites, item]
  saveStore('cosmoview-favorites', favorites)
  updateCount()
  renderGallery($('#gallery'), gallery)
  renderApod()
  if ($('#discoveries').classList.contains('active')) renderDiscoveries()
  if (selected?.id === item.id) $('#modal-save').textContent = exists ? '♡ Save image' : '♥ Saved'
  notify(exists ? 'Removed from discoveries' : 'Saved to discoveries')
}
function openModal(item) {
  selected = item
  $('#modal-image').src = item.image
  $('#modal-image').alt = item.title
  $('#modal-title').textContent = item.title
  $('#modal-description').textContent = item.description
  $('#modal-date').textContent = item.date || 'NASA image archive'
  $('#modal-credit').innerHTML = `Image credit: <strong>${escapeHtml(item.credit || 'NASA')}</strong>`
  $('#modal-save').textContent = favorites.some(f => f.id === item.id) ? '♥ Saved' : '♡ Save image'
  $('#image-modal').hidden = false
}
function closeModal() { $('#image-modal').hidden = true; selected = null }
$('#modal-close').addEventListener('click', closeModal)
$('#image-modal').addEventListener('click', event => { if (event.target.id === 'image-modal') closeModal() })
$('#modal-save').addEventListener('click', () => selected && toggleFavorite(selected))
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal() })

function updatePlanet() {
  const preview = $('#planet-preview')
  preview.style.width = `${planet.size}%`
  preview.style.backgroundColor = planet.color
  preview.style.filter = `saturate(${1 + planet.atmosphere / 180})`
  preview.style.boxShadow = planet.glow ? `0 0 ${28 + planet.atmosphere}px color-mix(in srgb, ${planet.color} 65%, transparent)` : 'none'
  preview.className = `planet${planet.craters ? ' has-craters' : ''}${planet.clouds ? ' has-clouds' : ''}${planet.stripes ? ' has-stripes' : ''}`
  $('#planet-rings').style.display = planet.rings ? '' : 'none'
  $('#planet-rings').style.width = `${planet.size * 1.42}%`
  $('#planet-rings').style.borderColor = planet.color
  $('#preview-name').textContent = planet.name || 'Unnamed world'
  $('#preview-description').textContent = planet.description
  $('#planet-name').value = planet.name
  $('#planet-description').value = planet.description
  $('#planet-size').value = planet.size
  $('#planet-atmosphere').value = planet.atmosphere
  $('#size-value').textContent = `${planet.size}%`
  $('#atmosphere-value').textContent = `${planet.atmosphere}%`
  $$('#color-options button').forEach(button => button.classList.toggle('selected', button.dataset.color === planet.color))
  $$('#features input').forEach(input => { input.checked = planet[input.dataset.feature] })
}
$('#planet-name').addEventListener('input', event => { planet.name = event.target.value; updatePlanet() })
$('#planet-description').addEventListener('input', event => { planet.description = event.target.value; updatePlanet() })
$('#planet-size').addEventListener('input', event => { planet.size = Number(event.target.value); updatePlanet() })
$('#planet-atmosphere').addEventListener('input', event => { planet.atmosphere = Number(event.target.value); updatePlanet() })
$$('#color-options button').forEach(button => button.addEventListener('click', () => { planet.color = button.dataset.color; updatePlanet() }))
$$('#features input').forEach(input => input.addEventListener('change', () => { planet[input.dataset.feature] = input.checked; updatePlanet() }))
$('#randomize').addEventListener('click', () => {
  planet = { ...planet, color: colors[Math.floor(Math.random() * colors.length)], size: 52 + Math.floor(Math.random() * 38), atmosphere: 20 + Math.floor(Math.random() * 70), rings: Math.random() > .5, craters: Math.random() > .5, clouds: Math.random() > .5, stripes: Math.random() > .5, glow: Math.random() > .35 }
  updatePlanet()
})
$('#reset').addEventListener('click', () => { planet = { ...defaultPlanet }; updatePlanet() })
$('#save-planet').addEventListener('click', () => {
  planets.unshift({ ...planet, id: String(Date.now()) })
  saveStore('cosmoview-planets', planets)
  updateCount()
  notify(`${planet.name || 'Your planet'} joined the collection`)
})

function renderDiscoveries() {
  $('#favorite-total').textContent = `${favorites.length} saved`
  $('#planet-total').textContent = `${planets.length} worlds`
  const favoriteList = $('#favorite-list')
  if (favorites.length) renderGallery(favoriteList, favorites)
  else favoriteList.innerHTML = `<div class="empty"><div>✦</div><p>No images saved yet.</p><button class="btn-cosmo secondary" data-empty-page="explore">Explore NASA images →</button></div>`
  const planetList = $('#planet-list')
  planetList.className = planets.length ? 'saved-planets' : ''
  planetList.innerHTML = planets.length ? planets.map(item => `
    <div class="saved-planet"><div class="mini-space"><div class="mini-planet ${item.stripes ? 'has-stripes' : ''}" style="background-color:${item.color};box-shadow:${item.glow ? `0 0 34px ${item.color}` : 'none'}"></div></div>
    <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div><button data-delete="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">×</button></div>`).join('') :
    `<div class="empty"><div>✦</div><p>No planets created yet.</p><button class="btn-cosmo secondary" data-empty-page="studio">Open Planet Studio →</button></div>`
  $$('[data-delete]').forEach(button => button.addEventListener('click', () => {
    planets = planets.filter(item => item.id !== button.dataset.delete)
    saveStore('cosmoview-planets', planets)
    updateCount(); renderDiscoveries()
  }))
  $$('[data-empty-page]').forEach(button => button.addEventListener('click', () => goToPage(button.dataset.emptyPage)))
}
function updateCount() { $('#saved-count').textContent = favorites.length + planets.length }

renderGallery($('#gallery'), gallery)
renderApod()
updatePlanet()
updateCount()
