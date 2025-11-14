// Live endpoints
const TIDE_URL = "https://tide-proxy.onrender.com/tides/chester";

const STATIONS = [
  {
    id: "ironbridge",
    name: "Ironbridge",
    url: "https://riverlevels.uk/dee-aldford-ironbridge-dee/data/json/10"
  },
  // You can add/edit more stations here as needed:
  {
    id: "bangor",
    name: "Bangor-on-Dee",
    url: "https://riverlevels.uk/dee-bangor-on-dee-dee/data/json/10"
  },
  {
    id: "farndon",
    name: "Farndon",
    url: "https://riverlevels.uk/dee-farndon-dee/data/json/10"
  },
  {
    id: "rossett",
    name: "Rossett / Alyn Bridge",
    url: "https://riverlevels.uk/alyn-rossett-community-rossett-alyn-bridge/data/json/10"
  },
  {
    id: "bowling",
    name: "Bowling Bank",
    url: "https://riverlevels.uk/dee-bowling-bank-dee/data/json/10"
  },
  {
    id: "leahall",
    name: "Lea Hall",
    url: "https://riverlevels.uk/aldford-brook-lea-hall/data/json/10"
  }
];

let currentStation = STATIONS[0];
let chart;

function createStationButtons() {
  const container = document.getElementById("stationButtons");
  container.innerHTML = "";
  STATIONS.forEach(st => {
    const btn = document.createElement("button");
    btn.className = "station-btn" + (st.id === currentStation.id ? " active" : "");
    btn.textContent = st.name;
    btn.onclick = () => {
      currentStation = st;
      document.getElementById("stationName").textContent = st.name;
      document
        .querySelectorAll(".station-btn")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadRiverForStation(st);
    };
    container.appendChild(btn);
  });
}

async function loadRiverForStation(station) {
  const levelEl = document.getElementById("riverLevel");
  const timeEl = document.getElementById("riverTime");
  const trendEl = document.getElementById("riverTrend");
  const noteEl = document.getElementById("chartNote");

  levelEl.textContent = "Loading…";
  timeEl.textContent = "--";
  trendEl.textContent = "Fetching data…";
  noteEl.textContent = "";

  try {
    const res = await fetch(station.url, { cache: "no-store" });
    const data = await res.json();

    // We don't fully know the structure of riverlevels.uk JSON,
    // so we try to be defensive / flexible.

    let readings = [];

    if (Array.isArray(data)) {
      readings = data;
    } else if (data.readings && Array.isArray(data.readings)) {
      readings = data.readings;
    } else if (data.data && Array.isArray(data.data)) {
      readings = data.data;
    } else if (data.series && Array.isArray(data.series)) {
      readings = data.series;
    } else {
      console.warn("Unknown riverlevels JSON structure. Showing raw sample.", data);
      trendEl.textContent = "Unknown JSON format – open console for details.";
      levelEl.textContent = "--";
      return;
    }

    if (!readings.length) {
      levelEl.textContent = "-- m";
      trendEl.textContent = "No readings";
      return;
    }

    const latest = readings[readings.length - 1];

    // Try to guess timestamp & level keys
    const sample = latest;
    const keys = Object.keys(sample);

    let valueKey = keys.find(k => k.toLowerCase().includes("level") || k.toLowerCase().includes("value")) || keys[1];
    let timeKey = keys.find(k => k.toLowerCase().includes("time") || k.toLowerCase().includes("date")) || keys[0];

    const latestLevel = Number(sample[valueKey]);
    const latestTime = String(sample[timeKey]);

    if (!isNaN(latestLevel)) {
      levelEl.textContent = latestLevel.toFixed(2) + " m";
    } else {
      levelEl.textContent = String(sample[valueKey]);
    }
    timeEl.textContent = latestTime;

    // Trend: compare last two points
    if (readings.length >= 2) {
      const prev = readings[readings.length - 2];
      const prevVal = Number(prev[valueKey]);
      if (!isNaN(prevVal) && !isNaN(latestLevel)) {
        if (latestLevel > prevVal) trendEl.textContent = "Rising";
        else if (latestLevel < prevVal) trendEl.textContent = "Falling";
        else trendEl.textContent = "Steady";
      } else {
        trendEl.textContent = "Trend unknown";
      }
    } else {
      trendEl.textContent = "Trend unknown";
    }

    buildChartFromReadings(readings, timeKey, valueKey);
    noteEl.textContent = "If the chart looks odd, check JSON structure in the browser console and adjust app.js parsing.";
  } catch (e) {
    console.error(e);
    document.getElementById("riverLevel").textContent = "--";
    document.getElementById("riverTime").textContent = "--";
    document.getElementById("riverTrend").textContent = "Error loading data";
  }
}

function buildChartFromReadings(readings, timeKey, valueKey) {
  const labels = [];
  const values = [];

  readings.forEach(r => {
    labels.push(String(r[timeKey]));
    values.push(Number(r[valueKey]));
  });

  const ctx = document.getElementById("riverChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "River level (m)",
          data: values,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          display: false
        },
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

async function loadTides() {
  const list = document.getElementById("tideList");
  list.innerHTML = "<li>Loading…</li>";
  try {
    const res = await fetch(TIDE_URL, { cache: "no-store" });
    const data = await res.json();
    const tides = data.tides || [];

    if (!tides.length) {
      list.innerHTML = "<li>No tide data</li>";
      return;
    }

    list.innerHTML = "";
    tides.slice(0, 20).forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.title} — ${t.time}`;
      list.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = "<li>Error loading tides</li>";
  }
}

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(console.error);
  }
}

window.addEventListener("load", () => {
  createStationButtons();
  loadRiverForStation(currentStation);
  loadTides();
  registerSW();
});
