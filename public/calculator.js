/* --- 1. INISIALISASI --- */
let currentTab = 0; // Mulai dari step 1
showTab(currentTab); // Tampilkan step awal

/* --- 2. FUNGSI UTAMA WIZARD --- */
function showTab(n) {
    let tabs = document.getElementsByClassName("form-step");
    tabs[n].classList.add("active");

    // Atur tombol Kembali
    if (n == 0) {
        document.getElementById("prevBtn").style.display = "none";
    } else {
        document.getElementById("prevBtn").style.display = "inline";
    }

    // Atur tombol Lanjut
    if (n == (tabs.length - 1)) {
        document.getElementById("nextBtn").innerHTML = "Hitung Estimasi Klaim 🏥";
    } else {
        document.getElementById("nextBtn").innerHTML = "Lanjut <i class='fa-solid fa-arrow-right'></i>";
    }

    updateUI(n);
}

function nextPrev(n) {
    let tabs = document.getElementsByClassName("form-step");

    // Jika mau lanjut (n=1), validasi dulu
    if (n == 1 && !validateForm()) return false;

    // Sembunyikan tab lama
    tabs[currentTab].classList.remove("active");

    // Pindah index
    currentTab = currentTab + n;

    // Jika sudah selesai (Submit)
    if (currentTab >= tabs.length) {
        submitForm();
        return false;
    }

    showTab(currentTab);
}

/* --- 3. VALIDASI FORM --- */
function validateForm() {
    let valid = true;
    let tabs = document.getElementsByClassName("form-step");
    let inputs = tabs[currentTab].getElementsByTagName("input");

    for (let i = 0; i < inputs.length; i++) {
        // Abaikan validasi field readonly (seperti BMI) asalkan ada isinya nanti
        if (inputs[i].readOnly && inputs[i].value !== "") {
            continue; 
        }

        // Cek Radio Button (Gender/Smoker)
        if(inputs[i].type === "radio") {
            let name = inputs[i].name;
            let radios = document.getElementsByName(name);
            let oneChecked = false;
            for(let r of radios) if(r.checked) oneChecked = true;
            if(!oneChecked) valid = false;
        } 
        // Cek Input Kosong
        else if (inputs[i].value == "") {
            inputs[i].style.borderColor = "#ef4444"; // Merah
            valid = false;
        } else {
            inputs[i].style.borderColor = "#e5e7eb"; // Normal
        }
    }
    return valid;
}

/* --- 4. UPDATE UI (JUDUL & PROGRESS) --- */
function updateUI(n) {
    const titles = [
        { t: "Profil Peserta", d: "Data diri dasar untuk identifikasi peserta." },
        { t: "Kondisi Fisik", d: "Berat dan tinggi badan untuk kalkulasi BMI." },
        { t: "Riwayat Medis", d: "Penyakit bawaan dan kondisi kesehatan saat ini." },
        { t: "Faktor Risiko", d: "Kebiasaan merokok dan jumlah tanggungan." }
    ];

    document.getElementById("stepTitle").innerText = titles[n].t;
    document.getElementById("stepDesc").innerText = titles[n].d;

    let percent = ((n + 1) / 4) * 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

/* --- 5. LOGIKA SUBMIT DATA --- */
async function submitForm() {
    const btn = document.getElementById("nextBtn");
    btn.innerHTML = "AI analyzing...";
    btn.disabled = true;

    const formData = {
        age: parseInt(age.value),
        sex: document.querySelector('input[name="sex"]:checked').value,
        weight: parseFloat(weight.value),
        bmi: parseFloat(bmi.value),
        bloodpressure: parseFloat(bloodpressure.value),
        diabetes: parseInt(diabetes.value),
        hereditary_diseases: hereditary_diseases.value,
        no_of_dependents: parseInt(dependents.value),
        smoker: parseInt(document.querySelector('input[name="smoker"]:checked').value)
    };

    try {
        const res = await fetch("/predict", {
            method:"POST",
            headers:{ "Content-Type":"application/json"},
            body:JSON.stringify(formData)
        });

        const data = await res.json();

        if(data.status==="success"){
            showResult(data);
        }else{
            alert(data.message);
        }

    } catch(e){
        alert("Server error");
    }

    btn.disabled=false;
}


/* --- 6. EVENT LISTENERS (BMI & TEMA) --- */
document.addEventListener("DOMContentLoaded", function() {
    
    // A. HITUNG BMI OTOMATIS
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const bmiInput = document.getElementById('bmi');

    function calculateBMI() {
        const weight = parseFloat(weightInput.value);
        const height = parseFloat(heightInput.value);

        if (weight > 0 && height > 0) {
            // Rumus: BB / (TB meter * TB meter)
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            bmiInput.value = bmi.toFixed(1);
        } else {
            bmiInput.value = "";
        }
    }
    weightInput.addEventListener('input', calculateBMI);
    heightInput.addEventListener('input', calculateBMI);

    // B. GANTI TEMA WARNA (PINK/BIRU)
    const sexInputs = document.querySelectorAll('input[name="sex"]');
    sexInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'female') {
                document.body.classList.add('theme-pink');
            } else {
                document.body.classList.remove('theme-pink');
            }
        });
    });
});

function showLoadingOverlay(){
    document.getElementById("loadingOverlay").classList.remove("hidden");
}

function hideLoadingOverlay(){
    document.getElementById("loadingOverlay").classList.add("hidden");
}

function showResult(data){
    document.getElementById('resultOverlay').classList.remove('hidden');

    const rupiah = new Intl.NumberFormat("id-ID",{
        style:"currency",
        currency:"IDR"
    });

    priceTag.innerText = rupiah.format(data.prediction);
    riskText.innerText = data.risk;
    confidenceText.innerText = Math.round(data.confidence*100) + "%";
}
