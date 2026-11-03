let planetData=[],planetDataPromise=null
async function loadPlanetData(){
  if(planetData.length)return planetData
  if(planetDataPromise)return planetDataPromise
  planetDataPromise=fetch('./assets/data/planets.json').then(r=>{if(!r.ok)throw new Error(`Planet data failed (${r.status})`);return r.json()}).then(data=>{
    planetData=data
    renderPlanetCatalog(data)
    renderHomePlanets(data)
    populateComparisonSelects()
    $('#planet-data-error').hidden=true
    return data
  }).catch(error=>{
    planetDataPromise=null
    $('#planet-catalog').innerHTML=''
    $('#planet-data-error').hidden=false
    $('#comparison-message').textContent=error.message
    throw error
  })
  return planetDataPromise
}
function renderHomePlanets(items){
  const row=$('#home-planets')
  if(!row)return
  const max=Math.max(...items.map(p=>p.diameterKm))
  row.innerHTML=items.map(p=>`<button data-home-planet="${p.id}" title="Explore ${p.name}">
    <span class="home-planet-orbit"><img src="${escapeHtml(p.image)}" alt="" style="width:${Math.max(24,p.diameterKm/max*92)}%"></span>
    <strong>${p.name}</strong><small>${formatNumber(p.diameterKm)} km</small>
  </button>`).join('')
  row.querySelectorAll('[data-home-planet]').forEach(button=>button.addEventListener('click',()=>{
    goToPage('planet-explorer')
    showPlanetDetail(button.dataset.homePlanet)
  }))
}
$('#planet-data-retry').addEventListener('click',()=>loadPlanetData().catch(()=>{}))
function renderPlanetCatalog(items){
  const catalog=$('#planet-catalog')
  if(!items.length){catalog.innerHTML='<div class="empty"><p>No planets match your search.</p></div>';return}
  catalog.innerHTML=items.map(p=>`<article class="planet-atlas-card">
    <div class="planet-card-image"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
    <span class="eyebrow">Planet ${planetData.indexOf(p)+1} of 8</span><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.description)}</p>
    <button class="card-link" data-planet-id="${p.id}">Explore planet →</button>
  </article>`).join('')
  catalog.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.closest('.planet-card-image').classList.add('image-error')))
  catalog.querySelectorAll('[data-planet-id]').forEach(button=>button.addEventListener('click',()=>showPlanetDetail(button.dataset.planetId)))
}
$('#planet-search-input').addEventListener('input',event=>{
  const term=event.target.value.trim().toLowerCase()
  renderPlanetCatalog(planetData.filter(p=>p.name.toLowerCase().includes(term)||p.description.toLowerCase().includes(term)))
})
function showPlanetDetail(id){
  const index=planetData.findIndex(p=>p.id===id)
  if(index<0)return
  const p=planetData[index],detail=$('#planet-detail-view')
  $('#planet-catalog-view').hidden=true
  detail.hidden=false
  detail.innerHTML=`<button class="detail-back" id="planet-detail-back">← All planets</button>
    <div class="planet-detail-hero"><div class="planet-detail-image"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}"></div>
      <div><span class="eyebrow">Planet ${index+1} of ${planetData.length}</span><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.overview)}</p></div></div>
    <div class="planet-facts-grid">
      ${detailFact('Diameter',formatNumber(p.diameterKm)+' km')}${detailFact('Distance from Sun',formatDistance(p.distanceMillionKm))}${detailFact('Gravity',p.gravity+' m/s²')}
      ${detailFact('Orbital period',p.orbitalPeriod)}${detailFact('Rotation period',p.rotationPeriod)}${detailFact('Known moons',formatNumber(p.moons))}
    </div>
    <div class="interesting-facts"><span class="eyebrow">Interesting facts</span><ul>${p.facts.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul></div>
    <div class="planet-detail-nav"><button ${index===0?'disabled':''} id="previous-planet">← Previous planet</button><button ${index===planetData.length-1?'disabled':''} id="next-planet">Next planet →</button></div>`
  $('#planet-detail-back').addEventListener('click',closePlanetDetail)
  $('#previous-planet').addEventListener('click',()=>showPlanetDetail(planetData[index-1]?.id))
  $('#next-planet').addEventListener('click',()=>showPlanetDetail(planetData[index+1]?.id))
  detail.querySelector('img').addEventListener('error',event=>event.target.closest('.planet-detail-image').classList.add('image-error'))
  window.scrollTo({top:0,behavior:'smooth'})
}
function closePlanetDetail(){$('#planet-detail-view').hidden=true;$('#planet-catalog-view').hidden=false}
function detailFact(label,value){return`<div class="planet-fact"><span>${label}</span><strong>${value}</strong></div>`}
function formatNumber(value){return Number(value).toLocaleString()}
function formatDistance(millionKm){return millionKm>=1000?`${(millionKm/1000).toFixed(3)} billion km`:`${formatNumber(millionKm)} million km`}
loadPlanetData().catch(()=>{})
