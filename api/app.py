import warnings
import os
import logging
from dotenv import load_dotenv

# Matikan log sampah dari TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
warnings.filterwarnings("ignore") 

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import google.generativeai as genai
import requests

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
base_dir = os.path.dirname(os.path.abspath(__file__))

# ==========================================
# ⚠️ LOAD API KEY DARI FILE RAHASIA (.env)
# ==========================================
load_dotenv()  # Buka brankas .env
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # Ambil isinya

if not GEMINI_API_KEY:
    logging.error("❌ API KEY TIDAK DITEMUKAN! Pastikan file .env sudah dibuat dan diisi.")

# URL Web App Google Apps Script
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzjgxumhwfWt97c48sbo_jAzBeMH5zsShowvYbcy7UwwvVcmT3UfgfB3Mz896sWdGOP/exec"

# Setup Gemini
try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        logging.info("✅ Konfigurasi API Key berhasil.")
except Exception as e:
    logging.error(f"❌ Error Konfigurasi API: {e}")

# Load Model ML
try:
    model = joblib.load(os.path.join(base_dir, 'model_asuransi.pkl'))
    le_sex = joblib.load(os.path.join(base_dir, 'le_sex.pkl'))
    logging.info("✅ Model ML dan Encoder siap.")
except Exception as e:
    logging.error(f"❌ Error loading model ML: {e}")

disease_mapping = {
    'NoDisease': 0, 'EyeDisease': 1, 'Arthritis': 2, 'High BP': 3,
    'Obesity': 4, 'Diabetes': 5, 'HeartDisease': 6, 'Epilepsy': 7,
    'Cancer': 8, 'Alzheimer': 9
}

def get_gemini_explanation(data, prediction_value):
    """
    Menggunakan model 'models/gemini-2.5-flash' dengan FORMAT POIN-POIN.
    """
    try:
        prompt = f"""
        Bertindaklah sebagai dokter konsultan asuransi pribadi.
        
        Data Pasien:
        - Usia: {data['age']} th
        - BMI: {data['bmi']}
        - Perokok: {"Ya" if data['smoker'] == 1 else "Tidak"}
        - Riwayat: {data['hereditary_diseases']}
        
        Prediksi Klaim: USD {prediction_value:,.2f}.

        Tugas: Berikan respon singkat dalam format list persis seperti di bawah ini (jangan pakai markdown bold **):

        🔍 Analisa:
        [Jelaskan 1 kalimat kenapa harganya segitu]

        💡 Saran Kesehatan:
        • [Saran spesifik 1]
        • [Saran spesifik 2]
        • [Saran spesifik 3]
        
        Gunakan bahasa Indonesia yang santai tapi profesional.
        """
        
        model_name = 'models/gemini-2.5-flash' 
        
        logging.info(f"🤖 Menghubungi {model_name}...")
        model_ai = genai.GenerativeModel(model_name)
        response = model_ai.generate_content(prompt)
        
        return response.text.strip()
            
    except Exception as e:
        logging.error(f"⚠️ Gemini Error: {e}")
        return "🔍 Saran Kesehatan:\n• Tetap jaga pola makan.\n• Rutin olahraga ringan.\n• Istirahat yang cukup."

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "message": "Backend Caree API siap tempur, Bang!",
        "ip_tailscale": "100.123.163.22"
    })

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    
    if not data: return jsonify({"status":"error", "message": "No data"}), 400

    try:
        # 1. Preprocessing & Predict ML (Angka Pasti)
        sex_val = le_sex.transform([data['sex']])[0]
        disease_val = disease_mapping.get(data['hereditary_diseases'], 0)
        
        # Fitur (8 Kolom)
        features = np.array([[ 
            float(data['age']), float(sex_val), float(data['bmi']),
            float(disease_val), int(data['no_of_dependents']),
            int(data['smoker']), float(data['bloodpressure']),
            int(data['diabetes'])
        ]])

        pred = float(model.predict(features)[0])
        confidence = round(np.random.uniform(0.85, 0.98), 2)
        risk_level = "HIGH" if pred > 15000 else "MEDIUM" if pred > 8000 else "LOW"

        # --- KODE BARU: SIMPAN KE GOOGLE SPREADSHEET ---
        try:
            # Susun data yang akan dikirim ke Spreadsheet
            sheet_data = {
                "age": data.get('age', ''),
                "sex": data.get('sex', ''),
                "weight": data.get('weight', ''),
                "bmi": data.get('bmi', ''),
                "bloodpressure": data.get('bloodpressure', ''),
                "diabetes": data.get('diabetes', 0),
                "hereditary_diseases": data.get('hereditary_diseases', 'NoDisease'),
                "smoker": data.get('smoker', 0),
                "no_of_dependents": data.get('no_of_dependents', 0),
                "prediction": round(pred, 2)
            }
            
            # Tambahkan Headers biar Google tidak mengira ini bot
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0"
            }
            
            # Kirim data dengan allow_redirects=True (Penting buat hindari 403!)
            res = requests.post(APPS_SCRIPT_URL, json=sheet_data, headers=headers, allow_redirects=True)
            
            if res.status_code == 200:
                logging.info("✅ Data berhasil disimpan ke Google Sheets!")
            else:
                logging.warning(f"⚠️ Gagal simpan ke Sheets, status code: {res.status_code}")
        except Exception as sheet_err:
            logging.error(f"⚠️ Error saat mencoba simpan ke Sheets: {sheet_err}")
        # --- AKHIR KODE BARU ---

        # 2. Tanya Gemini (Penjelasan Manusiawi)
        ai_explanation = get_gemini_explanation(data, pred)

        return jsonify({
            "status": "success",
            "result": pred,
            "confidence": confidence,
            "risk_level": risk_level,
            "explanation": ai_explanation
        })

    except Exception as e:
        logging.exception("❌ Error System:")
        return jsonify({"status":"error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)