const STORAGE_KEY="velarya-atlas-cities-v1";

const viewport=document.getElementById("viewport");
const map=document.getElementById("map");
const mapImage=document.getElementById("mapImage");
const markers=document.getElementById("markers");

const editorToggle=document.getElementById("editorToggle");
const addModeBtn=document.getElementById("addMode");
const saveLocal=document.getElementById("saveLocal");
const exportData=document.getElementById("exportData");
const resetLocal=document.getElementById("resetLocal");

const panel=document.getElementById("panel");
const panelTitle=document.getElementById("panelTitle");
const hint=document.getElementById("hint");
const cityName=document.getElementById("cityName");
const cityArea=document.getElementById("cityArea");
const cityIcon=document.getElementById("cityIcon");
const cityDiscord=document.getElementById("cityDiscord");
const applyEdit=document.getElementById("applyEdit");
const deleteCity=document.getElementById("deleteCity");

let mapWidth=4096,mapHeight=3072,scale=1,x=0,y=0;
let draggingMap=false,draggingMarker=false;
let startX=0,startY=0;
let editMode=false,addMode=false;
let selectedIndex=null;

const saved=localStorage.getItem(STORAGE_KEY);
if(saved){
  try{ CITIES=JSON.parse(saved); }catch(e){ console.warn("Gespeicherte Daten konnten nicht geladen werden."); }
}

function applyTransform(){map.style.transform=`translate(${x}px, ${y}px) scale(${scale})`}

function fitMap(){
  const vw=viewport.clientWidth,vh=viewport.clientHeight;
  scale=Math.min(vw/mapWidth,vh/mapHeight,1);
  x=(vw-mapWidth*scale)/2;
  y=(vh-mapHeight*scale)/2;
  applyTransform();
}

function cityToPx(city){return {x:(city.x/100)*mapWidth,y:(city.y/100)*mapHeight}}
function pxToPercent(px,py){return {x:Math.max(0,Math.min(100,(px/mapWidth)*100)),y:Math.max(0,Math.min(100,(py/mapHeight)*100))}}
function screenToMap(clientX,clientY){
  const rect=viewport.getBoundingClientRect();
  return {x:(clientX-rect.left-x)/scale,y:(clientY-rect.top-y)/scale}
}

function createMarkers(){
  markers.innerHTML="";
  CITIES.forEach((city,i)=>{
    const p=cityToPx(city);
    const a=document.createElement("a");
    a.className="marker"+(i===selectedIndex?" selected":"");
    a.href=city.discord || "#";
    a.target="_blank";
    a.rel="noopener noreferrer";
    a.dataset.index=i;
    a.style.left=p.x+"px";
    a.style.top=p.y+"px";
    a.innerHTML=`<span class="marker-dot"></span><span class="tooltip"><strong>${city.icon||"📍"} ${escapeHtml(city.name)}</strong><small>${escapeHtml(city.area||"")}</small></span>`;

    a.addEventListener("click",e=>{
      if(editMode){
        e.preventDefault();
        selectCity(i);
      }
    });

    a.addEventListener("pointerdown",e=>{
      if(!editMode)return;
      e.preventDefault();
      e.stopPropagation();
      selectCity(i);
      draggingMarker=true;
      viewport.setPointerCapture(e.pointerId);
    });

    markers.appendChild(a);
  });
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}

function selectCity(i){
  selectedIndex=i;
  const city=CITIES[i];
  panel.classList.add("show");
  panelTitle.textContent="Ort bearbeiten";
  hint.textContent="Du kannst den Marker verschieben, Daten ändern, löschen oder speichern.";
  cityName.value=city.name||"";
  cityArea.value=city.area||"";
  cityIcon.value=city.icon||"📍";
  cityDiscord.value=city.discord||"";
  createMarkers();
}

function newCityAt(point){
  const percent=pxToPercent(point.x,point.y);
  CITIES.push({
    name:"Neuer Ort",
    area:"",
    icon:"📍",
    x:Number(percent.x.toFixed(3)),
    y:Number(percent.y.toFixed(3)),
    discord:""
  });
  selectedIndex=CITIES.length-1;
  addMode=false;
  addModeBtn.classList.remove("active");
  viewport.classList.remove("adding");
  createMarkers();
  selectCity(selectedIndex);
}

function updateSelectedFromPanel(){
  if(selectedIndex===null)return;
  CITIES[selectedIndex]={
    ...CITIES[selectedIndex],
    name:cityName.value.trim()||"Unbenannter Ort",
    area:cityArea.value.trim(),
    icon:cityIcon.value.trim()||"📍",
    discord:cityDiscord.value.trim()
  };
  createMarkers();
}

function saveToBrowser(){
  updateSelectedFromPanel();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(CITIES));
  alert("Gespeichert im Browser. Für GitHub danach bitte Export data.js nutzen.");
}

function exportDataJs(){
  updateSelectedFromPanel();
  const body="// x und y sind Prozentwerte. Dadurch passen die Marker auch bei 2K, 4K oder 8K.\nlet CITIES = "+JSON.stringify(CITIES,null,2)+";\n";
  navigator.clipboard.writeText(body).then(()=>{
    alert("data.js wurde kopiert. Öffne auf GitHub data.js, ersetze alles und drücke Commit changes.");
  }).catch(()=>{
    const blob=new Blob([body],{type:"text/javascript"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="data.js";
    a.click();
    URL.revokeObjectURL(url);
  });
}

mapImage.addEventListener("load",()=>{
  mapWidth=mapImage.naturalWidth;
  mapHeight=mapImage.naturalHeight;
  map.style.width=mapWidth+"px";
  map.style.height=mapHeight+"px";
  mapImage.style.width=mapWidth+"px";
  mapImage.style.height=mapHeight+"px";
  createMarkers();
  fitMap();
});

viewport.addEventListener("wheel",e=>{
  e.preventDefault();
  const rect=viewport.getBoundingClientRect();
  const mouseX=e.clientX-rect.left, mouseY=e.clientY-rect.top, oldScale=scale;
  scale=Math.min(Math.max(scale*(e.deltaY<0?1.12:.88),.10),8);
  x=mouseX-((mouseX-x)/oldScale)*scale;
  y=mouseY-((mouseY-y)/oldScale)*scale;
  applyTransform();
},{passive:false});

viewport.addEventListener("pointerdown",e=>{
  if(e.target.closest(".marker")||e.target.closest("#toolbar")||e.target.closest("#panel"))return;

  if(editMode && addMode){
    newCityAt(screenToMap(e.clientX,e.clientY));
    return;
  }

  draggingMap=true;
  viewport.classList.add("dragging");
  startX=e.clientX-x;
  startY=e.clientY-y;
  viewport.setPointerCapture(e.pointerId);
});

viewport.addEventListener("pointermove",e=>{
  if(draggingMarker && selectedIndex!==null){
    const point=screenToMap(e.clientX,e.clientY);
    const percent=pxToPercent(point.x,point.y);
    CITIES[selectedIndex].x=Number(percent.x.toFixed(3));
    CITIES[selectedIndex].y=Number(percent.y.toFixed(3));
    createMarkers();
    return;
  }

  if(!draggingMap)return;
  x=e.clientX-startX;
  y=e.clientY-startY;
  applyTransform();
});

viewport.addEventListener("pointerup",()=>{
  draggingMap=false;
  draggingMarker=false;
  viewport.classList.remove("dragging");
});

viewport.addEventListener("pointercancel",()=>{
  draggingMap=false;
  draggingMarker=false;
  viewport.classList.remove("dragging");
});

editorToggle.addEventListener("click",()=>{
  editMode=!editMode;
  editorToggle.classList.toggle("active",editMode);
  if(!editMode){
    addMode=false;
    selectedIndex=null;
    panel.classList.remove("show");
    addModeBtn.classList.remove("active");
    viewport.classList.remove("adding");
    createMarkers();
  }
});

addModeBtn.addEventListener("click",()=>{
  if(!editMode){
    editMode=true;
    editorToggle.classList.add("active");
  }
  addMode=!addMode;
  addModeBtn.classList.toggle("active",addMode);
  viewport.classList.toggle("adding",addMode);
  hint.textContent="Klicke nun auf die Karte, um einen neuen Punkt zu setzen.";
});

applyEdit.addEventListener("click",()=>{
  updateSelectedFromPanel();
  alert("Änderung übernommen. Für dauerhaftes Speichern bitte 💾 Speichern drücken.");
});

deleteCity.addEventListener("click",()=>{
  if(selectedIndex===null)return;
  if(!confirm("Diesen Ort wirklich löschen?"))return;
  CITIES.splice(selectedIndex,1);
  selectedIndex=null;
  panel.classList.remove("show");
  createMarkers();
});

saveLocal.addEventListener("click",saveToBrowser);
exportData.addEventListener("click",exportDataJs);

resetLocal.addEventListener("click",()=>{
  if(!confirm("Lokale Änderungen löschen und data.js neu laden?"))return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

window.addEventListener("resize",fitMap);
