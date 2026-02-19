// --- 1. ADVANCED TYPEWRITER EFFECT (EFEK MENGETIK KEREN) ---
const greetings = ["Halo", "Ciao", "Hola", "Bonjour", "Konnichiwa", "Annyeong"];
const headlineText = "Cek Limit Klaim Kamu";

const elGreeting = document.getElementById('type-greeting');
const elHeadline = document.getElementById('type-headline');

let greetIdx = 0;   // Indeks kata sapaan (Halo, Ciao, dll)
let charIdx = 0;    // Indeks huruf sapaan
let isDeleting = false;

let headIdx = 0;    // Indeks huruf headline utama

// A. Fungsi Ketik Sapaan (Looping: Ketik -> Hapus -> Ganti)
function typeGreeting() {
    const currentWord = greetings[greetIdx];
    
    if (isDeleting) {
        // Sedang Menghapus
        elGreeting.innerHTML = currentWord.substring(0, charIdx - 1);
        charIdx--;
    } else {
        // Sedang Mengetik
        elGreeting.innerHTML = currentWord.substring(0, charIdx + 1);
        charIdx++;
    }

    let typeSpeed = 150;

    if (!isDeleting && charIdx === currentWord.length) {
        // Selesai ngetik satu kata, tahan 2 detik
        isDeleting = true;
        typeSpeed = 2000; 
    } else if (isDeleting && charIdx === 0) {
        // Selesai menghapus, ganti kata berikutnya
        isDeleting = false;
        greetIdx = (greetIdx + 1) % greetings.length; // Loop array
        typeSpeed = 500;
    } else if (isDeleting) {
        // Kalau menghapus, lebih cepat
        typeSpeed = 100;
    }

    setTimeout(typeGreeting, typeSpeed);
}

// B. Fungsi Ketik Judul Utama (Sekali Jalan, Permanen)
function typeHeadline() {
    if (headIdx < headlineText.length) {
        elHeadline.innerHTML += headlineText.charAt(headIdx);
        headIdx++;
        setTimeout(typeHeadline, 100);
    }
}

// Jalankan saat halaman dimuat
window.addEventListener('load', () => {
    // Mulai sapaan
    setTimeout(typeGreeting, 500);
    // Mulai judul utama (delay dikit biar estetik)
    setTimeout(typeHeadline, 1000);
    
    // Tambah class loaded ke body (opsional buat animasi CSS)
    document.body.classList.add("loaded");
});


// --- 2. ANIMASI SCROLL & NAVBAR ---
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-animate, .fade-up, .fade-in-right').forEach(el => observer.observe(el));



// --- 4. MOBILE MENU ---
const menuToggle = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.style.display = (navLinks.style.display === 'flex') ? 'none' : 'flex';
    });
}


// --- 5. CHATBOT LOGIC ---
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('hidden-chat');
    if (!chatWindow.classList.contains('hidden-chat')) {
        setTimeout(() => document.getElementById('chatInput').focus(), 300);
    }
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    appendMsg(msg, 'user-msg');
    input.value = '';

    const loadingId = 'load-' + Date.now();
    appendMsg('<i>Sedang mengetik...</i>', 'bot-msg', loadingId);

    try {
        const API_URL = "https://yourgodzilaserver.tail9f1423.ts.net/predict";
        // Pastikan URL Absolut ke Port Python (5000)
        const res = await fetch(API_URL, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg }) 
        });
        
        // Note: Karena endpoint /predict di app.py kamu saat ini hanya menerima data asuransi (age, bmi, dll),
        // Chatbot ini mungkin akan error 500 jika app.py belum punya logika 'chat'.
        // Tapi kodingan di sini sudah benar secara struktur Frontend.
        
        const data = await res.json();
        document.getElementById(loadingId).remove();
        
        if (data.status === 'success' || data.reply) {
            appendMsg(data.reply || "Halo, silakan gunakan menu Kalkulator untuk cek klaim.", 'bot-msg');
        } else {
            appendMsg("Maaf, saya belum mengerti.", 'bot-msg');
        }
    } catch (err) {
        if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        appendMsg("Halo! Silakan ke menu Kalkulator untuk mulai.", 'bot-msg');
    }
}

function appendMsg(text, cls, id = null) {
    const div = document.createElement('div');
    div.className = `message ${cls}`;
    if (id) div.id = id;
    div.innerHTML = text;
    const body = document.getElementById('chatMessages');
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}