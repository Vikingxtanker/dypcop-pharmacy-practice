import HealthScreeningNavbar from "@/components/layout/HealthScreeningNavbar";
import Footer from "@/components/layout/Footer";

const guidelines = [
  {
    test: "Haemoglobin (Hb)",
    icon: "🩸",
    description: "Haemoglobin estimation helps screen for anaemia and polycythemia. It is one of the most commonly performed screening tests.",
    steps: [
      "Ensure the patient is relaxed and seated comfortably.",
      "Clean the fingertip (usually ring or middle finger) with an alcohol swab.",
      "Allow the finger to air dry completely before pricking.",
      "Make a quick, deep puncture using a sterile lancet.",
      "Wipe away the first drop of blood with dry gauze (it may contain tissue fluid).",
      "Collect the second drop of blood using a capillary tube or direct pipette.",
      "Transfer the blood to the Sahli's haemometer tube or digital haemoglobinometer cuvette.",
      "Read and record the haemoglobin value in g/dL.",
    ],
    normalValues: "Male: 13.5 – 17.5 g/dL | Female: 12.0 – 16.0 g/dL",
    precautions: [
      "Use a new sterile lancet for every patient.",
      "Do not squeeze the finger excessively – this dilutes the sample with tissue fluid.",
      "Calibrate Sahli's haemometer with distilled water before use.",
      "Record any anticoagulant medication the patient may be taking.",
    ],
  },
  {
    test: "Red Blood Cell Count (RBC)",
    icon: "🔴",
    description: "RBC count determines the total number of red blood cells per microlitre of blood. Useful for diagnosing anaemia and polycythaemia.",
    steps: [
      "Collect a capillary blood sample as described in the Hb procedure.",
      "Draw blood into an RBC diluting pipette up to the 0.5 mark.",
      "Draw Gower's solution (or Hayem's solution) up to the 101 mark.",
      "Mix thoroughly by gently inverting the pipette.",
      "Charge the Neubauer counting chamber with the diluted blood.",
      "Allow cells to settle for 2–3 minutes under a cover slip.",
      "Count the RBCs in the 4 corner squares (each 1 mm²) of the chamber under low power.",
      "Calculate the count using the formula: RBC/µL = (N × Dilution Factor / Volume counted) × 10,000.",
    ],
    normalValues: "Male: 4.5 – 5.5 million/µL | Female: 3.8 – 4.8 million/µL",
    precautions: [
      "Ensure the Neubauer chamber is clean and properly covered.",
      "Avoid air bubbles when filling the counting chamber.",
      "Count cells that touch the top and left border lines; exclude bottom and right.",
      "Perform duplicate counts and average the results for accuracy.",
    ],
  },
  {
    test: "White Blood Cell Count (WBC)",
    icon: "⚪",
    description: "WBC count measures the total number of leucocytes to detect infection, inflammation, leukaemia, and immune disorders.",
    steps: [
      "Collect a capillary blood sample.",
      "Draw blood into a WBC diluting pipette up to the 0.5 mark.",
      "Draw 1% acetic acid (diluting fluid) up to the 101 mark.",
      "Mix gently by inverting the pipette several times.",
      "Charge the Neubauer counting chamber.",
      "Wait 2–3 minutes for the cells to settle.",
      "Count the WBCs in all 4 corner squares (1 mm² each) under low power.",
      "Calculate: WBC/µL = (N × Dilution Factor / Volume counted) × 10,000.",
    ],
    normalValues: "4,000 – 11,000 cells/µL",
    precautions: [
      "Acetic acid lyses RBCs, making WBCs easier to count – ensure proper dilution.",
      "Do not delay counting after dilution – cells may degenerate.",
      "Use fresh diluting fluid each time.",
      "Note if patient is on corticosteroids – this may affect WBC count.",
    ],
  },
  {
    test: "Blood Pressure (BP)",
    icon: "❤️",
    description: "Blood pressure measurement screens for hypertension and hypotension, which are key cardiovascular risk factors.",
    steps: [
      "Seat the patient in a relaxed position with the arm supported at heart level.",
      "Select the appropriate cuff size (bladder should encircle 80% of the arm).",
      "Wrap the cuff snugly around the upper arm, 2–3 cm above the antecubital fossa.",
      "Palpate the radial pulse and inflate the cuff 20–30 mmHg above the point where the pulse disappears.",
      "Place the stethoscope bell over the brachial artery.",
      "Deflate the cuff slowly at 2–3 mmHg per second.",
      "Note the systolic pressure (first Korotkoff sound) and diastolic pressure (fifth Korotkoff sound).",
      "Record the reading as systolic/diastolic mmHg (e.g., 120/80 mmHg).",
    ],
    normalValues: "Systolic: < 120 mmHg | Diastolic: < 80 mmHg",
    precautions: [
      "Patient should avoid caffeine, smoking, and exercise 30 minutes before measurement.",
      "Take at least 2 readings, 1 minute apart, and average them.",
      "The patient should not talk during the measurement.",
      "Measure in both arms at the first visit; use the arm with the higher reading for future measurements.",
    ],
  },
  {
    test: "Pulse Rate (PR)",
    icon: "💓",
    description: "Pulse rate reflects heart rate and cardiovascular status. It can indicate tachycardia, bradycardia, or arrhythmias.",
    steps: [
      "Ask the patient to sit comfortably and relax the forearm.",
      "Place the index and middle fingers over the radial artery (lateral side of the wrist).",
      "Apply gentle pressure until the pulse is felt.",
      "Count the number of beats for 60 seconds (or 30 seconds × 2).",
      "Note the rhythm (regular or irregular) and force (strong, weak, or bounding).",
      "Record the pulse rate in beats per minute (bpm).",
    ],
    normalValues: "60 – 100 beats/min",
    precautions: [
      "Never use the thumb to palpate the pulse – it has its own pulsation.",
      "Count for a full 60 seconds if the rhythm is irregular.",
      "Compare with the heart rate if the patient has a cardiac history.",
      "Note any medications that affect heart rate (beta-blockers, etc.).",
    ],
  },
  {
    test: "Respiratory Rate (RR)",
    icon: "🫁",
    description: "Respiratory rate measures the number of breaths per minute and is a vital indicator of respiratory and metabolic function.",
    steps: [
      "Observe the patient without their awareness (to avoid voluntary alteration of breathing).",
      "Watch the rise and fall of the chest or abdomen.",
      "Count the number of breaths for 60 seconds.",
      "Note the depth (shallow, normal, or deep) and pattern (regular or irregular).",
      "Record the respiratory rate in breaths per minute.",
    ],
    normalValues: "12 – 20 breaths/min",
    precautions: [
      "Do not inform the patient you are counting their breathing – they may alter their pattern.",
      "Respiratory rate is best measured when the patient is at rest.",
      "An elevated RR may indicate infection, acidosis, or respiratory distress.",
      "A low RR may indicate respiratory depression, drug overdose, or neurological conditions.",
    ],
  },
  {
    test: "Spirometry",
    icon: "🌬️",
    description: "Spirometry assesses lung function by measuring the volume and flow of air during inhalation and exhalation.",
    steps: [
      "Explain the procedure clearly to the patient.",
      "Ensure the patient is seated upright with feet flat on the floor.",
      "Ask the patient to remove any chewing gum, food, or dentures.",
      "Demonstrate the technique: take a deep breath in, then blow out as hard and fast as possible into the spirometer.",
      "Instruct the patient to continue exhaling for at least 6 seconds.",
      "Record FEV1 (Forced Expiratory Volume in 1 second) and FVC (Forced Vital Capacity).",
      "Perform at least 3 acceptable manoeuvres and take the best result.",
      "Calculate FEV1/FVC ratio to assess obstruction vs. restriction.",
    ],
    normalValues: "FEV1: ≥ 80% of predicted | FVC: ≥ 80% of predicted | FEV1/FVC: ≥ 0.70",
    precautions: [
      "Patient should avoid smoking and heavy meals 1 hour before testing.",
      "Remove spectacles and ensure no air leaks around the mouthpiece.",
      "If the patient has asthma, perform spirometry before bronchodilator use.",
      "Record height, weight, age, and gender for predicted value calculation.",
      "Calibrate the spirometer daily before use.",
    ],
  },
  {
    test: "Height",
    icon: "📏",
    description: "Height measurement is essential for BMI calculation and growth assessment, especially in pediatric and geriatric populations.",
    steps: [
      "Ask the patient to remove shoes, hair accessories, and any head covering.",
      "Ask the patient to stand straight with heels together and flat against the stadiometer base.",
      "Ensure the patient's back is straight, shoulders relaxed, and arms hanging naturally.",
      "Ask the patient to look straight ahead (Frankfurt plane parallel to the floor).",
      "Lower the headpiece of the stadiometer until it rests firmly on the top of the head.",
      "Record the height in centimeters (cm) to the nearest 0.1 cm.",
    ],
    normalValues: "Varies by age and gender",
    precautions: [
      "Measure at the same time of day – height is slightly taller in the morning.",
      "Ensure the stadiometer is placed against a flat wall on a level surface.",
      "For wheelchair users, use a seated height measurement protocol.",
      "Record any spinal deformities or conditions that may affect measurement.",
    ],
  },
  {
    test: "Weight",
    icon: "⚖️",
    description: "Body weight measurement is critical for nutritional assessment, drug dosing calculations, and BMI determination.",
    steps: [
      "Calibrate the weighing scale before use.",
      "Ask the patient to remove shoes, heavy clothing, and any accessories.",
      "Ask the patient to stand in the centre of the scale with feet flat and arms at the sides.",
      "Ensure the patient is standing still and looking straight ahead.",
      "Wait for the scale reading to stabilize.",
      "Record the weight in kilograms (kg) to the nearest 0.1 kg.",
    ],
    normalValues: "Varies by height, age, and gender",
    precautions: [
      "Weigh the patient at the same time of day for consistency.",
      "Use the same scale for all measurements in a camp setting.",
      "For bedridden patients, use a bed scale or calculate weight by difference.",
      "Note any conditions causing fluid retention (oedema, ascites).",
    ],
  },
  {
    test: "Body Mass Index (BMI)",
    icon: "📊",
    description: "BMI is a screening tool that categorizes weight status based on the ratio of weight to height squared.",
    steps: [
      "Measure height in meters (m) and weight in kilograms (kg).",
      "Calculate BMI using the formula: BMI = weight (kg) / [height (m)]².",
      "Classify the result according to WHO categories.",
      "Record the BMI value and category in the patient record.",
      "Provide appropriate dietary and lifestyle counselling based on the category.",
    ],
    normalValues: "Normal: 18.5 – 24.9 kg/m² | Overweight: 25.0 – 29.9 kg/m² | Obese: ≥ 30.0 kg/m²",
    precautions: [
      "BMI may not be accurate for athletes, pregnant women, or the elderly.",
      "Use BMI as a screening tool – it does not measure body fat directly.",
      "Consider waist circumference and body composition for a complete assessment.",
      "For children and adolescents, use age- and gender-specific BMI percentiles.",
    ],
  },
  {
    test: "Waist-Hip Ratio (W-H Ratio)",
    icon: "📐",
    description: "Waist-hip ratio assesses central obesity and predicts cardiovascular disease risk.",
    steps: [
      "Ask the patient to stand upright, relaxed, with feet together.",
      "Measure waist circumference at the midpoint between the lowest rib and the iliac crest.",
      "Measure hip circumference at the widest point of the buttocks.",
      "Record both measurements in centimeters.",
      "Calculate W-H Ratio = Waist circumference / Hip circumference.",
      "Classify the risk based on gender-specific cut-off values.",
    ],
    normalValues: "Male: < 0.90 (low risk) | Female: < 0.85 (low risk)",
    precautions: [
      "Use a flexible, non-stretchable measuring tape.",
      "Measure at the end of normal expiration.",
      "Ensure the tape is horizontal and snug but not compressing the skin.",
      "Record the reading to the nearest 0.1 cm.",
    ],
  },
  {
    test: "Random Blood Sugar (RBS)",
    icon: "🩺",
    description: "Random blood sugar testing screens for diabetes mellitus and pre-diabetes. It measures glucose at any time of day.",
    steps: [
      "Clean the fingertip with an alcohol swab and allow it to air dry.",
      "Prick the fingertip with a sterile lancet.",
      "Wipe away the first drop of blood.",
      "Apply the second drop to the glucometer test strip.",
      "Hold the glucometer steady until the result appears on the display.",
      "Record the blood glucose value in mg/dL.",
      "Dispose of the lancet in a sharps container immediately.",
    ],
    normalValues: "70 – 140 mg/dL (Normal) | 140 – 200 mg/dL (Pre-diabetes) | > 200 mg/dL (Diabetes – confirm with FBS/PPBS)",
    precautions: [
      "Note the time of the last meal – RBS interpretation depends on meal timing.",
      "Use only compatible test strips for the glucometer model.",
      "Store test strips in a cool, dry place – heat and moisture affect accuracy.",
      "Confirm high readings with fasting blood sugar (FBS) and HbA1c.",
      "Check control solution periodically to verify glucometer accuracy.",
    ],
  },
  {
    test: "Blood Groups (ABO & Rh)",
    icon: "🅰️",
    description: "Blood grouping determines ABO and Rh factor, essential for transfusion compatibility, prenatal care, and medical records.",
    steps: [
      "Clean the fingertip with an alcohol swab and prick with a sterile lancet.",
      "Place one drop of blood on each of three clean, labelled slides or tiles.",
      "Add one drop of Anti-A serum to the first blood drop.",
      "Add one drop of Anti-B serum to the second blood drop.",
      "Add one drop of Anti-D (Rh) serum to the third blood drop.",
      "Mix each serum-blood combination gently with a separate clean stick.",
      "Rock the slides gently for 1–2 minutes.",
      "Observe for agglutination (clumping) in each slide.",
      "Interpret: Agglutination with Anti-A = A group; Anti-B = B group; both = AB; neither = O. Anti-D agglutination = Rh positive.",
    ],
    normalValues: "A+, A−, B+, B−, AB+, AB−, O+, O−",
    precautions: [
      "Use fresh anti-sera stored at 2–8°C.",
      "Do not mix up the anti-sera bottles – label clearly.",
      "Read results under adequate light against a white background.",
      "For inconclusive results, repeat with a new sample.",
      "Record the result carefully – incorrect blood grouping can be life-threatening.",
    ],
  },
];

export default function HealthScreeningGuidelinesPage() {
  return (
    <>
      <HealthScreeningNavbar />

      <section className="py-5 mt-5">
        <div className="container">
          <h1 className="text-center mb-4">Standard Guidelines of the Tests</h1>
          <p className="text-center text-muted mb-5">
            Detailed step-by-step guidelines for conducting each health screening test accurately and safely.
          </p>

          {guidelines.map((guide, idx) => (
            <div className="mb-5" key={idx}>
              <div className="bg-white p-4 rounded shadow-sm">
                <h2 className="mb-3">
                  {guide.icon} {guide.test}
                </h2>
                <p className="text-muted mb-4">{guide.description}</p>

                <h5 className="fw-bold mb-3">Procedure / Steps:</h5>
                <ol className="mb-4">
                  {guide.steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="mb-2">
                      {step}
                    </li>
                  ))}
                </ol>

                <div className="alert alert-success mb-4">
                  <strong>Normal Values:</strong> {guide.normalValues}
                </div>

                <h5 className="fw-bold mb-3">Precautions:</h5>
                <ul className="mb-0">
                  {guide.precautions.map((precaution, precIdx) => (
                    <li key={precIdx} className="mb-2">
                      {precaution}
                    </li>
                  ))}
                </ul>
              </div>
              {idx < guidelines.length - 1 && <hr className="my-4" />}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
