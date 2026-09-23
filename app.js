// Student Dropout Prediction Machine Learning Engine & Application Logic
const modelParams = {
  bias: -0.8385,
  weights: {
    curricular_units_2nd_sem_approved: -1.3435,
    curricular_units_1st_sem_approved: -1.2088,
    tuition_fees_up_to_date: -0.6639,
    debtor: 0.6226,
    curricular_units_1st_sem_grade: -0.6065,
    curricular_units_2nd_sem_grade: -0.7026,
    age_at_enrollment: 0.5350,
    scholarship_holder: -0.1128
  },
  scalingStats: {
    curricular_units_2nd_sem_approved: { mean: 3.7071, std: 2.0518 },
    curricular_units_1st_sem_approved: { mean: 3.8637, std: 1.8697 },
    tuition_fees_up_to_date: { mean: 0.8669, std: 0.3397 },
    debtor: { mean: 0.1331, std: 0.3397 },
    curricular_units_1st_sem_grade: { mean: 11.9198, std: 4.0001 },
    curricular_units_2nd_sem_grade: { mean: 11.6247, std: 4.5211 },
    age_at_enrollment: { mean: 21.5045, std: 2.7756 },
    scholarship_holder: { mean: 0.2043, std: 0.4032 }
  }
};

const correlationTableData = [
  { rank: 1, feature: "curricular_units_2nd_sem_approved", r: -0.92, direction: "Inverse (Higher Approved = Lower Risk)", level: "Extreme High (92%)", badge: "pill-emerald" },
  { rank: 2, feature: "curricular_units_1st_sem_approved", r: -0.87, direction: "Inverse (Higher Approved = Lower Risk)", level: "Very High (87%)", badge: "pill-emerald" },
  { rank: 3, feature: "curricular_units_2nd_sem_grade", r: -0.62, direction: "Inverse (Higher GPA = Lower Risk)", level: "High (62%)", badge: "pill-primary" },
  { rank: 4, feature: "debtor", r: 0.61, direction: "Direct (Debtor = Higher Risk)", level: "High (61%)", badge: "pill-rose" },
  { rank: 5, feature: "tuition_fees_up_to_date", r: -0.57, direction: "Inverse (Up To Date = Lower Risk)", level: "High (57%)", badge: "pill-amber" },
  { rank: 6, feature: "curricular_units_1st_sem_grade", r: -0.56, direction: "Inverse (Higher GPA = Lower Risk)", level: "High (56%)", badge: "pill-primary" },
  { rank: 7, feature: "age_at_enrollment", r: 0.50, direction: "Direct (Older = Higher Risk)", level: "Moderate High (50%)", badge: "pill-rose" },
  { rank: 8, feature: "scholarship_holder", r: -0.16, direction: "Inverse (Scholarship = Lower Risk)", level: "Moderate (16%)", badge: "pill-emerald" }
];

const weightsTableData = [
  { feature: "curricular_units_2nd_sem_approved", weight: -1.3435, odds: "0.26x", dir: "Inverse (Higher Approved = Lower Risk)", interp: "Strongest protective factor against dropout" },
  { feature: "curricular_units_1st_sem_approved", weight: -1.2088, odds: "0.30x", dir: "Inverse (Higher Approved = Lower Risk)", interp: "High 1st semester pass rate reduces dropout risk" },
  { feature: "curricular_units_2nd_sem_grade", weight: -0.7026, odds: "0.50x", dir: "Inverse (Higher GPA = Lower Risk)", interp: "Better grades lower probability of disengagement" },
  { feature: "tuition_fees_up_to_date", weight: -0.6639, odds: "0.51x", dir: "Inverse (Up To Date = Lower Risk)", interp: "Paid tuition removes registration holds" },
  { feature: "debtor", weight: 0.6226, odds: "1.86x", dir: "Direct (Debtor = Higher Risk)", interp: "Financial debt increases dropout odds by 1.86x" },
  { feature: "curricular_units_1st_sem_grade", weight: -0.6065, odds: "0.55x", dir: "Inverse (Higher GPA = Lower Risk)", interp: "1st sem academic foundation" },
  { feature: "age_at_enrollment", weight: 0.5350, odds: "1.71x", dir: "Direct (Older = Higher Risk)", interp: "Mature students face higher competing demands" },
  { feature: "scholarship_holder", weight: -0.1128, odds: "0.89x", dir: "Inverse (Scholarship = Lower Risk)", interp: "Financial aid buffer" }
];

const testCasePresets = {
  1: { sem1_pass: 1, gpa: 9.5, sem2_pass: 0, gpa2: 0.0, age: 26, tuition: 0, debtor: 1, scholarship: 0 },
  2: { sem1_pass: 3, gpa: 10.8, sem2_pass: 3, gpa2: 11.2, age: 22, tuition: 1, debtor: 0, scholarship: 0 },
  3: { sem1_pass: 6, gpa: 14.5, sem2_pass: 6, gpa2: 15.2, age: 19, tuition: 1, debtor: 0, scholarship: 1 },
  4: { sem1_pass: 5, gpa: 12.0, sem2_pass: 4, gpa2: 11.8, age: 20, tuition: 0, debtor: 1, scholarship: 0 }
};

document.addEventListener("DOMContentLoaded", () => {
  renderCorrelationTable();
  renderWeightsTable();
  setupAppListeners();
  calculateRisk();
});

function renderCorrelationTable() {
  const tbody = document.getElementById("eda-table-body");
  if (!tbody) return;

  tbody.innerHTML = correlationTableData.map(item => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 10px 12px; color: var(--text-subtle);">${item.rank}</td>
      <td style="padding: 10px 12px; font-weight: 700; font-family: var(--font-mono); color: var(--primary-light);">${item.feature}</td>
      <td style="padding: 10px 12px; font-family: var(--font-mono); color: ${item.r > 0 ? 'var(--rose)' : 'var(--emerald)'}; font-weight: 700;">${item.r > 0 ? '+' : ''}${item.r}</td>
      <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.85rem;">${item.direction}</td>
      <td style="padding: 10px 12px;"><span class="pill ${item.badge}">${item.level}</span></td>
    </tr>
  `).join("");
}

function renderWeightsTable() {
  const tbody = document.getElementById("weights-table-body");
  if (!tbody) return;

  tbody.innerHTML = weightsTableData.map(item => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 10px 12px; font-weight: 700; font-family: var(--font-mono); color: var(--primary-light);">${item.feature}</td>
      <td style="padding: 10px 12px; font-family: var(--font-mono); color: ${item.weight >= 0 ? 'var(--rose)' : 'var(--emerald)'}; font-weight: 700;">${item.weight >= 0 ? '+' : ''}${item.weight}</td>
      <td style="padding: 10px 12px; font-family: var(--font-mono); color: var(--cyan);">${item.odds}</td>
      <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.85rem;">${item.dir}</td>
      <td style="padding: 10px 12px; color: var(--text-main); font-size: 0.85rem;">${item.interp}</td>
    </tr>
  `).join("");
}

function setupAppListeners() {
  const inputs = ["sem1_pass", "gpa", "sem2_pass", "gpa2", "age", "tuition", "debtor", "scholarship"];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        updateValDisplay(id);
        calculateRisk();
      });
    }
  });
}

function updateValDisplay(id) {
  const el = document.getElementById(id);
  const disp = document.getElementById(`${id}_val`);
  if (!el || !disp) return;

  if (id === "gpa" || id === "gpa2") {
    disp.innerText = `${el.value} / 20.0`;
  } else if (id === "tuition") {
    disp.innerText = el.value === "1" ? "Up to Date (Yes)" : "In Arrears (No)";
  } else if (id === "debtor") {
    disp.innerText = el.value === "1" ? "Debt Owed (Yes)" : "No Debt (0)";
  } else if (id === "scholarship") {
    disp.innerText = el.value === "1" ? "Scholarship (1)" : "No Scholarship (0)";
  } else {
    disp.innerText = el.value;
  }
}

function calculateRisk() {
  const sem1Pass = parseFloat(document.getElementById("sem1_pass")?.value || 3);
  const gpa = parseFloat(document.getElementById("gpa")?.value || 10.8);
  const sem2Pass = parseFloat(document.getElementById("sem2_pass")?.value || 3);
  const gpa2 = parseFloat(document.getElementById("gpa2")?.value || 11.2);
  const age = parseFloat(document.getElementById("age")?.value || 22);
  const tuition = parseInt(document.getElementById("tuition")?.value || 1);
  const debtor = parseInt(document.getElementById("debtor")?.value || 0);
  const scholarship = parseInt(document.getElementById("scholarship")?.value || 0);

  const inputs = {
    curricular_units_1st_sem_approved: sem1Pass,
    curricular_units_1st_sem_grade: gpa,
    curricular_units_2nd_sem_approved: sem2Pass,
    curricular_units_2nd_sem_grade: gpa2,
    age_at_enrollment: age,
    tuition_fees_up_to_date: tuition,
    debtor: debtor,
    scholarship_holder: scholarship
  };

  let logit = modelParams.bias;
  Object.keys(modelParams.weights).forEach(feat => {
    const rawVal = inputs[feat];
    const stat = modelParams.scalingStats[feat];
    const zScore = (rawVal - stat.mean) / stat.std;
    logit += modelParams.weights[feat] * zScore;
  });

  const probability = 1 / (1 + Math.exp(-logit));
  const riskPercent = Math.round(probability * 100);

  const circle = document.getElementById("gauge-circle");
  const percentText = document.getElementById("risk-percent");
  const labelText = document.getElementById("risk-label");
  const recText = document.getElementById("recommendation-box");

  if (!circle || !percentText) return;

  percentText.innerText = `${(probability * 100).toFixed(2)}%`;

  let color = "var(--emerald)";
  let statusText = "LOW RISK / ON TRACK";
  let borderLeft = "var(--emerald)";
  let recHTML = "";

  if (riskPercent >= 60) {
    color = "var(--rose)";
    statusText = "CRITICAL HIGH RISK";
    borderLeft = "var(--rose)";
    recHTML = `
      <strong style="color: var(--rose);">Mandatory Intervention Protocol:</strong>
      <ul style="margin-top: 6px; padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
        <li>Schedule mandatory academic advising session within 5 business days.</li>
        <li>Assign dedicated peer tutor for failed 1st/2nd semester courses.</li>
        <li>Financial aid consultation for tuition payment plan arrangement.</li>
      </ul>
    `;
  } else if (riskPercent >= 25) {
    color = "var(--amber)";
    statusText = "MODERATE RISK";
    borderLeft = "var(--amber)";
    recHTML = `
      <strong style="color: var(--amber);">Recommended Intervention:</strong>
      <ul style="margin-top: 6px; padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
        <li>Send automated early warning check-in survey.</li>
        <li>Invite student to weekly study workshops for courses with low attendance.</li>
      </ul>
    `;
  } else {
    color = "var(--emerald)";
    statusText = "LOW RISK / ON TRACK";
    borderLeft = "var(--emerald)";
    recHTML = `
      <strong style="color: var(--emerald);">Status Normal:</strong>
      <p style="margin-top: 4px; font-size: 0.88rem; color: var(--text-muted);">Student demonstrates strong academic progression. Standard automated tracking active.</p>
    `;
  }

  circle.style.background = `conic-gradient(${color} ${riskPercent}%, rgba(255, 255, 255, 0.05) ${riskPercent}% 100%)`;
  percentText.style.color = color;
  labelText.innerText = statusText;
  labelText.style.color = color;

  if (recText) {
    recText.style.borderLeftColor = borderLeft;
    recText.innerHTML = recHTML;
  }
}

function loadTestCase(id) {
  const preset = testCasePresets[id];
  if (!preset) return;

  Object.keys(preset).forEach(key => {
    const el = document.getElementById(key);
    if (el) {
      el.value = preset[key];
      updateValDisplay(key);
    }
  });

  calculateRisk();
}

function printProofCard() {
  window.print();
}
