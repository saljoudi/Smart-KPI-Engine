/* ============================================================
   SMART KPI ENGINE – MAIN SCRIPT (v3.0)
   Unified Logic for KPI + Ontology Modes
   ============================================================ */

let kpiData = {};
let kpiRelationships = {};
let alerts = [];
let selectedKPI = null;
let connectionChart = null;
let currentMode = "kpi";

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadData();
    initializeParticles();
    initializeRevealAnimations();
    initializeTypedText();
    renderAlerts();

    // Default mode is KPI
    initializeKPIView();

    // Event listener for mode switching (shared with index.html)
    const modeSwitch = document.getElementById("mode-switch");
    if (modeSwitch) {
      modeSwitch.addEventListener("change", () => switchMode(modeSwitch.value));
    }

    setupEventListeners();
    console.log("✅ Smart KPI Engine initialized successfully");
  } catch (err) {
    console.error("❌ Initialization error:", err);
  }
});

/* ============================================================
   DATA LOADING
   ============================================================ */
async function loadData() {
  try {
    const [kpiRes, relRes, alertsRes] = await Promise.all([
      fetch("kpi_data.json"),
      fetch("kpi_relationships.json"),
      fetch("alerts.json"),
    ]);
    kpiData = await kpiRes.json();
    kpiRelationships = await relRes.json();
    alerts = await alertsRes.json();
  } catch (e) {
    console.warn("⚠️ Using fallback data", e);
    initializeFallbackData();
  }
}

/* ============================================================
   FALLBACK DATA
   ============================================================ */
function initializeFallbackData() {
  kpiData = {
    "General Medical Center": {
      "Emergency Department": {
        "Average Wait Time": {
          current_value: 27.2,
          target: "< 30",
          unit: "minutes",
          type: "lower_better",
        },
        "Patient Satisfaction": {
          current_value: 3.9,
          target: "> 4.0",
          unit: "score/5",
          type: "higher_better",
        },
      },
    },
  };

  kpiRelationships = {
    "Average Wait Time": {
      impacts: [
        {
          kpi: "Patient Satisfaction",
          strength: -0.8,
          description: "Longer waits reduce satisfaction.",
        },
      ],
    },
  };

  alerts = [
    {
      hospital: "General Medical Center",
      department: "Emergency Department",
      kpi: "Patient Satisfaction",
      level: "warning",
      message: "Patient satisfaction below target (3.9 vs >4.0)",
      rootCause: "Extended average wait times",
      recommendation: "Reduce queue times by optimizing triage",
    },
  ];
}

/* ============================================================
   MODE SWITCHING
   ============================================================ */
function switchMode(mode) {
  currentMode = mode;
  const kpiSection = document.getElementById("kpi-section");
  const ontologySection = document.getElementById("ontology-section");

  if (mode === "kpi") {
    kpiSection.style.display = "block";
    ontologySection.style.display = "none";
    initializeKPIView();
  } else {
    kpiSection.style.display = "none";
    ontologySection.style.display = "block";
    initializeOntologyView();
  }
  console.log("🔄 Mode switched:", mode);
}

/* ============================================================
   KPI MODE: PERFORMANCE & TREND VISUALIZATION
   ============================================================ */
function initializeKPIView() {
  const performanceChart = echarts.init(
    document.getElementById("performance-chart")
  );
  const trendChart = echarts.init(document.getElementById("trend-chart"));

  const hospitals = [
    "General Medical Center",
    "Regional Health System",
    "Community Hospital",
  ];

  const colors = {
    "General Medical Center": "#1B4B5A",
    "Regional Health System": "#E07A5F",
    "Community Hospital": "#81B29A",
  };

  performanceChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: hospitals, bottom: 0 },
    xAxis: { type: "category", data: ["Emergency", "Surgery", "Nursing", "Supply", "Admin"] },
    yAxis: { type: "value", max: 100 },
    series: hospitals.map((h) => ({
      name: h,
      type: "bar",
      data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 30) + 70),
      itemStyle: { color: colors[h] },
    })),
  });

  trendChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: hospitals, bottom: 0 },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
    yAxis: { type: "value", max: 100 },
    series: hospitals.map((h) => ({
      name: h,
      type: "line",
      smooth: true,
      data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 20) + 70),
      itemStyle: { color: colors[h] },
    })),
  });

  window.addEventListener("resize", () => {
    performanceChart.resize();
    trendChart.resize();
  });
}

/* ============================================================
   ONTOLOGY MODE: KPI CONNECTIONS + RELATIONSHIPS
   ============================================================ */
function initializeOntologyView() {
  renderKPIMatrix();
  initializeConnectionChart();
  generateInsights();
  initializeRelationshipPanel();
}

/* ============================================================
   ALERTS
   ============================================================ */
function renderAlerts() {
  const container = document.getElementById("alerts-container");
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `<p class='text-gray-500'>No active alerts</p>`;
    return;
  }

  container.innerHTML = alerts
    .map(
      (a, i) => `
    <div class="alert-item flex justify-between bg-gray-50 p-4 rounded-lg border-l-4 border-${
      a.level === "critical"
        ? "red"
        : a.level === "warning"
        ? "yellow"
        : "blue"
    }-500 cursor-pointer" data-index="${i}">
      <div>
        <p class="font-semibold">${a.hospital} – ${a.department}</p>
        <p class="text-sm text-gray-600">${a.message}</p>
      </div>
      <span class="text-xs text-gray-400">${new Date().toLocaleTimeString()}</span>
    </div>`
    )
    .join("");

  container.querySelectorAll(".alert-item").forEach((el) =>
    el.addEventListener("click", () =>
      showAlertDetails(alerts[el.dataset.index])
    )
  );
}

function showAlertDetails(alert) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-white p-6 rounded-xl shadow-lg w-96">
      <h3 class="text-lg font-semibold mb-2">⚠️ ${alert.kpi} Alert</h3>
      <p class="text-sm text-gray-700 mb-3">${alert.message}</p>
      <p class="text-sm text-gray-500"><strong>Root Cause:</strong> ${
        alert.rootCause || "N/A"
      }</p>
      <p class="text-sm text-gray-500 mb-3"><strong>Recommendation:</strong> ${
        alert.recommendation || "N/A"
      }</p>
      <div class="text-right">
        <button id="closeAlertModal" class="bg-teal-600 text-white px-3 py-1 rounded">Close</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById("closeAlertModal").onclick = () => modal.remove();
}

/* ============================================================
   KPI MATRIX & RELATIONSHIPS
   ============================================================ */
function renderKPIMatrix() {
  const container = document.getElementById("kpi-matrix");
  if (!container) return;
  container.innerHTML = "";

  for (const [hospital, depts] of Object.entries(kpiData)) {
    for (const [dept, kpis] of Object.entries(depts)) {
      for (const [name, data] of Object.entries(kpis)) {
        container.appendChild(createKPICard(hospital, dept, name, data));
      }
    }
  }
}

function createKPICard(hospital, department, name, data) {
  const card = document.createElement("div");
  card.className =
    "kpi-card rounded-xl p-5 bg-white shadow cursor-pointer hover:shadow-md transition relative";
  card.dataset.hospital = hospital;
  card.dataset.department = department;
  card.dataset.kpi = name;

  const status = getKPIStatus(data.current_value, data.target, data.type);
  card.innerHTML = `
    <h3 class="text-gray-800 font-semibold mb-1">${name}</h3>
    <p class="text-2xl font-bold">${data.current_value} <span class="text-sm text-gray-500">${data.unit}</span></p>
    <p class="text-xs text-gray-500 mb-2">Target: ${data.target}</p>
    <span class="inline-block text-xs px-2 py-1 rounded bg-${
      status === "good" ? "green" : "yellow"
    }-100 text-${status === "good" ? "green" : "yellow"}-700">${status}</span>
  `;

  card.addEventListener("click", () =>
    selectKPI(hospital, department, name)
  );
  return card;
}

/* ============================================================
   RELATIONSHIP DETAILS PANEL
   ============================================================ */
function initializeRelationshipPanel() {
  if (document.getElementById("relationship-panel")) return;
  const panel = document.createElement("div");
  panel.id = "relationship-panel";
  panel.className =
    "hidden fixed top-20 right-6 w-80 bg-white shadow-lg rounded-xl border border-gray-200 p-4 z-40";
  document.body.appendChild(panel);
}

function selectKPI(hospital, dept, kpiName) {
  document
    .querySelectorAll(".kpi-card")
    .forEach((c) => c.classList.remove("highlighted"));

  const card = document.querySelector(
    `[data-hospital="${hospital}"][data-department="${dept}"][data-kpi="${kpiName}"]`
  );
  if (!card) return;
  card.classList.add("highlighted");

  const rel = kpiRelationships[kpiName];
  if (rel) showRelationshipDetails(kpiName, rel);

  updateConnectionChart(hospital, dept, kpiName);
  selectedKPI = { hospital, dept, kpiName };
}

function showRelationshipDetails(kpiName, rel) {
  const panel = document.getElementById("relationship-panel");
  if (!panel) return;

  let html = `<h3 class="font-semibold text-gray-800 mb-2">${kpiName}</h3>`;
  if (rel.impacts?.length)
    html += `<div class="mb-3"><strong>Impacts:</strong><ul class="list-disc ml-5">${rel.impacts
      .map(
        (i) =>
          `<li><span class="font-medium">${i.kpi}</span> (${i.strength > 0 ? "↑" : "↓"} ${
            Math.abs(i.strength * 100).toFixed(0)
          }%): ${i.description}</li>`
      )
      .join("")}</ul></div>`;

  panel.innerHTML = html;
  panel.style.display = "block";
}

/* ============================================================
   CONNECTION CHART
   ============================================================ */
function initializeConnectionChart() {
  const el = document.getElementById("connection-chart");
  if (!el) return;
  connectionChart = echarts.init(el);
  connectionChart.setOption({
    title: { text: "KPI Relationship Network", left: "center" },
    tooltip: {
      trigger: "item",
      formatter: (p) =>
        p.dataType === "node"
          ? `<b>${p.data.name}</b><br>Value: ${p.data.value}`
          : `${p.data.source} → ${p.data.target}<br>Strength: ${p.data.strength}`,
    },
    series: [
      {
        type: "graph",
        layout: "force",
        data: [],
        links: [],
        roam: true,
        force: { repulsion: 120 },
        label: { show: true },
      },
    ],
  });
}

/* ============================================================
   INSIGHTS
   ============================================================ */
function generateInsights() {
  const c = document.getElementById("insights-container");
  if (!c) return;
  const items = [
    {
      title: "Wait Time Impact",
      desc: "Longer ER wait times correlate with lower satisfaction.",
      impact: "High",
    },
    {
      title: "Staff Utilization",
      desc: "Overutilization leads to burnout & higher error rates.",
      impact: "Critical",
    },
  ];
  c.innerHTML = items
    .map(
      (i) => `
    <div class="bg-gradient-to-br from-blue-50 to-teal-50 p-5 rounded-lg border mb-3">
      <h4 class="font-semibold">${i.title}</h4>
      <p class="text-sm text-gray-600 mb-2">${i.desc}</p>
      <span class="text-xs px-2 py-1 rounded bg-${
        i.impact === "Critical" ? "red" : "orange"
      }-100 text-${i.impact === "Critical" ? "red" : "orange"}-800">${i.impact}</span>
    </div>`
    )
    .join("");
}

/* ============================================================
   HELPERS
   ============================================================ */
function getKPIStatus(val, target, type) {
  const num = parseFloat(target.replace(/[^0-9.]/g, ""));
  if (type === "lower_better") return val < num ? "good" : "warning";
  if (type === "higher_better") return val > num ? "good" : "warning";
  return "good";
}

function updateConnectionChart(hospital, department, kpiName) {
  if (!connectionChart) return;
  const nodes = [];
  const links = [];
  const added = new Set();
  const base = {
    name: kpiName,
    value: kpiData[hospital][department][kpiName].current_value,
  };
  nodes.push(base);
  added.add(kpiName);
  const rel = kpiRelationships[kpiName];
  if (rel) {
    rel.impacts?.forEach((imp) => {
      if (!added.has(imp.kpi)) {
        nodes.push({ name: imp.kpi, value: findKPIValue(imp.kpi) });
        added.add(imp.kpi);
      }
      links.push({ source: kpiName, target: imp.kpi, strength: Math.abs(imp.strength) });
    });
  }
  connectionChart.setOption({ series: [{ data: nodes, links: links }] });
}

function findKPIValue(kpiName) {
  for (const hospital of Object.values(kpiData)) {
    for (const department of Object.values(hospital)) {
      if (department[kpiName]) return department[kpiName].current_value;
    }
  }
  return 0;
}

/* ============================================================
   ANIMATIONS & PARTICLES
   ============================================================ */
function initializeParticles() {
  const container = document.getElementById("particles");
  if (!container) return;
  for (let i = 0; i < 15; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDelay = Math.random() * 4 + "s";
    p.style.animationDuration = 4 + Math.random() * 3 + "s";
    container.appendChild(p);
  }
}

function initializeRevealAnimations() {
  const els = document.querySelectorAll(".reveal-animation");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) =>
        e.isIntersecting ? e.target.classList.add("revealed") : null
      ),
    { threshold: 0.1 }
  );
  els.forEach((el) => observer.observe(el));
}

function initializeTypedText() {
  if (!document.getElementById("typed-text")) return;
  new Typed("#typed-text", {
    strings: ["Disconnected Data", "Siloed Metrics", "Reactive Decisions"],
    typeSpeed: 70,
    backSpeed: 50,
    backDelay: 1800,
    loop: true,
  });
}

/* ============================================================
   GLOBAL LISTENERS
   ============================================================ */
function setupEventListeners() {
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".kpi-card") &&
      !e.target.closest("#relationship-panel") &&
      !e.target.closest("#alerts-container")
    ) {
      const panel = document.getElementById("relationship-panel");
      if (panel) panel.style.display = "none";
    }
  });
}
