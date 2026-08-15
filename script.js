const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const siteHeader = document.querySelector('.site-header');
const scrollProgress = document.querySelector('.scroll-progress span');
const heroScene = document.querySelector('.hero-scene');
const audio = document.querySelector('#background-audio');
const soundToggle = document.querySelector('.sound-toggle');
const soundLabel = document.querySelector('.sound-label');
let audioAttempted = false;

menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.textContent = isOpen ? 'CLOSE' : 'MENU';
});

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = 'MENU';
  });
});

function updateScrollEffects() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  scrollProgress.style.width = `${progress}%`;
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 24);
  heroScene.style.setProperty('--scene-shift', `${Math.min(window.scrollY * 0.16, 70)}px`);
}

window.addEventListener('scroll', updateScrollEffects, { passive: true });
updateScrollEffects();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const cursorLight = document.querySelector('.cursor-light');
window.addEventListener('pointermove', (event) => {
  cursorLight.style.left = `${event.clientX}px`;
  cursorLight.style.top = `${event.clientY}px`;
});

// Use a short synthesized UI cue so the interaction remains responsive without another audio asset.
function playUiClick() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(460, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(270, context.currentTime + 0.075);
  gain.gain.setValueAtTime(0.05, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.085);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.09);
  oscillator.addEventListener('ended', () => context.close());
}

function setSoundState(isPlaying) {
  soundToggle.classList.toggle('is-playing', isPlaying);
  soundToggle.setAttribute('aria-pressed', String(isPlaying));
  soundToggle.setAttribute('aria-label', isPlaying ? 'Turn off background music' : 'Turn on background music');
  soundLabel.textContent = isPlaying ? 'SOUND ON' : 'SOUND OFF';
}

async function startBackgroundAudio() {
  if (!audioAttempted) {
    const source = audio.dataset.source;
    if (source) audio.src = source;
    audioAttempted = true;
  }

  try {
    await audio.play();
    setSoundState(true);
  } catch {
    // The control stays available if the visitor has not added the optional track.
    setSoundState(false);
  }
}

function toggleBackgroundAudio() {
  if (!audio.paused) {
    audio.pause();
    setSoundState(false);
    return;
  }

  startBackgroundAudio();
}

soundToggle.addEventListener('click', toggleBackgroundAudio);
audio.addEventListener('play', () => setSoundState(true));
audio.addEventListener('pause', () => setSoundState(false));

function startAmbienceOnFirstGesture(event) {
  const isSoundControl = event.target instanceof Element && event.target.closest('.sound-toggle');
  if (!isSoundControl) startBackgroundAudio();
  document.removeEventListener('pointerdown', startAmbienceOnFirstGesture);
  document.removeEventListener('keydown', startAmbienceOnFirstGesture);
}

document.addEventListener('pointerdown', startAmbienceOnFirstGesture, { passive: true });
document.addEventListener('keydown', startAmbienceOnFirstGesture);

document.querySelectorAll('a, button').forEach((control) => {
  control.addEventListener('click', (event) => {
    if (event.currentTarget !== soundToggle) playUiClick();
  });
});

document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-7px)`;
  });

  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
  });
});
