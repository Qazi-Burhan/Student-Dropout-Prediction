const fs = require('fs');
const path = require('path');

console.log("=== DAY 18: EXPLORATORY DATA ANALYSIS & FEATURE IMPORTANCE ===");

const cleanCsvPath = path.join(__dirname, "cleaned_student_dropout.csv");
if (!fs.existsSync(cleanCsvPath)) {
  console.error("Error: cleaned_student_dropout.csv not found.");
  process.exit(1);
}

const csvData = fs.readFileSync(cleanCsvPath, "utf-8");
const lines = csvData.trim().split("\n");
const header = lines[0].split(",");
const rows = lines.slice(1).map(l => l.split(","));

console.log(`Loaded Cleaned Dataset: ${rows.length} rows, ${header.length} columns.`);

const targetIdx = header.indexOf("target_binary");
const targetRawIdx = header.indexOf("target_raw");

// 1. Compute Pearson Correlation Matrix with target_binary (1 = Dropout)
const featureCols = header.filter(c => c !== "target_raw" && c !== "target_binary" && c !== "target_multiclass");

const targetVals = rows.map(r => parseFloat(r[targetIdx]));
const meanTarget = targetVals.reduce((a, b) => a + b, 0) / targetVals.length;

const correlations = [];

featureCols.forEach(col => {
  const cIdx = header.indexOf(col);
  const colVals = rows.map(r => parseFloat(r[cIdx]));
  const meanCol = colVals.reduce((a, b) => a + b, 0) / colVals.length;

  let num = 0;
  let denCol = 0;
  let denTarget = 0;

  for (let i = 0; i < rows.length; i++) {
    const diffCol = colVals[i] - meanCol;
    const diffTarget = targetVals[i] - meanTarget;
    num += diffCol * diffTarget;
    denCol += diffCol * diffCol;
    denTarget += diffTarget * diffTarget;
  }

  const r = num / (Math.sqrt(denCol) * Math.sqrt(denTarget));
  correlations.push({
    feature: col,
    correlation: parseFloat(r.toFixed(4)),
    abs_correlation: parseFloat(Math.abs(r).toFixed(4))
  });
});

correlations.sort((a, b) => b.abs_correlation - a.abs_correlation);

console.log("\nTop Feature Correlations with Dropout Risk (target_binary = 1):");
correlations.forEach((item, i) => {
  console.log(`${i + 1}. ${item.feature.padEnd(38)} : r = ${item.correlation > 0 ? '+' : ''}${item.correlation}`);
});

// 2. Cross-Tabulations for Key Features

// A. Tuition Fees Up To Date vs Dropout Rate
let tuitionDebtCount = 0, tuitionDebtDropout = 0;
let tuitionOkCount = 0, tuitionOkDropout = 0;

rows.forEach(r => {
  const tuition = parseInt(r[header.indexOf("tuition_fees_up_to_date")]);
  const isDropout = parseInt(r[targetIdx]) === 1;
  if (tuition === 1) {
    tuitionOkCount++;
    if (isDropout) tuitionOkDropout++;
  } else {
    tuitionDebtCount++;
    if (isDropout) tuitionDebtDropout++;
  }
});

const tuitionOkDropoutRate = ((tuitionOkDropout / tuitionOkCount) * 100).toFixed(1);
const tuitionDebtDropoutRate = ((tuitionDebtDropout / tuitionDebtCount) * 100).toFixed(1);

// B. Scholarship Holder vs Dropout Rate
let scholYesCount = 0, scholYesDropout = 0;
let scholNoCount = 0, scholNoDropout = 0;

rows.forEach(r => {
  const schol = parseInt(r[header.indexOf("scholarship_holder")]);
  const isDropout = parseInt(r[targetIdx]) === 1;
  if (schol === 1) {
    scholYesCount++;
    if (isDropout) scholYesDropout++;
  } else {
    scholNoCount++;
    if (isDropout) scholNoDropout++;
  }
});

const scholYesDropoutRate = ((scholYesDropout / scholYesCount) * 100).toFixed(1);
const scholNoDropoutRate = ((scholNoDropout / scholNoCount) * 100).toFixed(1);

// C. 1st Sem Approved Units vs Dropout Rate
const unitsApprovedMap = {};
rows.forEach(r => {
  const units = parseInt(r[header.indexOf("curricular_units_1st_sem_approved")]);
  const isDropout = parseInt(r[targetIdx]) === 1;
  if (!unitsApprovedMap[units]) unitsApprovedMap[units] = { total: 0, dropout: 0 };
  unitsApprovedMap[units].total++;
  if (isDropout) unitsApprovedMap[units].dropout++;
});

const unitsSummary = Object.keys(unitsApprovedMap).sort((a,b)=>a-b).map(u => ({
  units_approved: parseInt(u),
  total: unitsApprovedMap[u].total,
  dropout: unitsApprovedMap[u].dropout,
  dropout_rate: parseFloat(((unitsApprovedMap[u].dropout / unitsApprovedMap[u].total) * 100).toFixed(1))
}));

const edaResults = {
  feature_correlations: correlations,
  cross_tabs: {
    tuition_status: {
      up_to_date: { total: tuitionOkCount, dropouts: tuitionOkDropout, dropout_rate: `${tuitionOkDropoutRate}%` },
      in_arrears: { total: tuitionDebtCount, dropouts: tuitionDebtDropout, dropout_rate: `${tuitionDebtDropoutRate}%` }
    },
    scholarship_status: {
      holder: { total: scholYesCount, dropouts: scholYesDropout, dropout_rate: `${scholYesDropoutRate}%` },
      non_holder: { total: scholNoCount, dropouts: scholNoDropout, dropout_rate: `${scholNoDropoutRate}%` }
    },
    sem1_approved_units: unitsSummary
  }
};

fs.writeFileSync(path.join(__dirname, "eda_results.json"), JSON.stringify(edaResults, null, 2));
console.log("\nEDA results exported to eda_results.json");
