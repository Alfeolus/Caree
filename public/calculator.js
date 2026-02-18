/* --- 1. INISIALISASI WIZARD --- */
let currentTab = 0;
showTab(currentTab);

function showTab(n) {
    let tabs = document.getElementsByClassName("form-step");
    tabs[n].classList.add("active");

    if (n == 0) {
        document.getElementById("prevBtn").style.display = "none";
    } else {
        document.getElementById("prevBtn").style.display = "inline";
    }

    if (n == (tabs.length - 1)) {
        document.getElementById("nextBtn").innerHTML = "Hitung Estimasi Klaim 🏥";
    } else {
        document.getElementById("nextBtn").innerHTML = "Lanjut <i class='fa-solid fa-arrow-right'></i>";
    }
    updateUI(n);
}

function nextPrev(n) {
    let tabs = document.getElementsByClassName("form-step");
    if (n == 1 && !validateForm()) return false;
    
    tabs[currentTab].classList.remove("active");
    currentTab = currentTab + n;
    
    if (currentTab >= tabs.length) {
        submitForm();
        return false;
    }
    showTab(currentTab);
}

/* --- 2. VALIDASI INPUT --- */
function validateForm() {
    let valid = true;
    let tabs = document.getElementsByClassName("form-step");
    let inputs = tabs[currentTab].getElementsByTagName("input");
    
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].readOnly) continue; // Skip BMI
        
        if (inputs[i].type === "radio") {
            let name = inputs[i].name;
            let radios = document.getElementsByName(name);
            let oneChecked = false;
            for(let r of radios) if(r.checked) oneChecked = true;
            if(!oneChecked) valid = false;
        } else if (inputs[i].value === "") {
            inputs[i].style.borderColor = "#ef4444";
            valid = false;
        } else {
            inputs[i].style.borderColor = "#e2e8f0";
        }
    }
    return valid;
}

/* --- 3. UPDATE TAMPILAN WIZARD --- */
function updateUI(n) {
    const titles = [
        { t: "Profil Kamu", d: " Isi Data diri dasar." },
        { t: "Kondisi Fisik", d: "Berat dan tinggi badan." },
        { t: "Riwayat Medis", d: "Pilih kondisi penyakit." },
        { t: "Faktor Risiko", d: "Gaya hidup." }
    ];
    document.getElementById("stepTitle").innerText = titles[n].t;
    document.getElementById("stepDesc").innerText = titles[n].d;
    let percent = ((n + 1) / 4) * 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

/* --- 4. KIRIM DATA KE PYTHON --- */
async function submitForm() {
    const btn = document.getElementById("nextBtn");
    btn.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i> AI Menganalisa...";
    btn.disabled = true;

    try {
        const formData = {
            age: parseInt(document.getElementById('age').value),
            sex: document.querySelector('input[name="sex"]:checked').value,
            weight: parseFloat(document.getElementById('weight').value),
            bmi: parseFloat(document.getElementById('bmi').value),
            bloodpressure: parseFloat(document.getElementById('bloodpressure').value),
            diabetes: parseInt(document.getElementById('diabetes').value),
            hereditary_diseases: document.getElementById('hereditary_diseases').value, // Dari Dropdown HTML
            no_of_dependents: parseInt(document.getElementById('dependents').value),
            smoker: parseInt(document.querySelector('input[name="smoker"]:checked').value)
        };

        console.log("📤 Mengirim Data:", formData);

        // Fetch ke backend Flask
        const response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log("📩 Terima Data:", data);

        if (data.status === "success") {
            showResult(data);
        } else {
            alert("Error dari Server: " + data.message);
            location.reload();
        }

    } catch (e) {
        console.error(e);
        alert("Gagal koneksi ke Python! Pastikan 'python app.py' sudah jalan.");
        location.reload();
    }

    btn.disabled = false;
}

/* --- 5. TAMPILKAN HASIL + EFEK KETIK GEMINI --- */
function showResult(data) {
    document.getElementById('resultOverlay').classList.remove('hidden');

    // Format Harga USD
    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    });

    document.getElementById('priceTag').innerText = formatter.format(data.result);
    
    if(document.getElementById('riskText')) 
        document.getElementById('riskText').innerText = data.risk_level;
    
    if(document.getElementById('confidenceText')) 
        document.getElementById('confidenceText').innerText = (data.confidence * 100).toFixed(0) + "%";

    // Efek Mengetik Penjelasan AI
    if(document.getElementById('aiExplanationText')) {
        const textElement = document.getElementById('aiExplanationText');
        textElement.innerHTML = ""; // Bersihkan teks lama
        
        // Buat Kursor Kedip
        const cursor = document.createElement('span');
        cursor.className = 'cursor-blink';
        textElement.appendChild(cursor);

        // Teks dari Gemini (atau teks default jika kosong)
        const fullText = data.explanation || "Analisa selesai. Jaga kesehatan Anda selalu!";
        let i = 0;

        function typeWriter() {
            if (i < fullText.length) {
                // Masukkan huruf tepat sebelum kursor
                cursor.before(fullText.charAt(i));
                i++;
                setTimeout(typeWriter, 15); // Kecepatan Ngetik (15ms = ngebut tapi rapi)
            }
        }
        
        // Mulai ngetik setelah jeda sedikit biar dramatis
        setTimeout(typeWriter, 400); 
    }
}

/* --- 6. EVENT LISTENER TAMBAHAN --- */
document.addEventListener("DOMContentLoaded", function() {
    // 1. Hitung BMI Otomatis
    const w = document.getElementById('weight');
    const h = document.getElementById('height');
    const b = document.getElementById('bmi');

    function calcBMI() {
        const valW = parseFloat(w.value);
        const valH = parseFloat(h.value);
        if (valW > 0 && valH > 0) {
            b.value = (valW / ((valH / 100) ** 2)).toFixed(1);
        }
    }
    w.addEventListener('input', calcBMI);
    h.addEventListener('input', calcBMI);

    // 2. Ganti Tema Warna Wanita (Pink) / Pria (Biru)
    document.querySelectorAll('input[name="sex"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'female') document.body.classList.add('theme-pink');
            else document.body.classList.remove('theme-pink');
        });
    });
});