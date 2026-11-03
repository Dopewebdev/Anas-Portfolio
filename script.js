(() => {
"use strict";
const cfg = window.PORTFOLIO_CONFIG || {};
const PANELS = cfg.panels || ["Digital Art","Illustrations","Streamer Assets","Branding","3D Arts"];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast = msg => { const el=$("toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),3600); };
let supabase=null, artworks=[], settings={}, activeCategory="All Works", currentIndex=0, signedIn=false;
const defaults = {
 name:cfg.name||"Muhammad Anas", logo_text:"ANAS.", favicon_url:"",
 email:cfg.email||"", hero_title:"I CREATE\nVISUALS THAT\nMAKE AN IMPACT.",
 hero_subtitle:"Hey, I'm Muhammad Anas — a digital artist and graphic designer creating expressive artwork, bold identities, and custom visuals for creators, gamers, and brands.",
 about_title:"Art is how I share ideas.",
 about_text:"I'm Muhammad Anas, a digital artist and graphic designer who enjoys transforming ideas into memorable visuals. From custom character artwork to creator graphics and brand identities, I focus on thoughtful details and strong visual storytelling.\n\nI love exploring different styles, learning new techniques, and creating work that helps people and brands stand out.",
 socials:[{label:"Instagram",url:"https://instagram.com/"},{label:"Behance",url:"https://behance.net/"},{label:"X / Twitter",url:"https://x.com/"},{label:"Discord",url:"https://discord.com/"}],
 bg_color:"#10091f", accent_color:"#bd5cff", accent2_color:"#42e8ff", text_color:"#f7f0ff", font_family:"Manrope"
};
function readyConfig(){
 if(!window.supabase?.createClient){$("galleryGrid").innerHTML='<p class="empty-gallery">Supabase library could not load. Check your internet connection.</p>';return false;}
 if(!cfg.supabaseUrl || cfg.supabaseUrl.includes("YOUR-PROJECT") || !cfg.supabaseAnonKey || cfg.supabaseAnonKey.includes("YOUR_SUPABASE")){
  $("galleryGrid").innerHTML='<p class="empty-gallery">Website setup required: add your Supabase Project URL and Publishable key in config.js, then reload.</p>'; return false;
 }
 supabase=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return true;
}
async function loadSettings(){
 const {data,error}=await supabase.from("site_settings").select("settings").eq("id",1).maybeSingle();
 if(error) console.warn("Settings:",error.message);
 settings={...defaults,...(data?.settings||{})};
 applySettings();
}
let pageEditMode=false;
function applySavedPageTexts(){
 const saved=settings.page_texts||{};
 Object.entries(saved).forEach(([id,text])=>{const el=document.querySelector(`[data-page-edit-id="${CSS.escape(id)}"]`);if(el)el.textContent=text;});
 const styles=settings.page_text_styles||{};
 Object.entries(styles).forEach(([id,st])=>{const el=document.querySelector(`[data-page-edit-id="${CSS.escape(id)}"]`);if(el&&st){if(st.color)el.style.color=st.color;if(st.fontSize)el.style.fontSize=st.fontSize;if(st.fontFamily)el.style.fontFamily=st.fontFamily;if(st.fontWeight)el.style.fontWeight=st.fontWeight;}});
}
function applySettings(){
 document.documentElement.style.setProperty("--bg",settings.bg_color||defaults.bg_color);
 document.documentElement.style.setProperty("--accent",settings.accent_color||defaults.accent_color);
 document.documentElement.style.setProperty("--accent2",settings.accent2_color||defaults.accent2_color);
 document.documentElement.style.setProperty("--text",settings.text_color||defaults.text_color);
 document.documentElement.style.setProperty("--font",`"${settings.font_family||"Manrope"}", sans-serif`);
 document.title=`${settings.name||defaults.name} — Artist Portfolio`;
 $("siteLogo").innerHTML=settings.logo_text?.startsWith("http")?`<img src="${esc(settings.logo_text)}" alt="${esc(settings.name)}">`:esc(settings.logo_text||"ANAS.");
 $("heroTitle").innerHTML=esc(settings.hero_title||defaults.hero_title).replace(/\n/g,"<br>").replace(/VISUALS/g,"<em>VISUALS</em>").replace(/IMPACT\./g,"IMPACT<span>.</span>");
 $("heroSubtitle").textContent=settings.hero_subtitle||defaults.hero_subtitle;
 $("aboutTitle").textContent=settings.about_title||defaults.about_title;
 $("aboutText").innerHTML=(settings.about_text||defaults.about_text).split(/\n{2,}/).map(p=>`<p>${esc(p)}</p>`).join("");
 $("aboutBrand").textContent=`${(settings.name||defaults.name).toUpperCase()} · CREATIVE PORTFOLIO`;
 $("emailLink").href=`mailto:${settings.email||""}`; $("emailText").href=`mailto:${settings.email||""}`; $("emailText").textContent=settings.email||"Add your email in Admin";
 $("footerName").textContent=(settings.name||defaults.name).toUpperCase();
 $("socials").innerHTML=(settings.socials||[]).filter(s=>s.label&&s.url).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join("");
 if($("logoPreview"))$("logoPreview").src=settings.logo_text?.startsWith("http")?settings.logo_text:"";
 applySavedPageTexts();
 if(settings.favicon_url){let f=document.querySelector('link[rel="icon"]');if(!f){f=document.createElement("link");f.rel="icon";document.head.append(f)}f.href=settings.favicon_url;}
}
async function loadArtworks(){
 const {data,error}=await supabase.from("artworks").select("id,title,category,image_path,media_type,thumbnail_path,description,sort_order,created_at").order("sort_order",{ascending:true}).order("created_at",{ascending:false});
 if(error){console.error(error);$("galleryGrid").innerHTML='<p class="empty-gallery">Could not load gallery. Check the Supabase SQL setup and table policies.</p>';return;}
 artworks=(data||[]).map(x=>({...x,media_type:x.media_type||"image",url:publicUrl(x.image_path),thumb:publicUrl(x.thumbnail_path||x.image_path)}));
 renderFilters();renderGallery(activeCategory);
}
function publicUrl(path){if(!path)return "";return supabase.storage.from(cfg.storageBucket||"portfolio-images").getPublicUrl(path).data.publicUrl;}
function renderFilters(){
 $("filters").innerHTML="";
 ["All Works",...PANELS].forEach(cat=>{const b=document.createElement("button");b.className="filter"+(cat===activeCategory?" active":"");b.textContent=cat;b.onclick=()=>{activeCategory=cat;renderFilters();renderGallery(cat)};$("filters").append(b)});
}
function renderGallery(cat="All Works"){
 const grid=$("galleryGrid");grid.innerHTML="";
 const list=artworks.filter(a=>cat==="All Works"||a.category===cat);
 if(!list.length){grid.innerHTML='<p class="empty-gallery">No work in this panel yet. New artwork will appear here.</p>';return;}
 list.forEach((item,idx)=>{
  const card=document.createElement("article");card.className="art-card";
  const visual=document.createElement("div");visual.className="art-image";
  if(item.media_type==="video"){
   const img=document.createElement("img");img.src=item.thumb;img.alt=item.title;img.loading="lazy";img.decoding="async";img.draggable=false;visual.append(img);
   const play=document.createElement("span");play.className="video-play";play.textContent="▶";visual.append(play);
   const v=document.createElement("video");v.className="hover-video";v.muted=true;v.loop=true;v.playsInline=true;v.preload="none";visual.append(v);
   card.addEventListener("mouseenter",()=>{if(matchMedia("(hover:hover)").matches){v.src=item.url;v.play().catch(()=>{});}});
   card.addEventListener("mouseleave",()=>{v.pause();v.removeAttribute("src");v.load();});
  } else {const img=document.createElement("img");img.src=item.url;img.alt=item.title;img.loading="lazy";img.decoding="async";img.draggable=false;visual.append(img);}
  const mark=document.createElement("span");mark.className="art-watermark";mark.textContent=settings.name||cfg.name||"ARTWORK";visual.append(mark);
  const meta=document.createElement("div");meta.className="art-meta";meta.innerHTML=`<small>${esc(item.category)}</small><h3>${esc(item.title)}</h3><p>${esc(item.description||"")}</p>`;
  card.append(visual,meta);card.addEventListener("click",()=>openArtwork(item));grid.append(card);
 });
}
function openArtwork(item){
 $("lightboxTitle").textContent=item.title;$("lightboxCat").textContent=item.category;$("lightboxDesc").textContent=item.description||"";
 const img=$("lightboxImg"),vid=$("lightboxVideo");img.hidden=item.media_type==="video";vid.hidden=item.media_type!=="video";
 if(item.media_type==="video"){img.removeAttribute("src");vid.src=item.url;vid.poster=item.thumb;vid.load();vid.play().catch(()=>{});}
 else {vid.pause();vid.removeAttribute("src");img.src=item.url;img.alt=item.title;}
 $("lightbox").classList.add("open");
}
function closeLightbox(){$("lightboxVideo").pause();$("lightboxVideo").removeAttribute("src");$("lightbox").classList.remove("open");}
function showAdmin(){ $("adminOverlay").classList.add("open");$("adminOverlay").setAttribute("aria-hidden","false");checkSession(); }
function hideAdmin(){ $("adminOverlay").classList.remove("open");$("adminOverlay").setAttribute("aria-hidden","true"); }
async function checkSession(){
 const {data}=await supabase.auth.getSession();signedIn=!!data.session;
 $("loginPanel").hidden=signedIn;$("dashboardPanel").hidden=!signedIn;
 $("adminStatus").textContent=signedIn?"Signed in. Changes apply to this website's public portfolio.":"Sign in with the admin account for this website.";
 if(signedIn){await fillSettingsForm();await loadAdminMedia();}
}
async function login(){
 const email=$("adminEmail").value.trim(),password=$("adminPassword").value;
 if(!email||!password){toast("Enter your admin email and password.");return;}
 $("loginBtn").disabled=true;
 const {error}=await supabase.auth.signInWithPassword({email,password});
 $("loginBtn").disabled=false;
 if(error){toast("Sign-in failed: "+error.message);return;}
 $("adminPassword").value="";await checkSession();toast("Admin signed in.");
}

async function changeAdminPassword(){
 const password=$("newAdminPassword").value,confirm=$("confirmAdminPassword").value;
 if(password.length<8){toast("Password must be at least 8 characters.");return;}
 if(password!==confirm){toast("The passwords do not match.");return;}
 const btn=$("changePasswordBtn");btn.disabled=true;$("passwordStatus").textContent="Updating password…";
 const {error}=await supabase.auth.updateUser({password});
 btn.disabled=false;
 if(error){$("passwordStatus").textContent="Password update failed.";toast("Could not change password: "+error.message);return;}
 $("newAdminPassword").value="";$("confirmAdminPassword").value="";
 $("passwordStatus").textContent="Password changed successfully.";toast("Admin password changed successfully.");
}
async function logout(){await supabase.auth.signOut();signedIn=false;await checkSession();toast("Signed out.");}
function fillSettingsForm(){
 const map={setName:"name",setLogo:"logo_text",setFavicon:"favicon_url",setEmail:"email",setHeroTitle:"hero_title",setHeroSubtitle:"hero_subtitle",setAboutTitle:"about_title",setAboutText:"about_text",setBg:"bg_color",setAccent:"accent_color",setAccent2:"accent2_color",setText:"text_color",setFont:"font_family"};
 Object.entries(map).forEach(([id,key])=>$(id).value=settings[key]||defaults[key]||"");
 $("setSocials").value=(settings.socials||[]).map(s=>`${s.label} | ${s.url}`).join("\n");
}
function readSettingsForm(){
 const v={...settings,page_texts:{...(settings.page_texts||{})},page_text_styles:{...(settings.page_text_styles||{})}};
 const map={setName:"name",setLogo:"logo_text",setFavicon:"favicon_url",setEmail:"email",setHeroTitle:"hero_title",setHeroSubtitle:"hero_subtitle",setAboutTitle:"about_title",setAboutText:"about_text",setBg:"bg_color",setAccent:"accent_color",setAccent2:"accent2_color",setText:"text_color",setFont:"font_family"};
 Object.entries(map).forEach(([id,key])=>v[key]=$(id).value.trim());
 v.socials=$("setSocials").value.split("\n").map(line=>{const i=line.indexOf("|");return i<0?null:{label:line.slice(0,i).trim(),url:line.slice(i+1).trim()}}).filter(x=>x&&x.label&&/^https?:\/\//i.test(x.url));
 return v;
}
async function saveSettings(){
 const next=readSettingsForm();$("saveSettingsBtn").disabled=true;$("settingsStatus").textContent="Saving…";
 const {error}=await supabase.from("site_settings").upsert({id:1,settings:next,updated_at:new Date().toISOString()});
 $("saveSettingsBtn").disabled=false;
 if(error){$("settingsStatus").textContent="Save failed.";toast("Could not save settings: "+error.message);return;}
 settings=next;applySettings();$("settingsStatus").textContent="Saved successfully.";toast("Website settings saved.");
}
function initAdminCategories(){PANELS.forEach(p=>{const o=document.createElement("option");o.value=p;o.textContent=p;$("adminCategory").append(o)});}
async function loadAdminMedia(){
 const cat=$("adminCategory").value||PANELS[0],list=artworks.filter(a=>a.category===cat);
 $("adminMediaList").innerHTML=`<p class="admin-help">${list.length}/15 used in ${esc(cat)}. ${15-list.length} slots available.</p>`;
 list.forEach(item=>{
  const row=document.createElement("div");row.className="admin-media-row";
  const thumb=document.createElement("img");thumb.src=item.thumb;thumb.alt="";
  const info=document.createElement("div");info.className="admin-media-info";info.innerHTML=`<b>${esc(item.title)}</b><small>${esc(item.media_type)} · ${esc(item.category)}</small>`;
  const edit=document.createElement("button");edit.textContent="Edit";edit.onclick=()=>editMedia(item);
  const del=document.createElement("button");del.textContent="Delete";del.className="delete-btn";del.onclick=()=>deleteMedia(item);
  row.append(thumb,info,edit,del);$("adminMediaList").append(row);
 });
}
async function editMedia(item){
 const title=prompt("Artwork title:",item.title);if(title===null)return;
 const description=prompt("Short description:",item.description||"");if(description===null)return;
 const {error}=await supabase.from("artworks").update({title:title.trim()||"Untitled Artwork",description}).eq("id",item.id);
 if(error){toast("Update failed: "+error.message);return;}await loadArtworks();await loadAdminMedia();toast("Artwork updated.");
}
async function deleteMedia(item){
 if(!confirm(`Delete "${item.title}" from the public gallery?`))return;
 const {error}=await supabase.from("artworks").delete().eq("id",item.id);
 if(error){toast("Delete failed: "+error.message);return;}
 const paths=[item.image_path,item.thumbnail_path].filter(Boolean);
 if(paths.length)await supabase.storage.from(cfg.storageBucket||"portfolio-images").remove(paths);
 await loadArtworks();await loadAdminMedia();toast("Artwork deleted.");
}
async function makeVideoThumbnail(file){
 return new Promise(resolve=>{
  const url=URL.createObjectURL(file),video=document.createElement("video");video.preload="metadata";video.muted=true;video.playsInline=true;
  const done=blob=>{URL.revokeObjectURL(url);resolve(blob||null)};
  video.onloadeddata=()=>{try{video.currentTime=Math.min(1,Math.max(0,video.duration/4));}catch(e){done(null)}};
  video.onseeked=()=>{try{const c=document.createElement("canvas");c.width=480;c.height=Math.round(480*(video.videoHeight/video.videoWidth||0.5625));c.getContext("2d").drawImage(video,0,0,c.width,c.height);c.toBlob(done,"image/webp",.78);}catch(e){done(null)}};
  video.onerror=()=>done(null);video.src=url;
 });
}
async function uploadMedia(){
 const files=[...$("mediaFiles").files],cat=$("adminCategory").value;
 if(!files.length){toast("Choose image or video files first.");return;}
 const room=15-artworks.filter(a=>a.category===cat).length;
 if(files.length>room){toast(`Only ${room} slot(s) remain in this panel.`);return;}
 $("uploadMediaBtn").disabled=true;
 for(let i=0;i<files.length;i++){
  const file=files[i],isImage=file.type.startsWith("image/"),isVideo=file.type.startsWith("video/");
  if(!isImage&&!isVideo){toast(`Skipped unsupported file: ${file.name}`);continue;}
  if(isImage&&!["image/jpeg","image/png","image/webp"].includes(file.type)){toast("Use JPG, PNG or WebP images.");continue;}
  if(isVideo&&!["video/mp4","video/webm"].includes(file.type)){toast("Use MP4 or WebM videos.");continue;}
  if(file.size>50*1024*1024){toast(`${file.name} is too large. Maximum file size is 50 MB for images and videos.`);continue;}
  $("uploadStatus").textContent=`Uploading ${i+1}/${files.length}: ${file.name}`;
  const clean=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-90),path=`${cat.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}/${Date.now()}-${clean}`;
  const bucket=supabase.storage.from(cfg.storageBucket||"portfolio-images");
  const {error:upErr}=await bucket.upload(path,file,{cacheControl:"31536000",upsert:false,contentType:file.type});
  if(upErr){toast(`Upload failed: ${upErr.message}`);continue;}
  let thumbPath=null;
  if(isVideo){const thumb=await makeVideoThumbnail(file);if(thumb){thumbPath=path.replace(/\.[^.]+$/,"")+".webp";const {error:thErr}=await bucket.upload(thumbPath,thumb,{cacheControl:"31536000",upsert:false,contentType:"image/webp"});if(thErr)thumbPath=null;}}
  const {error:dbErr}=await supabase.from("artworks").insert({title:file.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," "),category:cat,image_path:path,media_type:isVideo?"video":"image",thumbnail_path:thumbPath,description:"",sort_order:Date.now()});
  if(dbErr){await bucket.remove([path,...(thumbPath?[thumbPath]:[])]);toast(`Database save failed: ${dbErr.message}`);}
 }
 $("mediaFiles").value="";$("uploadStatus").textContent="Upload complete. Refreshing gallery…";
 await loadArtworks();await loadAdminMedia();$("uploadMediaBtn").disabled=false;$("uploadStatus").textContent="Upload limit: 50 MB per image or video. Images: JPG, PNG, WebP. Video: MP4 (H.264) or WebM. Keep files optimized for fast loading.";toast("Upload process finished.");
}
function setupPageTextEditor(){
 const candidates=[...document.querySelectorAll("body *")].filter(el=>{
  if(el.closest(".admin-overlay,.lightbox,#toast,script,style"))return false;
  if(el.children.length>0)return false;
  return (el.textContent||"").trim().length>0;
 });
 candidates.forEach((el,i)=>{if(!el.dataset.pageEditId)el.dataset.pageEditId="text-"+i;});
 $("togglePageEdit").onclick=()=>{
  pageEditMode=!pageEditMode;document.body.classList.toggle("page-edit-mode",pageEditMode);
  $("togglePageEdit").textContent=pageEditMode?"✎ Edit Page Text: ON (click text)":"✎ Edit Page Text: OFF";
  toast(pageEditMode?"Click any text on the website to edit it.":"Text editing disabled.");
 };
 document.addEventListener("click",e=>{
  if(!pageEditMode||e.target.closest(".admin-overlay,.lightbox,#toast"))return;
  const el=e.target.closest("[data-page-edit-id]");if(!el)return;
  e.preventDefault();e.stopPropagation();
  const val=prompt("Edit this text:",el.textContent);if(val===null)return;
  el.textContent=val;settings.page_texts=settings.page_texts||{};settings.page_texts[el.dataset.pageEditId]=val;
  const color=prompt("Text color (CSS color / hex, blank = keep current):","");
  const size=prompt("Font size (e.g. 24px, 2rem, blank = keep current):","");
  const font=prompt("Font family (Manrope, Poppins, Montserrat, Roboto, Arial, blank = keep current):","");
  const weight=prompt("Font weight (400, 600, 800, blank = keep current):","");
  settings.page_text_styles=settings.page_text_styles||{};const st=settings.page_text_styles[el.dataset.pageEditId]||{};
  if(color){st.color=color;el.style.color=color;}if(size){st.fontSize=size;el.style.fontSize=size;}if(font){st.fontFamily=font;el.style.fontFamily=font;}if(weight){st.fontWeight=weight;el.style.fontWeight=weight;}
  settings.page_text_styles[el.dataset.pageEditId]=st;
 },true);
}
async function uploadLogoImage(){
 const file=$("logoImageFile").files[0];if(!file)return;
 if(!file.type.startsWith("image/")){toast("Choose an image file.");return;}
 if(file.size>10*1024*1024){toast("Logo maximum size is 10 MB.");return;}
 $("logoUploadStatus").textContent="Uploading logo…";
 const path=`site-assets/logo-${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi,"-")}`;
 const bucket=supabase.storage.from(cfg.storageBucket||"portfolio-images");
 const {error}=await bucket.upload(path,file,{upsert:false,contentType:file.type});
 if(error){$("logoUploadStatus").textContent="Upload failed: "+error.message;return;}
 const url=bucket.getPublicUrl(path).data.publicUrl;
 $("setLogo").value=url;$("logoPreview").src=url;settings.logo_text=url;applySettings();
 $("logoUploadStatus").textContent="Uploaded. Click Save website changes to publish.";
 toast("Logo image uploaded.");
}
function initTabs(){
 document.querySelectorAll(".admin-tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".admin-tabs button").forEach(x=>x.classList.toggle("active",x===b));
  document.querySelectorAll(".admin-tab").forEach(x=>x.hidden=x.id!==b.dataset.tab);
 });
}
function initUI(){
 $("year").textContent=new Date().getFullYear();
 $("manageBtn").onclick=showAdmin;$("adminClose").onclick=hideAdmin;$("adminOverlay").addEventListener("click",e=>{if(e.target===$("adminOverlay"))hideAdmin()});
 $("loginBtn").onclick=login;$("logoutBtn").onclick=logout;$("saveSettingsBtn").onclick=saveSettings;$("uploadMediaBtn").onclick=uploadMedia;
 $("adminCategory").onchange=loadAdminMedia;$("changePasswordBtn").onclick=changeAdminPassword;initAdminCategories();initTabs();setupPageTextEditor();$("logoImageFile").addEventListener("change",uploadLogoImage);
 $("closeLightbox").onclick=closeLightbox;$("lightbox").addEventListener("click",e=>{if(e.target===$("lightbox"))closeLightbox()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeLightbox();hideAdmin()}});
 $("hamb").onclick=()=>$("nav").classList.toggle("open");document.querySelectorAll("nav a").forEach(a=>a.onclick=()=>$("nav").classList.remove("open"));
 $("themeBtn").onclick=()=>document.body.classList.toggle("light");
 document.addEventListener("contextmenu",e=>{if(e.target.closest(".art-image,.lightbox-image-wrap"))e.preventDefault()});
 document.addEventListener("dragstart",e=>{if(e.target.matches(".art-image img,.lightbox-image-wrap img"))e.preventDefault()});
}
async function start(){
 initUI();
 if(!readyConfig())return;
 try{await loadSettings();await loadArtworks();supabase.auth.onAuthStateChange((_event)=>{checkSession()});}
 catch(e){console.error(e);$("galleryGrid").innerHTML='<p class="empty-gallery">Could not connect to Supabase. Verify config.js and SQL setup.</p>';}
}
start();
})();