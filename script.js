const viewport=document.getElementById("viewport");
const map=document.getElementById("map");
const mapImage=document.getElementById("mapImage");
const markers=document.getElementById("markers");
const editorToggle=document.getElementById("editorToggle");
const exportData=document.getElementById("exportData");
const editorPanel=document.getElementById("editorPanel");
const cityName=document.getElementById("cityName");
const cityArea=document.getElementById("cityArea");
const cityIcon=document.getElementById("cityIcon");
const cityDiscord=document.getElementById("cityDiscord");
const saveCity=document.getElementById("saveCity");
const cancelCity=document.getElementById("cancelCity");

let mapWidth=4096,mapHeight=3072,scale=1,x=0,y=0,dragging=false,startX=0,startY=0;
let editMode=false;
let pendingPoint=null;

function applyTransform(){map.style.transform=`translate(${x}px, ${y}px) scale(${scale})`}

function fitMap(){
  const vw=viewport.clientWidth,vh=viewport.clientHeight;
  scale=Math.min(vw/mapWidth,vh/mapHeight,1);
  x=(vw-mapWidth*scale)/2;
  y=(vh-mapHeight*scale)/2;
  applyTransform();
}

function cityToPx(city){return {x:(city.x/100)*mapWidth,y:(city.y/100)*mapHeight}}

function createMarkers(){
  markers.innerHTML="";
  CITIES.forEach((city,i)=>{
    const p=cityToPx(city);
    const a=document.createElement("a");
    a.className="marker";
    a.href=city.discord || "#";
    a.target="_blank";
    a.rel="noopener noreferrer";
    a.style.left=p.x+"px";
    a.style.top=p.y+"px";
    a.innerHTML=`<span class="marker-dot"></span><span class="tooltip"><strong>${city.icon||"📍"} ${city.name}</strong><small>${city.area||""}</small></span>`;
    a.addEventListener("click",e=>{if(editMode){e.preventDefault()}});
    markers.appendChild(a);
  });
}

function screenToMap(clientX,clientY){
  const rect=viewport.getBoundingClientRect();
  const sx=clientX-rect.left;
  const sy=clientY-rect.top;
  return {x:(sx-x)/scale,y:(sy-y)/scale}
}

function openEditorAt(point){
  pendingPoint={
    x:Math.max(0,Math.min(100,(point.x/mapWidth)*100)),
    y:Math.max(0,Math.min(100,(point.y/mapHeight)*100))
  };
  cityName.value="";
  cityArea.value="";
  cityIcon.value="📍";
  cityDiscord.value="";
  editorPanel.hidden=false;
  cityName.focus();
}

function exportDataJs(){
  const body="let CITIES = "+JSON.stringify(CITIES,null,2)+";\n";
  navigator.clipboard.writeText("// x und y sind Prozentwerte. Dadurch passen die Marker auch bei 2K, 4K oder 8K.\n"+body)
    .then(()=>alert("data.js wurde kopiert. Jetzt data.js auf GitHub öffnen, alles ersetzen und Commit changes drücken."))
    .catch(()=>alert("Kopieren ging nicht automatisch. Öffne die Browser-Konsole oder sag mir Bescheid."));
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
  if(e.target.closest(".marker")||e.target.closest("#toolbar")||e.target.closest("#editorPanel"))return;
  if(editMode){
    openEditorAt(screenToMap(e.clientX,e.clientY));
    return;
  }
  dragging=true;
  viewport.classList.add("dragging");
  startX=e.clientX-x;
  startY=e.clientY-y;
  viewport.setPointerCapture(e.pointerId);
});

viewport.addEventListener("pointermove",e=>{
  if(!dragging)return;
  x=e.clientX-startX;
  y=e.clientY-startY;
  applyTransform();
});

viewport.addEventListener("pointerup",()=>{dragging=false;viewport.classList.remove("dragging")});
viewport.addEventListener("pointercancel",()=>{dragging=false;viewport.classList.remove("dragging")});

editorToggle.addEventListener("click",()=>{
  editMode=!editMode;
  editorToggle.classList.toggle("active",editMode);
  viewport.classList.toggle("editing",editMode);
});

saveCity.addEventListener("click",()=>{
  if(!pendingPoint)return;
  if(!cityName.value.trim()){alert("Bitte Stadtname eintragen.");return}
  CITIES.push({
    name:cityName.value.trim(),
    area:cityArea.value.trim(),
    icon:cityIcon.value.trim()||"📍",
    x:Number(pendingPoint.x.toFixed(3)),
    y:Number(pendingPoint.y.toFixed(3)),
    discord:cityDiscord.value.trim()
  });
  pendingPoint=null;
  editorPanel.hidden=true;
  createMarkers();
});

cancelCity.addEventListener("click",()=>{pendingPoint=null;editorPanel.hidden=true});
exportData.addEventListener("click",exportDataJs);
window.addEventListener("resize",fitMap);
