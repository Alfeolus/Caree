// --- 1. TYPEWRITER EFFECT (Efek Mengetik Judul) ---
const text1 = "Ketahui";
const text2 = "";
const speed = 120; // Kecepatan ngetik (ms)

const elLine1 = document.getElementById('type-line1');
const elLine2 = document.getElementById('type-line2');

let i = 0;
let j = 0;

function typeWriter() {
    // 1. Ketik Baris Pertama
    if (i < text1.length) {
        elLine1.innerHTML += text1.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
    } 
    // 2. Jika Baris Pertama selesai, lanjut Baris Kedua
    else if (j < text2.length) {
        elLine2.innerHTML += text2.charAt(j);
        j++;
        setTimeout(typeWriter, speed);
    }
}

// Jalankan Typewriter saat halaman dimuat (delay 500ms)
window.addEventListener('load', () => {
    setTimeout(typeWriter, 500);
});


// --- 2. ANIMASI SCROLL (Muncul pelan-pelan) ---
const observerOptions = {
    threshold: 0.1 // Animasi jalan saat 10% elemen terlihat
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Stop observe setelah muncul
        }
    });
}, observerOptions);

const animatedElements = document.querySelectorAll('.scroll-animate, .fade-up, .fade-in-right');
animatedElements.forEach((el) => observer.observe(el));


// --- 3. MOBILE MENU (Hamburger) ---
const menuToggle = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

/* ================= CHATBOT LOGIC ================= */

// 1. Toggle Buka/Tutup Chat
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('hidden-chat');
    
    // Auto focus ke input pas dibuka
    if (!chatWindow.classList.contains('hidden-chat')) {
        setTimeout(() => document.getElementById('chatInput').focus(), 300);
    }
}

// 2. Handle Tombol Enter
function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

// 3. Kirim Pesan
async function sendMessage() {
    const inputField = document.getElementById('chatInput');
    const message = inputField.value.trim();
    const chatBody = document.getElementById('chatMessages');

    if (!message) return;

    // A. Tampilkan Pesan User
    appendMessage(message, 'user-msg');
    inputField.value = '';

    // B. Tampilkan Loading (Typing...)
    const loadingId = 'loading-' + Date.now();
    const loadingBubble = document.createElement('div');
    loadingBubble.id = loadingId;
    loadingBubble.className = 'typing-indicator';
    loadingBubble.style.display = 'block';
    loadingBubble.innerText = 'Dr. FutureGuard sedang mengetik...';
    chatBody.appendChild(loadingBubble);
    chatBody.scrollTop = chatBody.scrollHeight; 

    try {
        // C. Panggil API Chatbot (Endpoint yang sama dengan kalkulator)
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        // Hapus loading
        document.getElementById(loadingId).remove();

        // D. Tampilkan Balasan AI
        if (data.status === 'success') {
            appendMessage(data.reply, 'bot-msg');
        } else {
            appendMessage("Maaf, terjadi kesalahan koneksi.", 'bot-msg');
        }

    } catch (error) {
        if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        appendMessage("Gagal terhubung ke server.", 'bot-msg');
        console.error(error);
    }
}

// Helper: Tambah Bubble Chat
function appendMessage(text, className) {
    const chatBody = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    
    // Ganti baris baru jadi <br>
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight; // Auto scroll ke bawah
}

window.addEventListener("load",()=>{
    document.body.classList.add("loaded");
});
