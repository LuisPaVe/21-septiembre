/**
 * ============================================================================
 * FLORES AMARILLAS - GRANDES MARIPOSAS MONARCAS DE COLORES EN VUELO PERPETUO
 * Filotaxis de Fibonacci, vuelo 3D continuo por toda la pantalla y estela de escarcha
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- CONFIGURACIÓN Y ESTADO GLOBAL ---
  const state = {
    audioPlaying: false,
    audioCtx: null,
    audioInterval: null,
    petals: [],
    fireflies: [],
    glitterTrail: [], // Estela de escarcha brillante
    butterflies: [],
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2
  };

  const bgMusic = new Audio('Cristian Castro- Azul (Remasterizado).mp3');
  bgMusic.loop = true;

  const flowerIds = [1, 2, 3, 4, 5];

  // --- REFERENCIAS DEL DOM ---
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');

  const butterfliesLayer = document.getElementById('butterflies-layer');
  const btnAudio = document.getElementById('btn-audio');
  const audioWave = document.getElementById('audio-wave');
  const audioLabel = document.getElementById('audio-label');
  const btnPetalRain = document.getElementById('btn-petal-rain');
  const btnReflower = document.getElementById('btn-reflower');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // --- 0. FUNCION GLOBAL PARA ABRIR REGALO ---
  window.openGift = function() {
    const introScreen = document.getElementById('intro-screen');
    const mainContent = document.getElementById('main-content');
    if(introScreen) introScreen.classList.add('hidden');
    if(mainContent) mainContent.classList.add('visible');
    
    // Iniciar audio SÍNCRONAMENTE fuera de setTimeout (Requerido por iOS/Android para evitar cuelgues)
    if (!state.audioPlaying) toggleAudio();

    // Iniciar lluvia tras revelarse
    setTimeout(() => {
      triggerPetalRain(15);
    }, 350);
  };

  // --- 1. FILOTAXIS DE FIBONACCI: MICRO-SEMILLAS EN CANVAS ---
  function renderFibonacciCenters() {
    const GOLDEN_ANGLE = 137.507764 * (Math.PI / 180);
    const floretCount = 220;

    flowerIds.forEach(id => {
      const fCanvas = document.getElementById(`fibonacci-${id}`);
      if (!fCanvas) return;

      const fCtx = fCanvas.getContext('2d');
      const size = 140;
      // Mejorar nitidez en pantallas de celular (Retina)
      const dpr = window.devicePixelRatio || 1;
      fCanvas.width = size * dpr;
      fCanvas.height = size * dpr;
      fCtx.scale(dpr, dpr);

      const centerX = size / 2;
      const centerY = size / 2;
      const maxRadius = (size / 2) - 4;
      const c = maxRadius / Math.sqrt(floretCount);

      const bgGrad = fCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      bgGrad.addColorStop(0, '#241107');
      bgGrad.addColorStop(0.55, '#180a03');
      bgGrad.addColorStop(1, '#090401');
      fCtx.fillStyle = bgGrad;
      fCtx.beginPath();
      fCtx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      fCtx.fill();

      for (let i = 0; i < floretCount; i++) {
        const r = c * Math.sqrt(i);
        const theta = i * GOLDEN_ANGLE;

        const x = centerX + r * Math.cos(theta);
        const y = centerY + r * Math.sin(theta);

        // Aumentar ligeramente el tamaño del punto para que el centro se vea más tupido
        const dotRadius = 1.3 + (r / maxRadius) * 2.0;
        const normalizedDist = r / maxRadius;

        fCtx.save();
        fCtx.beginPath();
        fCtx.arc(x, y, dotRadius, 0, Math.PI * 2);

        if (normalizedDist < 0.35) {
          fCtx.fillStyle = '#3a1b0a';
          fCtx.shadowColor = '#180a03';
          fCtx.shadowBlur = 1;
        } else if (normalizedDist < 0.72) {
          const t = (normalizedDist - 0.35) / 0.37;
          fCtx.fillStyle = t > 0.5 ? '#b45309' : '#78350f';
          fCtx.shadowColor = '#451a03';
          fCtx.shadowBlur = 2;
        } else {
          fCtx.fillStyle = (i % 2 === 0) ? '#fde047' : '#facc15';
          fCtx.shadowColor = 'rgba(250, 204, 21, 0.7)';
          fCtx.shadowBlur = 3;
        }

        fCtx.fill();
        fCtx.restore();
      }
    });
  }

  // --- 2. GENERACIÓN DE PÉTALOS BOTÁNICOS (3 NIVELES + JITTER) ---
  function buildRealisticPetals() {
    const isMobile = window.innerWidth < 640;
    const tierConfig = isMobile ? [
      { name: 'outer', count: 14, baseLength: 74, baseWidth: 25, baseY: -26, tiltX: 14, offsetAngle: 0 },
      { name: 'middle', count: 12, baseLength: 66, baseWidth: 23, baseY: -22, tiltX: 6, offsetAngle: 10 },
      { name: 'inner', count: 10, baseLength: 54, baseWidth: 20, baseY: -18, tiltX: -8, offsetAngle: 18 }
    ] : [
      { name: 'outer', count: 22, baseLength: 82, baseWidth: 27, baseY: -32, tiltX: 14, offsetAngle: 0 },
      { name: 'middle', count: 18, baseLength: 74, baseWidth: 25, baseY: -26, tiltX: 6, offsetAngle: 10 },
      { name: 'inner', count: 15, baseLength: 60, baseWidth: 22, baseY: -20, tiltX: -8, offsetAngle: 18 }
    ];

    flowerIds.forEach(id => {
      // Sépalos verdes
      const sepalsContainer = document.getElementById(`flower-${id}-sepals`);
      if (sepalsContainer) {
        sepalsContainer.innerHTML = '';
        const sepalCount = 12;
        for (let s = 0; s < sepalCount; s++) {
          const sAngle = (360 / sepalCount) * s + (Math.random() * 4 - 2);
          const sepal = document.createElement('div');
          sepal.className = 'sepal';
          // En móviles, achicar los sépalos verdes para que no sobresalgan por encima de los pétalos amarillos
          const isMobileScale = window.innerWidth < 640 ? 0.65 : 1;
          const translateY = window.innerWidth < 640 ? '-18px' : '-26px';
          const scaleJitter = (0.9 + Math.random() * 0.2) * isMobileScale;
          sepal.style.transform = `rotate(${sAngle}deg) translateY(${translateY}) scale(${scaleJitter})`;
          sepalsContainer.appendChild(sepal);
        }
      }

      // Capas de pétalos
      tierConfig.forEach(tier => {
        const container = document.getElementById(`flower-${id}-${tier.name}`);
        if (!container) return;
        container.innerHTML = '';

        for (let i = 0; i < tier.count; i++) {
          const angleJitter = (Math.random() - 0.5) * 3.0;
          const angle = (360 / tier.count) * i + tier.offsetAngle + angleJitter;

          const lengthJitter = (Math.random() - 0.5) * 6;
          const length = tier.baseLength + lengthJitter;

          const tiltY = (Math.random() - 0.5) * 6;
          const tiltX = tier.tiltX + (Math.random() - 0.5) * 4;

          const petal = document.createElement('div');
          petal.className = 'botanical-petal';
          petal.style.height = `${length}px`;
          petal.style.transform = `rotate(${angle}deg) translateY(${tier.baseY}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
          
          container.appendChild(petal);
        }
      });
    });
  }

  // --- 3. REACCIÓN FÍSICA AL CURSOR ---
  function setupInteractiveSway() {
    if (window.innerWidth < 640) return; // Evitar cuelgues procesando eventos táctiles en móviles

    const flowerElements = document.querySelectorAll('.flower-item');

    window.addEventListener('pointermove', (e) => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;

      const winCenterX = window.innerWidth / 2;
      const winCenterY = window.innerHeight / 2;

      const normX = (e.clientX - winCenterX) / winCenterX;
      const normY = (e.clientY - winCenterY) / winCenterY;

      flowerElements.forEach((flower, index) => {
        const factor = (index + 1) * 1.2;
        const rotX = -normY * (2.5 * factor);
        const rotY = normX * (3.5 * factor);
        flower.style.setProperty('--user-rot-x', `${rotX}deg`);
        flower.style.setProperty('--user-rot-y', `${rotY}deg`);
      });
    });
  }

  // --- 4. MOTOR DE PARTICULAS (CANVAS 60FPS: ESCARCHA BRILLANTE, POLEN Y PÉTALOS) ---
  function resizeCanvas() {
    const isMobile = window.innerWidth < 640;
    // Reducir carga gráfica (devicePixelRatio) en móviles a 1 en vez de 3x o 4x
    const dpr = isMobile ? 1 : (window.devicePixelRatio || 1);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    // Actualizar variable CSS de escala de forma segura para Safari iOS
    if (isMobile) {
      const scaleValue = Math.min(1, window.innerWidth / 620);
      document.documentElement.style.setProperty('--mobile-scale', scaleValue);
    }
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // CLASE ESCARCHA BRILLANTE (ESTRELLAS DE 4 PUNTAS CON DESTELLOS DE DIAMANTE)
  class GlitterSparkle {
    constructor(x, y, vx = 0, vy = 0, colorType = 'gold') {
      this.x = x + (Math.random() * 14 - 7);
      this.y = y + (Math.random() * 14 - 7);
      this.vx = vx * 0.25 + (Math.random() * 1.6 - 0.8);
      this.vy = vy * 0.25 + (Math.random() * 1.0 + 0.4);
      this.size = Math.random() * 4.2 + 2.8; // 2.8px a 7.0px (Mayor visibilidad)
      this.maxLife = Math.floor(Math.random() * 50 + 65); // ~1.5 - 2 seg
      this.life = this.maxLife;
      this.twinkleSpeed = Math.random() * 0.35 + 0.2;
      this.twinklePhase = Math.random() * Math.PI * 2;
      
      // Colores vivos de escarcha por mariposa
      if (colorType === 'orange') {
        this.color = Math.random() > 0.35 ? '#fb923c' : '#ffffff';
        this.glow = 'rgba(249, 115, 22, 0.95)';
      } else if (colorType === 'blue') {
        this.color = Math.random() > 0.35 ? '#38bdf8' : '#ffffff';
        this.glow = 'rgba(14, 165, 233, 0.95)';
      } else if (colorType === 'purple') {
        this.color = Math.random() > 0.35 ? '#f472b6' : '#ffffff';
        this.glow = 'rgba(217, 70, 239, 0.95)';
      } else if (colorType === 'emerald') {
        this.color = Math.random() > 0.35 ? '#6ee7b7' : '#ffffff';
        this.glow = 'rgba(16, 185, 129, 0.95)';
      } else {
        // Gold / Ámbar solar
        this.color = Math.random() > 0.3 ? '#fef08a' : '#ffffff';
        this.glow = 'rgba(250, 204, 21, 0.95)';
      }
    }

    update() {
      this.life--;
      this.x += this.vx + Math.sin(this.life * 0.08) * 0.45;
      this.y += this.vy;
      this.vy += 0.015;
      this.twinklePhase += this.twinkleSpeed;
    }

    draw() {
      if (this.life <= 0) return;
      const normalizedLife = this.life / this.maxLife;
      const twinkle = Math.sin(this.twinklePhase) * 0.45 + 0.55;
      const alpha = Math.max(0, normalizedLife * twinkle);

      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.fillStyle = this.color;
      // Removido shadowColor y shadowBlur para optimizar rendimiento radicalmente
      ctx.globalAlpha = alpha;

      // Estrella de 4 puntas de escarcha
      const s = this.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();

      // Centro de diamante blanco puro
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  }

  // Luciérnagas
  class Firefly {
    constructor() {
      this.reset();
      this.y = Math.random() * window.innerHeight;
    }

    reset() {
      this.x = Math.random() * window.innerWidth;
      this.y = window.innerHeight + 10;
      this.radius = Math.random() * 2.2 + 0.8;
      this.speedY = -(Math.random() * 0.45 + 0.15);
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.alpha = Math.random() * 0.75 + 0.2;
      this.alphaChange = (Math.random() * 0.015 + 0.006) * (Math.random() > 0.5 ? 1 : -1);
      this.pulseSpeed = Math.random() * 0.025 + 0.01;
      this.angle = Math.random() * Math.PI * 2;
    }

    update() {
      this.y += this.speedY;
      this.angle += this.pulseSpeed;
      this.x += Math.sin(this.angle) * 0.7 + this.speedX;

      this.alpha += this.alphaChange;
      if (this.alpha > 0.92 || this.alpha < 0.18) {
        this.alphaChange = -this.alphaChange;
      }

      if (this.y < -20 || this.x < -20 || this.x > window.innerWidth + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253, 224, 71, ${this.alpha})`;
      // Removido shadowColor y shadowBlur
      ctx.fill();
      ctx.restore();
    }
  }

  // Pétalos botánicos en caída
  class PetalParticle {
    constructor(startX, startY, isBurst = false) {
      this.x = startX !== undefined ? startX : Math.random() * window.innerWidth;
      this.y = startY !== undefined ? startY : -35;
      this.size = Math.random() * 11 + 11;
      this.speedY = isBurst ? (Math.random() * 3.5 - 1.2) : (Math.random() * 1.6 + 1.1);
      this.speedX = isBurst ? (Math.random() * 7 - 3.5) : (Math.random() * 2 - 1);
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 2.2;
      this.flip = Math.random() * Math.PI;
      this.flipSpeed = Math.random() * 0.035 + 0.018;
      this.alpha = 1;
      this.isBurst = isBurst;
      this.life = isBurst ? 130 : 9999;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.flip) * 1.3;
      this.rotation += this.rotationSpeed;
      this.flip += this.flipSpeed;

      if (this.isBurst) {
        this.life--;
        this.speedY += 0.065;
        this.alpha = Math.max(0, this.life / 130);
      }

      if (this.y > window.innerHeight + 40 && !this.isBurst) {
        this.y = -35;
        this.x = Math.random() * window.innerWidth;
      }
    }

    draw() {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.scale(Math.cos(this.flip), 1);

      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.6, -this.size * 0.5, this.size * 0.5, this.size * 0.5, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.5, this.size * 0.5, -this.size * 0.6, -this.size * 0.5, 0, -this.size);

      const grad = ctx.createLinearGradient(0, -this.size, 0, this.size);
      grad.addColorStop(0, `rgba(254, 240, 138, ${this.alpha * 0.95})`);
      grad.addColorStop(0.55, `rgba(250, 204, 21, ${this.alpha * 0.9})`);
      grad.addColorStop(1, `rgba(202, 138, 4, ${this.alpha * 0.85})`);

      ctx.fillStyle = grad;
      // Removido shadowColor y shadowBlur
      ctx.fill();
      ctx.restore();
    }
  }

  // --- 5. CLASE MARIPOSA MONARCA GRANDE EN VUELO PERPETUO ---
  class MonarchButterfly {
    constructor(id, initialX, initialY, colorConfig) {
      this.id = id;
      this.x = initialX;
      this.y = initialY;
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = (Math.random() - 0.5) * 4;
      this.angle = Math.random() * 360;
      this.colorConfig = colorConfig;
      this.speed = 3.6 + Math.random() * 1.0; // Vuelo ágil y constante
      this.flightTick = Math.random() * 1000;
      this.targetX = initialX;
      this.targetY = initialY;
      this.flightZone = colorConfig.zone; // Zona designada para no aglomerarse

      this.createDOMElement();
      this.pickNextWaypoint();
    }

    createDOMElement() {
      const el = document.createElement('div');
      el.className = 'butterfly';
      el.id = `monarch-${this.id}`;
      // Removido filter: drop-shadow pesado de la mariposa para liberar GPU

      const c = this.colorConfig;

      // SVG de Alas de Gran Mariposa Monarca (70x100px) con venas negras y perlas blancas
      const monarchWingSVG = (side) => {
        const isLeft = side === 'left';
        const gradId = `monarchGrad-${side}-${this.id}`;

        if (isLeft) {
          // Ala izquierda: el cuerpo está en el borde derecho (x = 68..70), el ala se abre hacia la izquierda
          return `
            <svg viewBox="0 0 70 100" width="100%" height="100%">
              <defs>
                <linearGradient id="${gradId}" x1="100%" y1="50%" x2="0%" y2="50%">
                  <stop offset="0%" stop-color="${c.base}"/>
                  <stop offset="55%" stop-color="${c.mid}"/>
                  <stop offset="100%" stop-color="${c.top}"/>
                </linearGradient>
              </defs>
              
              <!-- Ala Anterior Izquierda Monarca -->
              <path d="M 68 50 C 60 20 30 4 10 10 C -2 16 4 52 68 56 Z" 
                    fill="url(#${gradId})" stroke="#09090b" stroke-width="2.8" />
              
              <!-- Ala Posterior Izquierda Monarca -->
              <path d="M 68 52 C 45 56 16 62 20 84 C 24 96 52 88 68 64 Z" 
                    fill="url(#${gradId})" stroke="#09090b" stroke-width="2.8" />

              <!-- Venas Ala Anterior Izquierda -->
              <path d="M 68 50 Q 42 30 20 18" stroke="#09090b" stroke-width="2.4" fill="none" />
              <path d="M 68 50 Q 36 42 16 38" stroke="#09090b" stroke-width="2.2" fill="none" />
              <path d="M 68 52 Q 38 52 22 50" stroke="#09090b" stroke-width="2.0" fill="none" />
              <path d="M 42 30 Q 30 16 16 14" stroke="#09090b" stroke-width="1.8" fill="none" />

              <!-- Venas Ala Posterior Izquierda -->
              <path d="M 68 54 Q 45 68 32 84" stroke="#09090b" stroke-width="2.2" fill="none" />
              <path d="M 68 54 Q 50 76 44 88" stroke="#09090b" stroke-width="1.8" fill="none" />
              <path d="M 68 54 Q 34 64 26 74" stroke="#09090b" stroke-width="1.8" fill="none" />

              <!-- Borde exterior negro grueso característico -->
              <path d="M 10 10 C -2 16 4 52 68 56" stroke="#09090b" stroke-width="5.0" fill="none" />
              <path d="M 20 84 C 24 96 52 88 68 64" stroke="#09090b" stroke-width="5.0" fill="none" />

              <!-- Motas blancas de perlas en el borde exterior -->
              <circle cx="10" cy="18" r="2.0" fill="#ffffff" />
              <circle cx="18" cy="11" r="2.0" fill="#ffffff" />
              <circle cx="30" cy="14" r="1.9" fill="#ffffff" />
              <circle cx="42" cy="22" r="1.9" fill="#ffffff" />
              <circle cx="54" cy="36" r="1.8" fill="#ffffff" />
              <circle cx="24" cy="87" r="1.9" fill="#ffffff" />
              <circle cx="35" cy="91" r="1.9" fill="#ffffff" />
              <circle cx="46" cy="85" r="1.9" fill="#ffffff" />
              <circle cx="58" cy="74" r="1.8" fill="#ffffff" />
            </svg>
          `;
        } else {
          // Ala derecha: el cuerpo está en el borde izquierdo (x = 0..2), el ala se abre hacia la derecha
          return `
            <svg viewBox="0 0 70 100" width="100%" height="100%">
              <defs>
                <linearGradient id="${gradId}" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stop-color="${c.base}"/>
                  <stop offset="55%" stop-color="${c.mid}"/>
                  <stop offset="100%" stop-color="${c.top}"/>
                </linearGradient>
              </defs>
              
              <!-- Ala Anterior Derecha Monarca -->
              <path d="M 2 50 C 10 20 40 4 60 10 C 72 16 66 52 2 56 Z" 
                    fill="url(#${gradId})" stroke="#09090b" stroke-width="2.8" />
              
              <!-- Ala Posterior Derecha Monarca -->
              <path d="M 2 52 C 25 56 54 62 50 84 C 46 96 18 88 2 64 Z" 
                    fill="url(#${gradId})" stroke="#09090b" stroke-width="2.8" />

              <!-- Venas Ala Anterior Derecha -->
              <path d="M 2 50 Q 28 30 50 18" stroke="#09090b" stroke-width="2.4" fill="none" />
              <path d="M 2 50 Q 34 42 54 38" stroke="#09090b" stroke-width="2.2" fill="none" />
              <path d="M 2 52 Q 32 52 48 50" stroke="#09090b" stroke-width="2.0" fill="none" />
              <path d="M 28 30 Q 40 16 54 14" stroke="#09090b" stroke-width="1.8" fill="none" />

              <!-- Venas Ala Posterior Derecha -->
              <path d="M 2 54 Q 25 68 38 84" stroke="#09090b" stroke-width="2.2" fill="none" />
              <path d="M 2 54 Q 20 76 26 88" stroke="#09090b" stroke-width="1.8" fill="none" />
              <path d="M 2 54 Q 36 64 44 74" stroke="#09090b" stroke-width="1.8" fill="none" />

              <!-- Borde exterior negro grueso característico -->
              <path d="M 60 10 C 72 16 66 52 2 56" stroke="#09090b" stroke-width="5.0" fill="none" />
              <path d="M 50 84 C 46 96 18 88 2 64" stroke="#09090b" stroke-width="5.0" fill="none" />

              <!-- Motas blancas de perlas en el borde exterior -->
              <circle cx="60" cy="18" r="2.0" fill="#ffffff" />
              <circle cx="52" cy="11" r="2.0" fill="#ffffff" />
              <circle cx="40" cy="14" r="1.9" fill="#ffffff" />
              <circle cx="28" cy="22" r="1.9" fill="#ffffff" />
              <circle cx="16" cy="36" r="1.8" fill="#ffffff" />
              <circle cx="46" cy="87" r="1.9" fill="#ffffff" />
              <circle cx="35" cy="91" r="1.9" fill="#ffffff" />
              <circle cx="24" cy="85" r="1.9" fill="#ffffff" />
              <circle cx="12" cy="74" r="1.8" fill="#ffffff" />
            </svg>
          `;
        }
      };

      el.innerHTML = `
        <div class="butterfly-wing wing-left">${monarchWingSVG('left')}</div>
        <div class="butterfly-body"></div>
        <div class="butterfly-wing wing-right">${monarchWingSVG('right')}</div>
      `;

      // Clic para asustar con ráfaga multicolor de escarcha
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fleeWithBurst();
      });

      butterfliesLayer.appendChild(el);
      this.domElement = el;
    }

    fleeWithBurst() {
      for (let i = 0; i < 40; i++) {
        state.glitterTrail.push(new GlitterSparkle(this.x, this.y, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, this.colorConfig.name));
      }
      playMagicalChime();

      this.targetX = this.x + (Math.random() * 500 - 250);
      this.targetY = Math.max(40, this.y - 300);
      this.vx = (Math.random() - 0.5) * 12;
      this.vy = -8;
      showToast(`¡Mariposa ${this.colorConfig.label} esparciendo escarcha! ✨🦋`);
    }

    getFlowerPosition(flowerIndex) {
      const flowerHead = document.querySelector(`.flower-head[data-flower-id="${flowerIndex}"]`);
      if (flowerHead) {
        const rect = flowerHead.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 + (Math.random() * 80 - 40),
          y: rect.top + rect.height / 2 + (Math.random() * 60 - 30)
        };
      }
      return { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
    }

    // SIEMPRE VOLANDO: VUELOS AMPLIOS Y SWEEPING POR TODA LA PANTALLA
    pickNextWaypoint() {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const roll = Math.random();

      // Cada mariposa tiene un patrón de vuelo sweeping amplio
      if (this.flightZone === 'left') {
        if (roll < 0.4) {
          // Vuelo rasante por las flores de la izquierda
          const pos = this.getFlowerPosition(1);
          this.targetX = pos.x;
          this.targetY = pos.y;
        } else if (roll < 0.7) {
          // Ascenso al cielo superior izquierdo
          this.targetX = Math.random() * (W * 0.45) + 40;
          this.targetY = Math.random() * (H * 0.35) + 40;
        } else {
          // Vuelo cruzado amplio hacia el centro
          this.targetX = W * 0.5 + (Math.random() * 120 - 60);
          this.targetY = H * 0.4 + (Math.random() * 140 - 70);
        }
      } else if (this.flightZone === 'right') {
        if (roll < 0.4) {
          // Vuelo rasante por flores de la derecha
          const pos = this.getFlowerPosition(5);
          this.targetX = pos.x;
          this.targetY = pos.y;
        } else if (roll < 0.7) {
          // Ascenso al cielo superior derecho
          this.targetX = W * 0.55 + Math.random() * (W * 0.4);
          this.targetY = Math.random() * (H * 0.35) + 40;
        } else {
          this.targetX = W * 0.5 + (Math.random() * 120 - 60);
          this.targetY = H * 0.35 + (Math.random() * 140 - 70);
        }
      } else if (this.flightZone === 'center') {
        if (roll < 0.45) {
          // Vuelo orbital sobre la flor reina central
          const pos = this.getFlowerPosition(3);
          this.targetX = pos.x + (Math.random() * 120 - 60);
          this.targetY = pos.y + (Math.random() * 80 - 40);
        } else {
          // Gran arco en el cielo nocturno
          this.targetX = Math.random() * (W - 160) + 80;
          this.targetY = Math.random() * (H * 0.3) + 40;
        }
      } else {
        // Vuelo libre y panorámico por toda la pantalla
        this.targetX = Math.random() * (W - 140) + 70;
        this.targetY = Math.random() * (H * 0.75) + 60;
      }
    }

    // ACTUALIZACIÓN DE FÍSICA Y EMISIÓN CONSTANTE DE ESCARCHA
    update() {
      this.flightTick += 0.045;

      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Si se acerca a su destino, cambia inmediatamente: NUNCA SE DETIENE
      if (dist < 90) {
        this.pickNextWaypoint();
      }

      // Cálculo de dirección con aceleración constante
      const targetAngle = Math.atan2(dy, dx);
      const accel = 0.075;

      this.vx += (Math.cos(targetAngle) * this.speed - this.vx) * accel;
      this.vy += (Math.sin(targetAngle) * this.speed - this.vy) * accel;

      // Ondulación sinusoidal orgánica de aleteo
      this.vx += Math.sin(this.flightTick * 2.8) * 0.65;
      this.vy += Math.cos(this.flightTick * 2.2) * 0.55;

      this.x += this.vx;
      this.y += this.vy;

      // Rebote suave en los bordes de la pantalla
      const margin = 50;
      if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx) * 1.2; this.pickNextWaypoint(); }
      if (this.x > window.innerWidth - margin) { this.x = window.innerWidth - margin; this.vx = -Math.abs(this.vx) * 1.2; this.pickNextWaypoint(); }
      if (this.y < margin) { this.y = margin; this.vy = Math.abs(this.vy) * 1.2; this.pickNextWaypoint(); }
      if (this.y > window.innerHeight - margin) { this.y = window.innerHeight - margin; this.vy = -Math.abs(this.vy) * 1.2; this.pickNextWaypoint(); }

      // Ángulo de orientación hacia el vector de movimiento
      const currentAngle = Math.atan2(this.vy, this.vx) * (180 / Math.PI) + 90;
      this.angle = currentAngle;

      // Inclinación bancaria en giros
      const bankRoll = Math.max(-28, Math.min(28, this.vx * 3.5));

      // EMISIÓN DE ESCARCHA OPTIMIZADA (Menos frecuente para evitar sobrecarga)
      if (Math.random() < 0.15) { // Solo 15% de probabilidad por cuadro en lugar de siempre
        state.glitterTrail.push(
          new GlitterSparkle(this.x, this.y + 18, this.vx * 0.35, this.vy * 0.35, this.colorConfig.name)
        );
      }
      
      // Limitar escarcha activa globalmente a máximo 150
      if (state.glitterTrail.length > 150) {
        state.glitterTrail.shift();
      }

      // Aplicar transformación 3D centrada en el cuerpo
      this.domElement.style.transform = `translate3d(${this.x - 74}px, ${this.y - 50}px, 0) rotate(${this.angle}deg) rotateX(${bankRoll * 0.4}deg)`;
    }
  }

  // INICIALIZAR MARIPOSAS (Reducido o desactivado para móviles)
  function initMonarchButterflies() {
    butterfliesLayer.innerHTML = '';
    
    // Las mariposas 3D son una de las principales causas de cuelgues (memory/gpu leak) en móviles
    if (window.innerWidth < 640) {
      state.butterflies = [];
      return;
    }
    
    const monarchTypes = [
      {
        name: 'orange',
        label: 'Monarca Naranja Fuego',
        top: '#fed7aa',
        mid: '#f97316',
        base: '#9a3412',
        glow: 'rgba(249, 115, 22, 0.8)',
        zone: 'left'
      },
      {
        name: 'blue',
        label: 'Monarca Morpho Azul Eléctrico',
        top: '#bae6fd',
        mid: '#0284c7',
        base: '#0c4a6e',
        glow: 'rgba(14, 165, 233, 0.8)',
        zone: 'right'
      },
      {
        name: 'gold',
        label: 'Monarca Dorada Solar',
        top: '#fef9c3',
        mid: '#facc15',
        base: '#854d0e',
        glow: 'rgba(250, 204, 21, 0.8)',
        zone: 'center'
      }
    ];

    butterfliesLayer.innerHTML = '';
    const W = window.innerWidth;
    const H = window.innerHeight;

    state.butterflies = monarchTypes.map((config, index) => {
      const startX = (W * (index + 1)) / (monarchTypes.length + 1);
      const startY = 100 + (index % 3) * 140;
      return new MonarchButterfly(index + 1, startX, startY, config);
    });
  }

  // Luciérnagas (Cantidad optimizada)
  const fireflyCount = Math.min(window.innerWidth < 640 ? 12 : 20, 25);
  for (let i = 0; i < fireflyCount; i++) {
    state.fireflies.push(new Firefly());
  }

  // Bucle de animación Canvas (60 FPS unificado)
  function animateCanvas() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // 1. Dibujar luciérnagas
    for (let i = 0; i < state.fireflies.length; i++) {
      state.fireflies[i].update();
      state.fireflies[i].draw();
    }

    // 2. Dibujar estela continua de escarcha brillante (Glitter Trail)
    for (let i = state.glitterTrail.length - 1; i >= 0; i--) {
      const g = state.glitterTrail[i];
      g.update();
      g.draw();
      if (g.life <= 0) {
        state.glitterTrail.splice(i, 1);
      }
    }

    // 3. Actualizar mariposas monarca (SIEMPRE VOLANDO CONTINUAMENTE)
    for (let i = 0; i < state.butterflies.length; i++) {
      state.butterflies[i].update();
    }

    // 4. Dibujar pétalos en caída
    for (let i = state.petals.length - 1; i >= 0; i--) {
      const p = state.petals[i];
      p.update();
      p.draw();
      if (p.isBurst && p.life <= 0) {
        state.petals.splice(i, 1);
      }
    }

    requestAnimationFrame(animateCanvas);
  }

  requestAnimationFrame(animateCanvas);

  // Lluvia de pétalos masiva
  function triggerPetalRain(count = 35) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        state.petals.push(new PetalParticle(Math.random() * window.innerWidth, -25));
      }, i * 65);
    }
    showToast('Lluvia de pétalos dorados 🌸✨');
    playMagicalChime();
  }

  // Destello interactivo táctil al pulsar pantalla
  function spawnTouchBurst(x, y) {
    const burst = document.createElement('div');
    burst.className = 'tap-bloom-burst';
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 900);

    // Escarcha multicolor concentrada
    const colorNames = ['orange', 'blue', 'gold', 'purple', 'emerald'];
    for (let i = 0; i < 24; i++) {
      const col = colorNames[Math.floor(Math.random() * colorNames.length)];
      state.glitterTrail.push(new GlitterSparkle(x, y, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, col));
    }
    for (let i = 0; i < 8; i++) {
      state.petals.push(new PetalParticle(x, y, true));
    }

    playMagicalChime();
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, .butterfly')) return;
    spawnTouchBurst(e.clientX, e.clientY);
  });

  // Clic directo en flores
  const flowerHeads = document.querySelectorAll('.flower-head');
  flowerHeads.forEach(head => {
    head.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = head.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      spawnTouchBurst(x, y);

      // Una de las mariposas hace un vuelo rasante sobre la flor pulsada
      if (state.butterflies.length > 0) {
        const randomMonarch = state.butterflies[Math.floor(Math.random() * state.butterflies.length)];
        randomMonarch.targetX = x;
        randomMonarch.targetY = y;
        randomMonarch.speed = 4.4;
        setTimeout(() => { randomMonarch.speed = 3.6; }, 2000);
      }
    });
  });

  // --- 6. AUDIO AMBIENTAL CON WEB AUDIO API ---
  function initWebAudio() {
    if (!state.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioContext();
    }
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function playMelodicNote(freq, startTime, duration = 1.9, gainLevel = 0.08) {
    if (!state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(state.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  function playMagicalChime() {
    // DESACTIVADO: La creación de osciladores WebAudio en tiempo real (createOscillator) 
    // a menudo causa deadlocks e inestabilidad del proceso de audio en iOS Safari y algunos Android.
    // Como ya usamos el MP3 "Azul", nos libramos de esta carga.
  }

  function toggleAudio() {
    state.audioPlaying = !state.audioPlaying;

    if (state.audioPlaying) {
      audioWave.classList.add('audio-playing');
      audioLabel.textContent = 'Silenciar';
      showToast('Música activada 🎵');
      bgMusic.play().catch(e => console.warn('Error al reproducir MP3:', e));
    } else {
      audioWave.classList.remove('audio-playing');
      audioLabel.textContent = 'Música';
      bgMusic.pause();
      showToast('Música pausada');
    }
  }

  // --- CONTROL DE AUDIO EN SEGUNDO PLANO (MINIMIZAR/BLOQUEAR) ---
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Pausar siempre al minimizar para no gastar batería o asustar al usuario
      bgMusic.pause();
    } else {
      // Reanudar automáticamente solo si el usuario no lo había silenciado manualmente
      if (state.audioPlaying) {
        bgMusic.play().catch(e => console.warn('No se pudo reanudar el audio automáticamente:', e));
      }
    }
  });

  // --- 7. RE-FLORECER ANIMACIÓN ---
  function triggerReflower() {
    const stems = document.querySelectorAll('.stem-line');
    const flowers = document.querySelectorAll('.flower-head');
    const leaves = document.querySelectorAll('.svg-leaf');

    stems.forEach(stem => {
      stem.style.animation = 'none';
      stem.offsetHeight;
      stem.style.animation = '';
    });

    flowers.forEach(flower => {
      flower.style.animation = 'none';
      flower.offsetHeight;
      flower.style.animation = '';
    });

    leaves.forEach(leaf => {
      leaf.style.animation = 'none';
      leaf.offsetHeight;
      leaf.style.animation = '';
    });

    playMagicalChime();
    triggerPetalRain(20);
    showToast('El ramo ha florecido de nuevo 🌻✨');
  }

  function showToast(text) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = text;
    toast.classList.add('show');
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- LISTENERS ---
  btnAudio.addEventListener('click', toggleAudio);
  btnPetalRain.addEventListener('click', () => triggerPetalRain(30));
  btnReflower.addEventListener('click', triggerReflower);

  // --- INICIALIZACIÓN BOTÁNICA & MONARCAS ---
  renderFibonacciCenters();
  buildRealisticPetals();
  setupInteractiveSway();
  initMonarchButterflies();

  // El inicio de audio y caída inicial se maneja ahora en window.openGift()
});
