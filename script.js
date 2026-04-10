// ============================================
// Don't Grow Up, It's a ___
// Interactive Campaign Site
// ============================================

const wordInput = document.getElementById('word-input');
const submitBtn = document.getElementById('submit-btn');
const heroSection = document.querySelector('.hero');
const revealSection = document.getElementById('reveal');
const revealWord = document.getElementById('reveal-word');
const shareBtn = document.getElementById('share-btn');
const anotherBtn = document.getElementById('another-btn');
const previewBtn = document.getElementById('preview-btn');
const previewPlayer = document.getElementById('preview-player');
const tickerTrack = document.querySelector('.ticker-track');
const countEl = document.getElementById('count');

// ============================================
// Input: auto-scale width as user types
// ============================================

function resizeInput() {
  // Use a hidden measurer to get exact text width
  const measurer = document.createElement('span');
  measurer.style.cssText = `
    font-family: 'Coming Soon', cursive;
    font-size: ${getComputedStyle(wordInput).fontSize};
    font-weight: 700;
    visibility: hidden;
    position: absolute;
    white-space: pre;
  `;
  measurer.textContent = wordInput.value || '';
  document.body.appendChild(measurer);
  const textWidth = measurer.getBoundingClientRect().width;
  document.body.removeChild(measurer);

  // Start at ~1 character wide, grow as they type
  const minWidth = 20;
  const maxWidth = window.innerWidth < 600 ? window.innerWidth - 60 : 500;
  wordInput.style.width = Math.min(Math.max(textWidth + 12, minWidth), maxWidth) + 'px';
}

wordInput.addEventListener('input', () => {
  const hasValue = wordInput.value.trim().length > 0;
  submitBtn.disabled = !hasValue;
  submitBtn.classList.toggle('visible', hasValue);
  resizeInput();
});

// Initialize input width
resizeInput();

// ============================================
// Submission: two-step flow
// Step 1: type word → show name/city fields
// Step 2: submit with name/city → POST to API
// ============================================

const detailFields = document.getElementById('detail-fields');
const nameInput = document.getElementById('name-input');
const phoneInput = document.getElementById('phone-input');
const revealCity = document.getElementById('reveal-city');
let step = 1;

function handleSubmit() {
  if (step === 1) {
    const word = wordInput.value.trim();
    if (!word) return;

    // Show detail fields (name, city, phone)
    detailFields.classList.remove('hidden');
    submitBtn.textContent = 'submit';
    step = 2;
    nameInput.focus();
    return;
  }

  // Step 2: validate and submit
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = '#e07070';
    setTimeout(() => { nameInput.style.borderColor = ''; }, 2000);
    return;
  }
  if (!phone || phone.length < 7) {
    phoneInput.focus();
    phoneInput.style.borderColor = '#e07070';
    setTimeout(() => { phoneInput.style.borderColor = ''; }, 2000);
    return;
  }

  submitToAPI();
}

async function submitToAPI() {
  const word = wordInput.value.trim().toLowerCase();
  const name = nameInput.value.trim().toLowerCase();
  const phone = phoneInput.value.trim();
  if (!word || !name || !phone) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'submitting...';

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, name, phone })
    });

    const data = await res.json();

    if (!res.ok) {
      submitBtn.textContent = data.error || 'try again';
      setTimeout(() => {
        submitBtn.textContent = 'submit';
        submitBtn.disabled = false;
      }, 2000);
      return;
      throw new Error(data.error);
    }

    if (data.count !== undefined) {
      countEl.textContent = data.count.toLocaleString();
    }

    showReveal(word, name, data.city || 'los angeles');
    loadFeed();

  } catch (err) {
    showReveal(word, name, 'los angeles');
  }
}

function showReveal(word, name, city) {
  revealWord.textContent = word;
  revealCity.textContent = name + ', ' + city;
  heroSection.style.display = 'none';
  revealSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

submitBtn.addEventListener('click', handleSubmit);

wordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && wordInput.value.trim()) {
    handleSubmit();
  }
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') phoneInput.focus();
});

phoneInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSubmit();
});

// Submit another word
anotherBtn.addEventListener('click', () => {
  revealSection.classList.add('hidden');
  heroSection.style.display = 'flex';
  wordInput.value = '';
  nameInput.value = '';
  phoneInput.value = '';
  detailFields.classList.add('hidden');
  submitBtn.classList.remove('visible');
  submitBtn.disabled = true;
  submitBtn.textContent = 'put it on a billboard';
  step = 1;
  resizeInput();
  wordInput.focus();
});

// Share button — generates a billboard image
shareBtn.addEventListener('click', async () => {
  const word = revealWord.textContent;
  const attribution = revealCity.textContent;

  shareBtn.textContent = 'generating...';
  shareBtn.disabled = true;

  try {
    const blob = await generateBillboardImage(word, attribution);
    const file = new File([blob], 'my-billboard.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Don't Grow Up, It's a " + word,
        text: "I put my word on a billboard in LA. What's yours? dontgrowup.la"
      });
    } else {
      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-billboard.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('Share failed:', err);
  }

  shareBtn.textContent = 'share your billboard';
  shareBtn.disabled = false;
});

function generateBillboardImage(word, attribution) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Instagram story size (1080x1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // Background
    ctx.fillStyle = '#A8C4D4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.textAlign = 'center';

    // "don't grow up,"
    ctx.font = 'bold 72px "Coming Soon", cursive';
    ctx.fillStyle = '#F5F5C2';
    ctx.fillText("don't grow up,", canvas.width / 2, 720);

    // "it's a [word]."
    ctx.fillText("it's a " + word + ".", canvas.width / 2, 820);

    // Underline under the word
    const wordWidth = ctx.measureText(word).width;
    const itsAWidth = ctx.measureText("it's a ").width;
    const lineStartX = (canvas.width / 2) - ctx.measureText("it's a " + word + ".").width / 2 + itsAWidth;
    ctx.strokeStyle = '#F5F5C2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lineStartX, 835);
    ctx.lineTo(lineStartX + wordWidth, 835);
    ctx.stroke();

    // Attribution
    ctx.font = '36px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(42, 58, 74, 0.6)';
    ctx.fillText('— ' + attribution, canvas.width / 2, 920);

    // URL at bottom
    ctx.font = '32px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(42, 58, 74, 0.4)';
    ctx.fillText('dontgrowup.la', canvas.width / 2, 1750);

    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

// ============================================
// Audio Preview
// ============================================

const audio = document.createElement('audio');
audio.preload = 'none';
let previewPlaying = false;
let progressInterval = null;
const progressBar = document.getElementById('preview-progress-bar');

previewBtn.addEventListener('click', () => {
  if (!previewPlaying) {
    previewPlaying = true;
    previewPlayer.classList.remove('hidden');
    previewBtn.querySelector('.preview-icon').textContent = '\u23F8';
    previewBtn.querySelector('.preview-label').textContent = 'playing...';

    // Set source fresh each time and load
    audio.src = 'preview.mp3';
    audio.load();

    audio.oncanplay = function () {
      audio.oncanplay = null;
      audio.play().catch(() => stopPreview());

      clearInterval(progressInterval);
      progressInterval = setInterval(() => {
        if (audio.duration > 0) {
          progressBar.style.width = (audio.currentTime / audio.duration) * 100 + '%';
        }
      }, 100);
    };

    audio.onended = function () {
      stopPreview();
    };

    audio.onerror = function () {
      console.error('Audio load error');
      stopPreview();
    };
  } else {
    stopPreview();
  }
});

function stopPreview() {
  previewPlaying = false;
  audio.pause();
  audio.removeAttribute('src');
  clearInterval(progressInterval);
  progressBar.style.width = '0%';
  previewPlayer.classList.add('hidden');
  previewBtn.querySelector('.preview-icon').textContent = '\u25B6';
  previewBtn.querySelector('.preview-label').textContent = 'play again';
}

// ============================================
// Live feed: load real submissions
// ============================================

async function loadFeed() {
  try {
    const res = await fetch('/api/feed');
    const data = await res.json();

    // Update counter
    countEl.textContent = (data.count || 0).toLocaleString();

    // Update ticker with real submissions
    if (data.submissions && data.submissions.length > 0) {
      const items = data.submissions.map(s => {
        const attribution = [s.name, s.city].filter(Boolean).join(', ');
        return `<span class="ticker-item">"don't grow up, it's a <em>${escapeHtml(s.word)}</em>" — ${escapeHtml(attribution)}</span>`;
      });
      // Duplicate for seamless loop
      tickerTrack.innerHTML = items.join('') + items.join('');
    } else {
      // No submissions yet — show empty state
      tickerTrack.innerHTML = '<span class="ticker-item">be the first to fill in the blank</span>';
    }
  } catch (err) {
    // API unavailable — show empty state
    tickerTrack.innerHTML = '<span class="ticker-item">be the first to fill in the blank</span>';
    countEl.textContent = '0';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Load feed on page load
loadFeed();

// Auto-focus on desktop
if (window.innerWidth > 768) {
  wordInput.focus();
}

// ============================================
// Twinkling Stars
// ============================================

function createStars() {
  const container = document.getElementById('stars');
  const starCount = window.innerWidth < 600 ? 14 : 24;

  const starSVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M34.1,84.15c-1,.77-2,1.52-3,2.26-0.79.59-1.59,1.17-2.4,1.74-1.11.79-2.22,1.6-3.37,2.33A16.28,16.28,0,0,1,22.47,92a3.65,3.65,0,0,1-4.29-1.27,4.55,4.55,0,0,1-.82-2.46,4,4,0,0,1,.75-3,5.4,5.4,0,0,0,.63-1.89c0.57-1.66,1.07-3.35,1.62-5,0.38-1.15.78-2.28,1.19-3.42,0.82-2.27,1.65-4.53,2.49-6.79,0.64-1.72,1.31-3.43,2-5.14,0.18-.45.39-0.89,0.59-1.34a0.59,0.59,0,0,0-.27-0.88c-1.66-1-3.3-1.94-4.92-3s-3.38-2.13-5-3.27c-1.83-1.26-3.63-2.58-5.41-3.91-0.88-.66-1.63-1.48-2.53-2.11a7.76,7.76,0,0,1-2.07-2.31,2.68,2.68,0,0,1,.12-3.22,5.7,5.7,0,0,1,3.69-2.2c1.39-.32,2.8-0.52,4.2-0.76s2.8-.46,4.2-0.65c0.85-.11,1.72-0.12,2.58-0.2l3.94-.37c0.42,0,.84-0.08,1.27-0.09l3-.1c1.37-.06,2.74-0.11,4.11-0.19,0.86,0,1.72-.09,2.57-0.2a0.87,0.87,0,0,0,.55-0.45c0.46-1,.87-2,1.3-3s0.85-2,1.29-3.05c0.67-1.55,1.34-3.11,2-4.65,0.81-1.75,1.66-3.47,2.5-5.2,0.76-1.55,1.51-3.1,2.3-4.64,0.56-1.09,1.15-2.16,1.75-3.23,0.77-1.37,1.52-2.77,2.36-4.09A5.75,5.75,0,0,1,51.7,8.31a3.21,3.21,0,0,1,3.36-.19,6.51,6.51,0,0,1,2.51,2.28,34.72,34.72,0,0,1,2.25,3.91c0.64,1.3,1.15,2.66,1.68,4,0.65,1.64,1.27,3.29,1.89,4.94s1.31,3.46,1.94,5.2c0.45,1.23.9,2.46,1.28,3.71s0.69,2.6,1,3.9a2.79,2.79,0,0,0,.2.75,1,1,0,0,0,.56.4,2.9,2.9,0,0,0,.75-0.07l5-.28c0.83-.05,1.66-0.12,2.48-0.19l4.32-.37,1.4-.09L87,35.93q1.1-.07,2.2-0.19c0.36,0,.72-0.16,1.09-0.17a3.55,3.55,0,0,1,2.9.81,2.94,2.94,0,0,1,.76,3.15,5.89,5.89,0,0,1-1.26,2c-0.46.49-.9,1-1.39,1.47a36.86,36.86,0,0,1-4.49,3.76c-1.53,1-3,2.16-4.54,3.22S79.18,52,77.65,53.07s-2.8,1.86-4.19,2.81a0.84,0.84,0,0,0-.34,1.05c0.64,2.3,1.18,4.63,1.8,6.94,0.42,1.57.9,3.13,1.38,4.69,0.77,2.52,1.56,5,2.33,7.55,0.22,0.73.37,1.49,0.57,2.23a2.83,2.83,0,0,1-2,3.6,5.42,5.42,0,0,1-2.05-.08c-1.24-.23-2.46-0.56-3.69-0.86-1.05-.26-2.1-0.53-3.14-0.84q-2.19-.65-4.37-1.38c-2.25-.74-4.51-1.48-6.74-2.28-1.94-.7-3.86-1.47-5.78-2.23a18.47,18.47,0,0,1-2.32-1,1.14,1.14,0,0,0-1.45.18c-1.46,1.13-3,2.21-4.43,3.34-1,.8-2,1.64-3,2.46l-3,2.44-2.79,2.23Z"/>
  </svg>`;

  const exclusionZones = [
    { x1: 15, y1: 30, x2: 85, y2: 65 },
    { x1: 25, y1: 70, x2: 75, y2: 95 },
  ];

  function isInExclusion(x, y) {
    return exclusionZones.some(z => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2);
  }

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.innerHTML = starSVG;

    let x, y, attempts = 0;
    do {
      x = Math.random() * 100;
      y = Math.random() * 100;
      attempts++;
    } while (isInExclusion(x, y) && attempts < 50);

    const size = 30 + Math.random() * 40;
    const duration = 3 + Math.random() * 5;
    const delay = Math.random() * 6;
    const maxOpacity = 0.2 + Math.random() * 0.35;

    star.style.cssText = `
      left: ${x}%;
      top: ${y}%;
      --size: ${size}px;
      --duration: ${duration}s;
      --delay: ${delay}s;
      --max-opacity: ${maxOpacity};
    `;

    container.appendChild(star);
  }
}

createStars();
