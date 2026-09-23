const fs = require('fs');
const path = require('path');

console.log("=== DAY 22: STUDENT RISK PREDICTION INFERENCE ENGINE ===");

// Trained Logistic Regression Parameters from Day 20 Phase 5
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

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function predictStudentRisk(studentData) {
  let logit = modelParams.bias;

  Object.keys(modelParams.weights).forEach(feat => {
    const rawVal = studentData[feat];
    const stat = modelParams.scalingStats[feat];
    const zScore = (rawVal - stat.mean) / stat.std;
    logit += modelParams.weights[feat] * zScore;
  });

  const probability = sigmoid(logit);
  const probPercent = parseFloat((probability * 100).toFixed(2));

  let riskCategory = "LOW RISK";
  let riskColor = "emerald";
  let recommendedAction = "Status Normal: Student demonstrates strong academic progression.";

  if (probPercent >= 60) {
    riskCategory = "CRITICAL HIGH RISK";
    riskColor = "rose";
    recommendedAction = "Mandatory academic advising within 5 days; peer tutoring assignment; financial aid consultation.";
  } else if (probPercent >= 25) {
    riskCategory = "MODERATE RISK";
    riskColor = "amber";
    recommendedAction = "Automated check-in survey; invite to weekly course study workshops.";
  }

  return {
    student_name: studentData.student_name,
    dropout_probability: `${probPercent}%`,
    probability_raw: probability,
    risk_category: riskCategory,
    risk_color: riskColor,
    predicted_class: probPercent >= 50 ? 1 : 0,
    recommended_action: recommendedAction,
    input_features: studentData
  };
}

// 4 Multiple Test Cases for Day 22 Submission
const testCases = [
  {
    student_name: "Test Case 1: High Academic Risk Profile",
    curricular_units_1st_sem_approved: 1,
    curricular_units_1st_sem_grade: 9.5,
    curricular_units_2nd_sem_approved: 0,
    curricular_units_2nd_sem_grade: 0.0,
    tuition_fees_up_to_date: 0,
    debtor: 1,
    age_at_enrollment: 26,
    scholarship_holder: 0
  },
  {
    student_name: "Test Case 2: Boundary / Moderate Risk Profile",
    curricular_units_1st_sem_approved: 3,
    curricular_units_1st_sem_grade: 10.8,
    curricular_units_2nd_sem_approved: 3,
    curricular_units_2nd_sem_grade: 11.2,
    tuition_fees_up_to_date: 1,
    debtor: 0,
    age_at_enrollment: 22,
    scholarship_holder: 0
  },
  {
    student_name: "Test Case 3: Low Risk / Honors Profile",
    curricular_units_1st_sem_approved: 6,
    curricular_units_1st_sem_grade: 14.5,
    curricular_units_2nd_sem_approved: 6,
    curricular_units_2nd_sem_grade: 15.2,
    tuition_fees_up_to_date: 1,
    debtor: 0,
    age_at_enrollment: 19,
    scholarship_holder: 1
  },
  {
    student_name: "Test Case 4: Financial Hardship Profile",
    curricular_units_1st_sem_approved: 5,
    curricular_units_1st_sem_grade: 12.0,
    curricular_units_2nd_sem_approved: 4,
    curricular_units_2nd_sem_grade: 11.8,
    tuition_fees_up_to_date: 0,
    debtor: 1,
    age_at_enrollment: 20,
    scholarship_holder: 0
  }
];

console.log("\nRunning Student Risk Prediction Engine on 4 Test Cases...\n");
const inferenceResults = testCases.map(tc => {
  const res = predictStudentRisk(tc);
  console.log(`[${res.student_name}]`);
  console.log(`  P(Dropout)    : ${res.dropout_probability}`);
  console.log(`  Risk Category : ${res.risk_category}`);
  console.log(`  Action        : ${res.recommended_action}\n`);
  return res;
});

fs.writeFileSync(path.join(__dirname, "inference_results.json"), JSON.stringify(inferenceResults, null, 2));
console.log("Inference results exported to inference_results.json");
