//--------------------------------------------------
//  CONFIG — Live endpoints through rivertide1 proxy 
//--------------------------------------------------
const TIDE_URL = "https://rivertide1.onrender.com/api/tides/chester";

const STATIONS = [
  {
    id: "ironbridge",
    name: "Ironbridge",
    url: "https://rivertide1.onrender.com/api/river/ironbridge"
  }
];

//--------------------------------------------------
//  LOAD ON START
//--------------------------------------------------
window.onload = () => {
  loadStationsList();
  loadSelectedStation();
  loadTides();
};

//--------------------------------------------------
//  BUILD LIST OF STATIONS
//--------------------------------------------------
function loadStationsList() {
  const list = document.getElementById("stationList");
  if (!list) return;

  list.innerHTML = "";

  STATIONS.forEach(station => {
    const li = document.createElement("li");
    li.textContent = station.name;
    li.onclick = () => {
      localStorage.setItem("selectedStation", station.id);
      loadSelectedStation();
    };
    list.appendChild(li);
  });
}

//--------------------------------------------------
//  Load whichever station was selected
//--------------------------------------------------
function loadSelectedStation() {
  const selectedId =
    localStorage.getItem("selectedStation") || STATIONS[0].id;

  const station = STATIONS.find(s => s.id === selectedId);
  if (!station) return;

  document.getElementById("stationName").textContent = station.name;

  loadRiver(station.url);
}

//--------------------------------------------------
//  Fetch river data for a station
//--------------------------------------------------
async function loadRiver(url) {
  const levelEl = document.getElementById("riverLevel");
  const timeEl = document.getElementById("riverTime");
  const trendEl = document.getElementById("riverTrend");

  levelEl.textContent = "Loading…";
  timeEl.textContent = "";
  trendEl.textContent = "";

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!data.levels || data.levels.length === 0) {
      levelEl.textContent = "No data";
      return;
    }

    const readings = data.levels;
    const latest = readings[0];
    const prev = readings[1];

    const latestLevel = Number(latest.avg_level);
    levelEl.textContent = latestLevel.toFixed(2) + " m";
    timeEl.textContent = latest.record_date;

    if (prev) {
      const prevLevel = Number(prev.avg_level);
      trendEl.textContent =
        latestLevel > prevLevel ? "Rising ↑" :
        latestLevel < prevLevel ? "Falling ↓" :
        "Steady →";
    }

    buildRiverChart(
      readings.map(r => ({
        time: r.record_date,
        value: Number(r.avg_level)
      }))
    );
  } catch (e) {
    levelEl.textContent = "Error loading river data";
    console.error("River load error:", e);
  }
}

//--------------------------------------------------
//  Draw line chart
//--------------------------------------------------
let riverChart = null;

function buildRiverChart(rows) {
  const ctx = document.getElementById("riverChart").getContext("2d");

  if (riverChart) riverChart.destroy();

  riverChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: rows.map(r => r.time),
      datasets: [
        {
          label: "River Level (m)",
          data: rows.map(r => r.value),
          borderWidth: 2,
          tension: 0.25,
          fill: false
        }
      ]
    }
  });
}

//--------------------------------------------------
//  Load Chester tide times
//--------------------------------------------------
async function loadTides() {
  const list = document.getElementById("tideList");
  list.innerHTML = "<li>Loading…</li>";

  try {
    const res = await fetch(TIDE_URL, { cache: "no-store" });
    const data = await res.json();

    if (!data.tides) {
      list.innerHTML = "<li>No tide data</li>";
      return;
    }

    list.innerHTML = "";

    data.tides.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t.type + " — " + t.time + " — " + t.height;
      list.appendChild(li);
    });
  } catch (e) {
    list.innerHTML = "<li>Error loading tide data</li>";
    console.error("Tide load error:", e);
  }
}
