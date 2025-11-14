
const TIDE_URL = "https://tide-proxy.onrender.com/tides/chester";
const RIVER_URL = "https://riverlevels.uk/dee-aldford-ironbridge-dee/data/json/10";

window.onload = () => {
  loadRiver();
  loadTides();
};

async function loadRiver(){
  try{
    const r = await fetch(RIVER_URL);
    const j = await r.json();
    const readings = j.levels;

    const latest = readings[0];
    const latestLevel = Number(latest.avg_level);
    const latestTime = latest.record_date;

    document.getElementById("riverLevel").textContent = latestLevel.toFixed(2)+" m";
    document.getElementById("riverTime").textContent = latestTime;

    const prev = Number(readings[1].avg_level);
    document.getElementById("riverTrend").textContent =
      latestLevel > prev ? "Rising" :
      latestLevel < prev ? "Falling" : "Steady";

    const data = readings.map(r => ({time:r.record_date, value:Number(r.avg_level)}));
    buildChart(data);
  }
  catch(e){
    document.getElementById("riverLevel").textContent = "ERR";
  }
}

function buildChart(r){
  const ctx = document.getElementById("riverChart").getContext("2d");
  new Chart(ctx,{
    type:"line",
    data:{
      labels:r.map(x=>x.time),
      datasets:[{label:"Level m", data:r.map(x=>x.value), borderWidth:2}]
    }
  });
}

async function loadTides(){
  const ul = document.getElementById("tideList");
  ul.innerHTML = "<li>Loading…</li>";
  try{
    const r = await fetch(TIDE_URL);
    const j = await r.json();
    ul.innerHTML = "";
    j.tides.slice(0,15).forEach(t=>{
      const li = document.createElement("li");
      li.textContent = t.title+" — "+t.time;
      ul.appendChild(li);
    });
  }
  catch(e){
    ul.innerHTML = "<li>Error</li>";
  }
}
