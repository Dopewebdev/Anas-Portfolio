
const cfg=window.PORTFOLIO_CONFIG||{};
const PANELS=cfg.panels||['Digital Art','Graphic Design','Streamer Assets','Branding','3D & Motion'];
const grid=document.getElementById('galleryGrid'),filters=document.getElementById('filters');
const manager=document.getElementById('manager'),panelSelect=document.getElementById('panelSelect');
let artworks=[],activeCategory='All Works',db;
function escapeHTML(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('AnasPortfolioDB',1);req.onupgradeneeded=()=>req.result.createObjectStore('artworks',{keyPath:'id',autoIncrement:true});req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error)})}
function tx(mode='readonly'){return db.transaction('artworks',mode).objectStore('artworks')}
function getAll(){return new Promise((resolve,reject)=>{const r=tx().getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function save(item){return new Promise((resolve,reject)=>{const r=tx('readwrite').put(item);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
function add(item){return new Promise((resolve,reject)=>{const r=tx('readwrite').add(item);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function remove(id){return new Promise((resolve,reject)=>{const r=tx('readwrite').delete(Number(id));r.onsuccess=resolve;r.onerror=()=>reject(r.error)})}
async function refresh(){artworks=await getAll();render(activeCategory);renderSlots()}
function renderFilters(){
 filters.innerHTML='';
 ['All Works',...PANELS].forEach(cat=>{const b=document.createElement('button');b.className='filter'+(cat===activeCategory?' active':'');b.textContent=cat;b.onclick=()=>{activeCategory=cat;renderFilters();render(cat)};filters.append(b)});
}
function render(cat='All Works'){
 grid.innerHTML='';const list=artworks.filter(x=>cat==='All Works'||x.category===cat);
 if(!list.length){grid.innerHTML='<p class="empty-gallery">Your artwork will appear here. Use “Manage Gallery” to upload images.</p>';return}
 list.forEach(item=>{const card=document.createElement('article');card.className='art-card';const visual=document.createElement('div');visual.className='art-image';
 if(item.image){const img=document.createElement('img');img.src=item.image;img.alt=item.title;img.draggable=false;visual.append(img);const mark=document.createElement('span');mark.className='art-watermark';mark.setAttribute('aria-hidden','true');mark.textContent=cfg.name||'MUHAMMAD ANAS';visual.append(mark)}else{const p=document.createElement('span');p.className='placeholder';p.textContent='YOUR ART';visual.append(p)}
 const meta=document.createElement('div');meta.className='art-meta';meta.innerHTML=`<small>${escapeHTML(item.category)}</small><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description||'')}</p>`;
 card.append(visual,meta);card.addEventListener('click',()=>openArtwork(item));grid.append(card)});
}
function renderSlots(){
 const cat=panelSelect.value||PANELS[0],list=artworks.filter(x=>x.category===cat);
 const slotGrid=document.getElementById('slotGrid');slotGrid.innerHTML='';
 for(let i=0;i<15;i++){const item=list[i];const slot=document.createElement('div');slot.className='upload-slot';
 if(item){slot.innerHTML=`<div class="slot-thumb"><img src="${item.image}" alt=""></div><div class="slot-info"><b>${escapeHTML(item.title)}</b><small>${i+1}/15</small></div><div class="slot-actions"><button data-edit="${item.id}">Edit</button><button data-delete="${item.id}" class="delete-btn">Remove</button></div>`}
 else slot.innerHTML=`<div class="slot-empty"><b>＋</b><span>Image slot ${i+1}</span><small>Empty</small></div>`;
 slotGrid.append(slot)}
 slotGrid.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Remove this artwork?')){await remove(b.dataset.delete);await refresh()}});
 slotGrid.querySelectorAll('[data-edit]').forEach(b=>b.onclick=async()=>{const item=artworks.find(x=>x.id===Number(b.dataset.edit));const title=prompt('Artwork title:',item.title);if(title===null)return;const description=prompt('Short description:',item.description||'');if(description===null)return;item.title=title.trim()||'Untitled Artwork';item.description=description;await save(item);await refresh()});
 const count=list.length;document.getElementById('uploadHelp').textContent=`${count}/15 images used in ${cat}. You can add ${15-count} more.`;
}
async function uploadFiles(){
 const input=document.getElementById('imageUpload'),files=[...input.files],cat=panelSelect.value;
 const count=artworks.filter(x=>x.category===cat).length,room=15-count;
 if(!files.length){alert('Please choose images first.');return}
 if(files.length>room){alert(`This panel has room for only ${room} more image(s).`);return}
 for(const file of files){if(!file.type.startsWith('image/'))continue;const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
 await add({title:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' '),category:cat,description:'',image:data,createdAt:Date.now()})}
 input.value='';await refresh();alert(`${files.length} image(s) added to ${cat}.`);
}
function setupManager(){
 PANELS.forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;panelSelect.append(o)});
 document.getElementById('manageBtn').onclick=()=>{manager.classList.add('open');manager.setAttribute('aria-hidden','false');renderSlots()};
 document.getElementById('closeManager').onclick=()=>{manager.classList.remove('open');manager.setAttribute('aria-hidden','true')};
 manager.addEventListener('click',e=>{if(e.target===manager)manager.classList.remove('open')});
 panelSelect.onchange=renderSlots;document.getElementById('uploadBtn').onclick=uploadFiles;
}
const socials=document.getElementById('socials');(cfg.socials||[]).forEach(s=>{const a=document.createElement('a');a.href=s.url;a.textContent=s.label;a.target='_blank';a.rel='noopener';socials.append(a)});
document.getElementById('emailLink').href='mailto:'+(cfg.email||'');document.getElementById('emailText').href='mailto:'+(cfg.email||'');document.getElementById('emailText').textContent=cfg.email||'Add your email in config.js';document.getElementById('year').textContent=new Date().getFullYear();
const lb=document.getElementById('lightbox');let currentArtwork=null;
function openArtwork(item){currentArtwork=item;document.getElementById('lightboxTitle').textContent=item.title;document.getElementById('lightboxCat').textContent=item.category;document.getElementById('lightboxDesc').textContent=item.description||'';const img=document.getElementById('lightboxImg');img.src=item.image||'';img.alt=item.title||'Artwork preview';img.draggable=false;img.style.display=item.image?'block':'none';const mark=document.querySelector('.lightbox-image-wrap .art-watermark');if(mark)mark.textContent=cfg.name||'MUHAMMAD ANAS';lb.classList.add('open')}
function close(){lb.classList.remove('open')}document.getElementById('closeLightbox').onclick=close;lb.addEventListener('click',e=>{if(e.target===lb)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();manager.classList.remove('open')}});
// Basic artwork protection: deter casual right-click saving and dragging (not foolproof).
document.addEventListener('contextmenu',e=>{if(e.target.closest('.art-image, .lightbox-image-wrap'))e.preventDefault()});
document.addEventListener('dragstart',e=>{if(e.target.matches('.art-image img, .lightbox-image-wrap img'))e.preventDefault()});
document.getElementById('hamb').onclick=()=>document.getElementById('nav').classList.toggle('open');document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>document.getElementById('nav').classList.remove('open'));document.getElementById('themeBtn').onclick=()=>document.body.classList.toggle('light');
(async()=>{try{await openDB();setupManager();await refresh();renderFilters()}catch(e){grid.innerHTML='<p>Gallery storage could not be started. Please use a modern browser.</p>';console.error(e)}})();
