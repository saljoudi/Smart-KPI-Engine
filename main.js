/* ============================================================
   SMART KPI ENGINE – MAIN SCRIPT (v2.0)
   ============================================================ */

let kpiData = {};
let kpiRelationships = {};
let alerts = [];
let selectedKPI = null;
let connectionChart = null;

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadData();
    initializeTypedText();
    initializeParticles();
    initializeRevealAnimations();
    renderAlerts();
    renderKPIMatrix();
    initializeConnectionChart();
    generateInsights();
    initializeRelationshipPanel();
    setupEventListeners();
    console.log("✅ Smart KPI Engine initialized successfully");
  } catch (err) {
    console.error("❌ Initialization error:", err);
  }
});

/* ============================================================
   LOAD DATA
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
          trend: [29, 28.2, 27.9, 27.3, 27.2],
        },
        "Patient Satisfaction": {
          current_value: 3.9,
          target: "> 4.0",
          unit: "score/5",
          type: "higher_better",
          trend: [3.7, 3.8, 3.9],
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
      message:
        "Patient satisfaction below target (3.9 vs >4.0)",
      rootCause: "Extended average wait times",
      recommendation: "Reduce queue times by optimizing triage",
    },
  ];
}

/* ============================================================
   ANIMATIONS AND VISUAL INIT
   ============================================================ */
function initializeTypedText() {
  new Typed("#typed-text", {
    strings: [
      "Disconnected Data",
      "Siloed Metrics",
      "Isolated KPIs",
      "Reactive Decisions",
    ],
    typeSpeed: 70,
    backSpeed: 50,
    backDelay: 1800,
    loop: true,
  });
}

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

/* ============================================================
   ALERTS RENDERING
   ============================================================ */
function renderAlerts() {
  const c = document.getElementById("alerts-container");
  if (!c) return;

  if (alerts.length === 0) {
    c.innerHTML = `<p class='text-gray-500'>No active alerts</p>`;
    return;
  }

  c.innerHTML = alerts
    .map(
      (a, i) => `
    <div class="alert-item flex items-center justify-between bg-gray-50 p-4 rounded-lg border-l-4 border-${
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

  c.querySelectorAll(".alert-item").forEach((el) =>
    el.addEventListener("click", () => showAlertDetails(alerts[el.dataset.index]))
  );
}

/* ============================================================
   ALERT DETAILS MODAL
   ============================================================ */
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
      status === "excellent"
        ? "green"
        : status === "warning"
        ? "yellow"
        : "red"
    }-100 text-${status === "excellent" ? "green" : "red"}-700">${status}</span>
  `;

  card.addEventListener("click", () => selectKPI(hospital, department, name));
  return card;
}

/* ============================================================
   KPI SELECTION + RELATIONSHIP PANEL
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
  document.getElementById("connection-lines")?.replaceChildren();

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

/* ============================================================
   RELATIONSHIP DETAILS PANEL
   ============================================================ */
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
  if (rel.affected_by?.length)
    html += `<div><strong>Affected by:</strong><ul class="list-disc ml-5">${rel.affected_by
      .map(
        (a) =>
          `<li><span class="font-medium">${a.kpi}</span> (${a.strength > 0 ? "↑" : "↓"} ${
            Math.abs(a.strength * 100).toFixed(0)
          }%): ${a.description}</li>`
      )
      .join("")}</ul></div>`;

  panel.innerHTML = html;
  panel.classList.remove("hidden");
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
   HELPERS + EVENT LISTENERS
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
    rel.affected_by?.forEach((aff) => {
      if (!added.has(aff.kpi)) {
        nodes.push({ name: aff.kpi, value: findKPIValue(aff.kpi) });
        added.add(aff.kpi);
      }
      links.push({ source: aff.kpi, target: kpiName, strength: Math.abs(aff.strength) });
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

function setupEventListeners() {
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".kpi-card") &&
      !e.target.closest("#relationship-panel") &&
      !e.target.closest("#alerts-container")
    )
      document.getElementById("relationship-panel")?.classList.add("hidden");
  });
}
