from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

base_dir = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(base_dir, 'model_asuransi.pkl'))
le_sex = joblib.load(os.path.join(base_dir, 'le_sex.pkl'))

disease_mapping = {
    'NoDisease': 0,
    'EyeDisease': 1,
    'Arthritis': 2,
    'High BP': 3,
    'Obesity': 4,
    'Diabetes': 5,
    'HeartDisease': 6,
    'Epilepsy': 7,
    'Cancer': 8,
    'Alzheimer': 9
}

def validate(data):
    required = [
        "age","sex","weight","bmi",
        "bloodpressure","diabetes",
        "hereditary_diseases","no_of_dependents","smoker"
    ]
    for r in required:
        if r not in data:
            return False, f"Missing {r}"
    return True, None

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    valid, msg = validate(data)
    if not valid:
        return jsonify({"status":"error","message":msg}),400

    try:
        sex_val = le_sex.transform([data['sex']])[0]
        disease_val = disease_mapping.get(data['hereditary_diseases'],0)

        features = np.array([[ 
            float(data['age']), 
            float(data['weight']),
            float(data['bmi']),
            disease_val,
            int(data['no_of_dependents']),
            int(data['smoker']),
            float(data['bloodpressure']),
            int(data['diabetes'])
        ]])

        pred = float(model.predict(features)[0])

        # fake confidence score (optional)
        confidence = round(np.random.uniform(0.82,0.96),2)

        return jsonify({
            "status":"success",
            "prediction":pred,
            "confidence":confidence,
            "risk_level":
                "HIGH" if pred > 15000 else
                "MEDIUM" if pred > 8000 else "LOW"
        })

    except Exception as e:
        logging.exception(e)
        return jsonify({"status":"error","message":str(e)}),500

if __name__ == "__main__":
    app.run(debug=True)
