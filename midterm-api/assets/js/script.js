const colors=['#9d8cff','#4987ff','#e86baa','#51c98b','#ee8b4a','#7950d8']
const defaultPlanet={name:'Aurelia',description:'A quiet world drifting at the edge of a violet nebula.',color:colors[0],size:74,atmosphere:45,craters:true,rings:true,clouds:false,stripes:false,glow:true}
let apod=null,gallery=[],selected=null,planet={...defaultPlanet}
let favorites=readStore('cosmoview-favorites'),planets=readStore('cosmoview-planets')
let exploreQuery='nebula',explorePage=1,exploreTotal=0,exploreLoaded=false
const pageSize=12,apodCache=new Map(),$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)]
const escapeHtml=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c])
function sanitizeHtml(value){
  const t=document.createElement('template');t.innerHTML=String(value||'')
  const allowed=new Set(['A','B','BR','EM','I','LI','OL','P','STRONG','UL'])
  ;[...t.content.querySelectorAll('*')].forEach(n=>{
    if(!allowed.has(n.tagName)){n.replaceWith(...n.childNodes);return}
    const href=n.tagName==='A'?n.getAttribute('href'):null;[...n.attributes].forEach(a=>n.removeAttribute(a.name))
    if(href){try{const u=new URL(href,'https://science.nasa.gov');if(!['http:','https:'].includes(u.protocol))throw 0;n.href=u.href;n.target='_blank';n.rel='noopener noreferrer'}catch{}}
  });return t.innerHTML
}
function htmlToText(v){const t=document.createElement('template');t.innerHTML=sanitizeHtml(v);return(t.content.textContent||'').replace(/\s+/g,' ').trim()}
function readStore(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return[]}}
function saveStore(k,v){localStorage.setItem(k,JSON.stringify(v))}
function notify(m){const t=$('#toast');t.textContent=`✦ ${m}`;t.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.hidden=true,2200)}
function goToPage(page){
  $$('.page-view').forEach(v=>v.classList.toggle('active',v.id===page));$$('#nav-links [data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#nav-links').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'})
  if(page==='apod'&&!apod)loadApod($('#apod-date').value);if(page==='explore'&&!exploreLoaded)loadExplore(exploreQuery,1);if(page==='discoveries')renderDiscoveries()
  if(page==='planet-explorer'||page==='planet-comparison')loadPlanetData().catch(()=>{})
}
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>goToPage(b.dataset.page)));$('#menu-toggle').addEventListener('click',()=>$('#nav-links').classList.toggle('open'))
function formatDate(d){return new Date(`${d}T12:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}
async function loadApod(date){
  const requested=date||new Date().toISOString().slice(0,10),card=$('#apod-card');card.hidden=false;card.classList.add('loading');$('#apod-feedback').hidden=true;$('#apod-status').textContent='Contacting NASA’s astronomy archive…'
  if(apodCache.has(requested)){apod=apodCache.get(requested);renderApod();card.classList.remove('loading');return}
  try{
    const compact=requested.slice(2).replaceAll('-',''),r=await fetch(`https://science.nasa.gov/wp-json/wp/v2/apod-basic?date_from=${compact}&date_to=${compact}&per_page=1`)
    if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.message||`NASA request failed (${r.status})`)}
    const records=await r.json();if(!records.length)throw new Error('NASA has no APOD entry for this date')
    const d=records[0];apod={id:String(d.post_id||d.date),title:d.title||'Untitled astronomy image',description:d.explanation||'',image:d.hdurl,date:d.date,credit:d.copyright||d.credit||'NASA',mediaType:d.media_type,sourceUrl:d.url,alt:d.alt}
    if(!apod.image)throw new Error('NASA did not provide a preview for this entry')
    apodCache.set(d.date,apod);$('#apod-date').value=d.date;renderApod()
  }catch(error){apod=null;card.hidden=true;$('#apod-feedback').hidden=false;$('#apod-feedback-title').textContent=error.message.includes('no APOD')?'No picture found':'Unable to load this picture';$('#apod-feedback-message').textContent=`${error.message}. Choose another date or try again.`;$('#apod-status').textContent=''}
  card.classList.remove('loading')
}
function renderApod(){
  if(!apod)return;const img=$('#apod-image');img.src=apod.image;img.alt=apod.alt||apod.title;img.onerror=()=>{img.alt='NASA image preview unavailable';img.classList.add('broken-image')}
  $('#apod-title').textContent=apod.title;$('#apod-description').innerHTML=sanitizeHtml(apod.description);$('#apod-meta').textContent=`${formatDate(apod.date)} • ${htmlToText(apod.credit)||'NASA'}`
  $('#apod-status').textContent=apod.mediaType==='video'?'This date features a video; NASA’s preview is shown.':`Showing NASA’s picture for ${formatDate(apod.date)}`
  $('#apod-source').hidden=apod.mediaType!=='video';$('#apod-source').href=apod.sourceUrl||'#';$('#save-apod').textContent=favorites.some(i=>i.id===apod.id)?'♥ Saved':'♡ Save discovery'
}
const today=new Date().toISOString().slice(0,10);$('#apod-date').max=today;$('#apod-date').value=today
$('#apod-date-form').addEventListener('submit',e=>{e.preventDefault();loadApod($('#apod-date').value)});$('#apod-date').addEventListener('change',e=>loadApod(e.target.value))
function stepDate(n){const i=$('#apod-date'),d=new Date(`${i.value||today}T12:00:00`);d.setDate(d.getDate()+n);const next=d.toISOString().slice(0,10);if(next>=i.min&&next<=i.max){i.value=next;loadApod(next)}}
$('#apod-previous').addEventListener('click',()=>stepDate(-1));$('#apod-next').addEventListener('click',()=>stepDate(1));$('#apod-retry').addEventListener('click',()=>loadApod($('#apod-date').value));$('#apod-image-button').addEventListener('click',()=>apod&&openModal(apod));$('#save-apod').addEventListener('click',()=>apod&&toggleFavorite(apod))
async function loadExplore(term,page=1){
  exploreQuery=term.trim()||'nebula';explorePage=page;const b=$('#search-form button');b.textContent='Searching…';b.disabled=true;$('#gallery').innerHTML='<div class="gallery-loading">Searching NASA’s image archive…</div>';$('#explore-feedback').hidden=true;$('#explore-pagination').innerHTML='';$('#results-summary').textContent=''
  try{
    const r=await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(exploreQuery)}&media_type=image&page_size=${pageSize}&page=${page}`);if(!r.ok)throw new Error(`NASA search failed (${r.status})`);const d=await r.json();exploreTotal=Number(d.collection.metadata?.total_hits||0)
    gallery=d.collection.items.map(x=>({id:x.data?.[0]?.nasa_id,title:x.data?.[0]?.title||'Untitled',description:x.data?.[0]?.description||x.data?.[0]?.description_508||'',date:x.data?.[0]?.date_created?.slice(0,10),credit:x.data?.[0]?.center||'NASA',image:x.links?.[0]?.href,sourceUrl:`https://images.nasa.gov/details/${encodeURIComponent(x.data?.[0]?.nasa_id||'')}`})).filter(x=>x.id&&x.image);exploreLoaded=true
    if(gallery.length){renderGallery($('#gallery'),gallery);renderPagination()}else{$('#gallery').innerHTML='';showExplore('No results found',`NASA’s archive has no images matching “${exploreQuery}”.`,false)}
  }catch(e){gallery=[];$('#gallery').innerHTML='';showExplore('Unable to search NASA',`${e.message}. Check your connection and try again.`,true)}finally{b.textContent='Search the cosmos';b.disabled=false}
}
$('#search-form').addEventListener('submit',e=>{e.preventDefault();loadExplore($('#search-input').value,1)});$$('[data-query]').forEach(b=>b.addEventListener('click',()=>{$('#search-input').value=b.dataset.query;loadExplore(b.dataset.query,1)}));$('#explore-retry').addEventListener('click',()=>loadExplore(exploreQuery,explorePage))
function showExplore(t,m,retry){$('#explore-feedback').hidden=false;$('#explore-feedback-title').textContent=t;$('#explore-feedback-message').textContent=m;$('#explore-retry').hidden=!retry}
function renderPagination(){
  const totalPages=Math.max(1,Math.ceil(exploreTotal/pageSize)),start=(explorePage-1)*pageSize+1,end=Math.min(start+gallery.length-1,exploreTotal);$('#results-summary').textContent=`Showing ${start}–${end} of ${exploreTotal.toLocaleString()} results for “${exploreQuery}”`
  const pages=[...new Set([1,totalPages,explorePage-1,explorePage,explorePage+1])].filter(p=>p>0&&p<=totalPages).sort((a,b)=>a-b),out=[`<button data-p="${explorePage-1}" ${explorePage===1?'disabled':''}>Previous</button>`];let last=0
  pages.forEach(p=>{if(last&&p-last>1)out.push('<span>…</span>');out.push(`<button data-p="${p}" class="${p===explorePage?'active':''}" ${p===explorePage?'aria-current="page"':''}>${p}</button>`);last=p});out.push(`<button data-p="${explorePage+1}" ${explorePage===totalPages?'disabled':''}>Next</button><small>Page ${explorePage} of ${totalPages}</small>`);$('#explore-pagination').innerHTML=out.join('');$$('#explore-pagination [data-p]').forEach(b=>b.addEventListener('click',()=>loadExplore(exploreQuery,+b.dataset.p)))
}
function renderGallery(container,items){
  container.className='gallery-grid';container.innerHTML=items.map(i=>`<article class="image-card"><button class="image-wrap" data-view="${escapeHtml(i.id)}"><img src="${escapeHtml(i.image)}" alt="${escapeHtml(i.title)}" loading="lazy"><span class="view-label">View story →</span></button><button class="favorite ${favorites.some(f=>f.id===i.id)?'saved':''}" data-save="${escapeHtml(i.id)}" aria-label="Save image">♡</button><div class="image-card-copy"><span>${escapeHtml(htmlToText(i.credit)||'NASA')}</span><h3>${escapeHtml(i.title)}</h3><p>${escapeHtml(htmlToText(i.description)||'No description provided.')}</p></div></article>`).join('')
  container.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.closest('.image-card').classList.add('image-error');img.remove()}));container.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>openModal(items.find(i=>i.id===b.dataset.view))));container.querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',()=>toggleFavorite(items.find(i=>i.id===b.dataset.save))))
}
function toggleFavorite(item){if(!item)return;const exists=favorites.some(f=>f.id===item.id);favorites=exists?favorites.filter(f=>f.id!==item.id):[...favorites,item];saveStore('cosmoview-favorites',favorites);updateCount();if(gallery.length)renderGallery($('#gallery'),gallery);if(apod)renderApod();if($('#discoveries').classList.contains('active'))renderDiscoveries();if(selected?.id===item.id)$('#modal-save').textContent=exists?'♡ Save image':'♥ Saved';notify(exists?'Removed from discoveries':'Saved to discoveries')}
function openModal(item){if(!item)return;selected=item;$('#modal-image').src=item.image;$('#modal-image').alt=item.alt||item.title;$('#modal-title').textContent=item.title;$('#modal-description').innerHTML=sanitizeHtml(item.description)||'<p>No description provided by NASA.</p>';$('#modal-date').textContent=item.date?formatDate(item.date):'NASA image archive';$('#modal-credit').innerHTML=`Image credit: <strong>${escapeHtml(htmlToText(item.credit)||'NASA')}</strong>`;$('#modal-source').hidden=!item.sourceUrl;$('#modal-source').href=item.sourceUrl||'#';$('#modal-save').textContent=favorites.some(f=>f.id===item.id)?'♥ Saved':'♡ Save image';$('#image-modal').hidden=false}
function closeModal(){$('#image-modal').hidden=true;selected=null}$('#modal-close').addEventListener('click',closeModal);$('#image-modal').addEventListener('click',e=>{if(e.target.id==='image-modal')closeModal()});$('#modal-save').addEventListener('click',()=>selected&&toggleFavorite(selected));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()})
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

updatePlanet()
updateCount()
loadApod(today)

