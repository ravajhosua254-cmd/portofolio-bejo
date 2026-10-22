
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

// ==========================================
// 1. PENGATURAN DASAR THREE.JS
// ==========================================

const canvas = document.querySelector('#threeCanvas');
const wrap = document.querySelector('#threeWrap');

let renderer;
let animationId;
let scene;
let camera;
let objectGroup;
let clock;
let isRunning = false;

const reduceMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (canvas && wrap) {
  initThree();
}

function initThree() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'low-power'
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  clock = new THREE.Clock();

  objectGroup = new THREE.Group();
  scene.add(objectGroup);

  // ==========================================
  // 2. OBJEK UTAMA 3D
  // ==========================================

  const geometry = new THREE.IcosahedronGeometry(1.25, 1);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xc9fa70,
    metalness: 0.45,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    flatShading: true
  });

  const mainObject = new THREE.Mesh(geometry, material);
  objectGroup.add(mainObject);

  // Garis wireframe transparan di sekeliling objek.
  const wireframe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.48, 1),
    new THREE.MeshBasicMaterial({
      color: 0xe0ffad,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    })
  );

  objectGroup.add(wireframe);

  // ==========================================
  // 3. CINCIN ORBIT 3D
  // ==========================================

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.8, 0.014, 8, 120),
    new THREE.MeshStandardMaterial({
      color: 0xf1f0dc,
      metalness: 0.85,
      roughness: 0.25
    })
  );

  ring.rotation.set(1.1, 0.2, -0.4);
  objectGroup.add(ring);

  const orangeRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.009, 6, 120),
    new THREE.MeshBasicMaterial({
      color: 0xff805e,
      transparent: true,
      opacity: 0.8
    })
  );

  orangeRing.rotation.set(0.4, 1.1, 0.2);
  objectGroup.add(orangeRing);

  // Bola kecil yang mengorbit objek utama.
  const satellite = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xff805e,
      metalness: 0.3,
      roughness: 0.2,
      emissive: 0x40150a
    })
  );

  scene.add(satellite);

  // ==========================================
  // 4. PENCAHAYAAN REALISTIS
  // ==========================================

  scene.add(
    new THREE.HemisphereLight(0xdce8d1, 0x151723, 2)
  );

  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const warmLight = new THREE.PointLight(0xff805e, 30, 12);
  warmLight.position.set(-3, -1, 2);
  scene.add(warmLight);

  const greenLight = new THREE.PointLight(0xc9fa70, 22, 10);
  greenLight.position.set(2, 2, -2);
  scene.add(greenLight);

  // ==========================================
  // 5. PARTIKEL KECIL
  // ==========================================

  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }

  const particleGeometry = new THREE.BufferGeometry();

  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );

  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xdaf3b3,
      size: 0.022,
      transparent: true,
      opacity: 0.7
    })
  );

  scene.add(particles);

  // ==========================================
  // 6. RESPONSIF
  // ==========================================

  function resizeScene() {
    const width = Math.max(wrap.clientWidth, 1);
    const height = Math.max(wrap.clientHeight, 1);

    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.position.z = width < 500 ? 8.2 : 7.5;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resizeScene);
  resizeObserver.observe(wrap);
  resizeScene();

  // ==========================================
  // 7. INTERAKSI KURSOR
  // ==========================================

  let targetX = 0;
  let targetY = 0;
  let smoothX = 0;
  let smoothY = 0;

  wrap.addEventListener('pointermove', (event) => {
    const rect = wrap.getBoundingClientRect();

    targetX = (
      (event.clientX - rect.left) / rect.width - 0.5
    ) * 1.2;

    targetY = (
      (event.clientY - rect.top) / rect.height - 0.5
    ) * 0.8;
  }, { passive: true });

  wrap.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  });

  // ==========================================
  // 8. ANIMASI UTAMA
  // ==========================================

  function animate() {
    if (!isRunning) return;

    animationId = requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    smoothX += (targetX - smoothX) * 0.035;
    smoothY += (targetY - smoothY) * 0.035;

    if (!reduceMotion) {
      objectGroup.rotation.y = time * 0.18 + smoothX * 0.3;
      objectGroup.rotation.x =
        Math.sin(time * 0.35) * 0.1 + smoothY * 0.2;

      objectGroup.position.y = Math.sin(time * 0.7) * 0.09;

      ring.rotation.z = -time * 0.1;
      orangeRing.rotation.x =
        0.4 + Math.sin(time * 0.3) * 0.12;

      particles.rotation.y = time * 0.012;

      satellite.position.set(
        Math.cos(time * 0.7) * 2.0,
        Math.sin(time * 0.7) * 0.65,
        Math.sin(time * 0.7) * 1.0
      );
    }

    renderer.render(scene, camera);
  }

  // Render hanya ketika bagian 3D terlihat dan tab aktif.
  function startAnimation() {
    if (isRunning || document.hidden) return;
    isRunning = true;
    clock.start();
    animate();
  }

  function stopAnimation() {
    isRunning = false;
    cancelAnimationFrame(animationId);
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, { threshold: 0.05 });

  visibilityObserver.observe(wrap);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  startAnimation();
}

// ==========================================
// 9. LOADING SCREEN
// ==========================================

window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('#loader')?.classList.add('loaded');
  }, 500);
});

// Fallback jika halaman selesai dimuat tanpa event load.
setTimeout(() => {
  document.querySelector('#loader')?.classList.add('loaded');
}, 4000);


 // ==========================================
 // 10. ANIMASI SAAT SCROLL — SATU SISTEM SAJA
 // ==========================================

const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -35px 0px'
  });

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add('visible');
  });
}


// ==========================================
// 11. EFEK KURSOR DI DESKTOP
// ==========================================

const cursorGlow = document.querySelector('#cursorGlow');

if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
  let mouseX = -500;
  let mouseY = -500;
  let glowX = mouseX;
  let glowY = mouseY;
  let cursorFrame;

  function moveGlow() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;

    cursorGlow.style.left = `${glowX}px`;
    cursorGlow.style.top = `${glowY}px`;

    cursorFrame = requestAnimationFrame(moveGlow);
  }

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }, { passive: true });

  moveGlow();
}


// ==========================================
// 12. MENU UNTUK HP
// ==========================================

const menuToggle = document.querySelector('#menuToggle');
const navLinks = document.querySelector('.nav-links');

menuToggle?.addEventListener('click', () => {
  if (!navLinks) return;

  const opened = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(opened));
});

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});


// ==========================================
// 13. TAHUN FOOTER OTOMATIS
// ==========================================

const footer = document.querySelector('.footer');

if (footer) {
  footer.innerHTML = footer.innerHTML.replace(
    '2026',
    String(new Date().getFullYear())
  );
}


// ==========================================
// 14. AUTO TYPING TEXT
// ==========================================

const typingElement = document.querySelector('#typingText');

if (typingElement) {
  const words = [
    'Creative Developer',
    '3D Enthusiast',
    'Web Designer',
    'Creative Coder'
  ];

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function typeEffect() {
    const currentWord = words[wordIndex];

    charIndex += deleting ? -1 : 1;
    typingElement.textContent = currentWord.substring(0, charIndex);

    let delay = deleting ? 45 : 90;

    if (!deleting && charIndex === currentWord.length) {
      deleting = true;
      delay = 1300;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 350;
    }

    setTimeout(typeEffect, delay);
  }

  typeEffect();

  // ==========================================
// AOS ANIMATION
// ==========================================

if (window.AOS) {
  AOS.init({
    duration: 900,
    easing: 'ease-out-cubic',
    once: false,
    mirror: true,
    offset: 80,
    anchorPlacement: 'top-bottom'
  })
}
}
