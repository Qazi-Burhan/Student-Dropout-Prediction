const fs = require('fs');
const path = require('path');

console.log("=== DAY 20: LOGISTIC REGRESSION MODEL TRAINING & PROBABILITY PREDICTION ===");

const cleanCsvPath = path.join(__dirname, "cleaned_student_dropout.csv");
if (!fs.existsSync(cleanCsvPath)) {
  console.error("Error: cleaned_student_dropout.csv not found.");
  process.exit(1);
}

const csvData = fs.readFileSync(cleanCsvPath, "utf-8");
const lines = csvData.trim().split("\n");
const header = lines[0].split(",");
const rows = lines.slice(1).map(l => l.split(","));

console.log(`Loaded Preprocessed Dataset: ${rows.length} rows.`);

// Target index: target_binary (1 = Dropout, 0 = Non-Dropout)
const targetIdx = header.indexOf("target_binary");

// Feature selection for Logistic Regression
const selectedFeatures = [
  "curricular_units_2nd_sem_approved",
  "curricular_units_1st_sem_approved",
  "tuition_fees_up_to_date",
  "debtor",
  "curricular_units_1st_sem_grade",
  "curricular_units_2nd_sem_grade",
  "age_at_enrollment",
  "scholarship_holder"
];

const featureIndices = selectedFeatures.map(f => header.indexOf(f));

// 1. Train / Test Split (80% Train, 20% Test Stratified)
// Deterministic pseudo-random shuffle (seed = 42)
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const dropoutRows = [];
const nonDropoutRows = [];

rows.forEach(r => {
  if (parseInt(r[targetIdx]) === 1) dropoutRows.push(r);
  else nonDropoutRows.push(r);
});

let seed = 42;
dropoutRows.sort(() => seededRandom(seed++) - 0.5);
nonDropoutRows.sort(() => seededRandom(seed++) - 0.5);

const trainDropoutCount = Math.floor(dropoutRows.length * 0.8);
const trainNonDropoutCount = Math.floor(nonDropoutRows.length * 0.8);

const trainRows = [...dropoutRows.slice(0, trainDropoutCount), ...nonDropoutRows.slice(0, trainNonDropoutCount)];
const testRows = [...dropoutRows.slice(trainDropoutCount), ...nonDropoutRows.slice(trainNonDropoutCount)];

console.log(`\n1. Train / Test Split Breakdown (80 / 20 Stratified):`);
console.log(`- Training Set: ${trainRows.length} records (${trainDropoutCount} Dropouts, ${trainNonDropoutCount} Retained)`);
console.log(`- Testing Set: ${testRows.length} records (${dropoutRows.length - trainDropoutCount} Dropouts, ${nonDropoutRows.length - trainNonDropoutCount} Retained)`);

// 2. Train Logistic Regression Model via Gradient Descent
// Logistic Model: z = beta_0 + sum(beta_j * x_j), P(Y=1|X) = 1 / (1 + exp(-z))
const X_train = trainRows.map(r => featureIndices.map(i => parseFloat(r[i])));
const y_train = trainRows.map(r => parseFloat(r[targetIdx]));

const X_test = testRows.map(r => featureIndices.map(i => parseFloat(r[i])));
const y_test = testRows.map(r => parseFloat(r[targetIdx]));

// Compute Feature Means & Stds on Train set for Standard Scaling
const trainStats = selectedFeatures.map((f, idx) => {
  const vals = X_train.map(row => row[idx]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length) || 1;
  return { mean, std };
});

const X_train_scaled = X_train.map(row => row.map((val, idx) => (val - trainStats[idx].mean) / trainStats[idx].std));
const X_test_scaled = X_test.map(row => row.map((val, idx) => (val - trainStats[idx].mean) / trainStats[idx].std));

// Train Logistic Weights using SGD
let weights = new Array(selectedFeatures.length).fill(0);
let bias = 0;
const lr = 0.05;
const epochs = 400;

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

for (let epoch = 0; epoch < epochs; epoch++) {
  let loss = 0;
  for (let i = 0; i < X_train_scaled.length; i++) {
    const x = X_train_scaled[i];
    const y = y_train[i];
    let z = bias;
    for (let j = 0; j < x.length; j++) z += weights[j] * x[j];
    const p = sigmoid(z);
    
    const err = p - y;
    bias -= lr * err / X_train_scaled.length;
    for (let j = 0; j < x.length; j++) {
      weights[j] -= lr * (err * x[j]) / X_train_scaled.length;
    }
  }
}

console.log("\n2. Logistic Regression Model Successfully Trained!");
console.log(`- Learned Intercept (Bias): ${bias.toFixed(4)}`);
console.log("- Learned Feature Coefficients (Weights):");
selectedFeatures.forEach((f, idx) => {
  console.log(`  • ${f.padEnd(38)} : beta = ${weights[idx] >= 0 ? '+' : ''}${weights[idx].toFixed(4)}`);
});

// 3. Evaluate Predictions & Probabilities on Test Set
const samplePredictions = [];
let correctCount = 0;
let tp = 0, fp = 0, tn = 0, fn = 0;

for (let i = 0; i < X_test_scaled.length; i++) {
  const x = X_test_scaled[i];
  const yActual = y_test[i];
  
  let z = bias;
  for (let j = 0; j < x.length; j++) z += weights[j] * x[j];
  const prob = sigmoid(z);
  const yPred = prob >= 0.5 ? 1 : 0;

  if (yPred === yActual) correctCount++;
  if (yPred === 1 && yActual === 1) tp++;
  if (yPred === 1 && yActual === 0) fp++;
  if (yPred === 0 && yActual === 0) tn++;
  if (yPred === 0 && yActual === 1) fn++;

  if (i < 10) {
    samplePredictions.push({
      test_instance_id: i + 1,
      actual_class: yActual === 1 ? "Dropout (1)" : "Retained (0)",
      predicted_class: yPred === 1 ? "Dropout (1)" : "Retained (0)",
      dropout_probability: parseFloat((prob * 100).toFixed(2)),
      confidence_score: parseFloat((Math.max(prob, 1 - prob) * 100).toFixed(2)),
      match: yPred === yActual
    });
  }
}

const accuracy = ((correctCount / X_test_scaled.length) * 100).toFixed(2);
const precision = ((tp / (tp + fp)) * 100).toFixed(2);
const recall = ((tp / (tp + fn)) * 100).toFixed(2);
const f1 = ((2 * precision * recall / (parseFloat(precision) + parseFloat(recall)))).toFixed(2);

console.log(`\n3. Test Set Model Performance Evaluation:`);
console.log(`- Test Accuracy: ${accuracy}%`);
console.log(`- Precision: ${precision}%`);
console.log(`- Recall (Sensitivity): ${recall}%`);
console.log(`- F1-Score: ${f1}%`);

// 4. Export Training Summary JSON
const modelResults = {
  split: {
    train_total: trainRows.length,
    test_total: testRows.length,
    ratio: "80 / 20 Stratified"
  },
  model_params: {
    algorithm: "Logistic Regression Classifier",
    solver: "Stochastic Gradient Descent (SGD)",
    bias: parseFloat(bias.toFixed(4)),
    weights: selectedFeatures.map((f, idx) => ({ feature: f, weight: parseFloat(weights[idx].toFixed(4)) }))
  },
  metrics: {
    accuracy: `${accuracy}%`,
    precision: `${precision}%`,
    recall: `${recall}%`,
    f1_score: `${f1}%`,
    confusion_matrix: { tp, fp, tn, fn }
  },
  sample_predictions: samplePredictions
};

fs.writeFileSync(path.join(__dirname, "model_results.json"), JSON.stringify(modelResults, null, 2));
console.log("\nModel results exported to model_results.json");
