const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('open', !isOpen);
  });
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = new Date().getFullYear();
});

const goatCounterScript = document.createElement('script');
goatCounterScript.async = true;
goatCounterScript.src = 'https://gc.zgo.at/count.js';
goatCounterScript.dataset.goatcounter = 'https://eo-arthurolan.goatcounter.com/count';
document.head.append(goatCounterScript);

const pagePath = window.location.pathname;
const protectedImageContainers = [];

if (pagePath.endsWith('/photography.html')) {
  protectedImageContainers.push('.project-grid');
}
if (pagePath.endsWith('/tools.html')) {
  protectedImageContainers.push('.project-grid[aria-label="AI影像专题"]');
}
if (pagePath.includes('/photography/') || pagePath.includes('/ai-workshop/')) {
  protectedImageContainers.push('.gallery-main');
}

protectedImageContainers.forEach((selector) => {
  document.querySelectorAll(selector).forEach((container) => {
    container.setAttribute('data-copyright-images', '');
  });
});

const copyrightMessage = 'E.O 作品 · 版权所有';
let copyrightBubble;
let copyrightBubbleTimer;
let longPressTimer;
let longPressStart;
let longPressImage;
let suppressProtectedClick = false;
let suppressProtectedClickTimer;

function getProtectedImage(target) {
  if (!(target instanceof Element)) return null;
  const image = target.closest('[data-copyright-images] img');
  if (image) return image;
  const imageCard = target.closest('[data-copyright-images] .project-card');
  return imageCard ? imageCard.querySelector('img') : null;
}

function hideCopyrightBubble() {
  if (copyrightBubble) copyrightBubble.hidden = true;
}

function showCopyrightBubble(x, y, message = copyrightMessage) {
  if (!copyrightBubble) {
    copyrightBubble = document.createElement('div');
    copyrightBubble.className = 'copyright-bubble';
    copyrightBubble.setAttribute('role', 'status');
    copyrightBubble.setAttribute('aria-live', 'polite');
    document.body.append(copyrightBubble);
  }

  window.clearTimeout(copyrightBubbleTimer);
  copyrightBubble.textContent = message;
  copyrightBubble.hidden = false;
  copyrightBubble.style.left = '0';
  copyrightBubble.style.top = '0';

  const margin = 12;
  const offset = 14;
  const bounds = copyrightBubble.getBoundingClientRect();
  const left = Math.min(Math.max(x + offset, margin), window.innerWidth - bounds.width - margin);
  const top = Math.min(Math.max(y + offset, margin), window.innerHeight - bounds.height - margin);
  copyrightBubble.style.left = `${left}px`;
  copyrightBubble.style.top = `${top}px`;
  copyrightBubbleTimer = window.setTimeout(hideCopyrightBubble, 2800);
}

function cancelLongPress() {
  window.clearTimeout(longPressTimer);
  longPressTimer = null;
  longPressStart = null;
  longPressImage = null;
}

document.addEventListener('contextmenu', (event) => {
  if (!getProtectedImage(event.target)) return;
  event.preventDefault();
  showCopyrightBubble(event.clientX, event.clientY);
});

document.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch') return;
  const image = getProtectedImage(event.target);
  if (!image) return;
  cancelLongPress();
  longPressStart = { x: event.clientX, y: event.clientY };
  longPressImage = image;
  longPressTimer = window.setTimeout(() => {
    if (!longPressStart || !longPressImage) return;
    suppressProtectedClick = true;
    window.clearTimeout(suppressProtectedClickTimer);
    suppressProtectedClickTimer = window.setTimeout(() => {
      suppressProtectedClick = false;
    }, 900);
    showCopyrightBubble(longPressStart.x, longPressStart.y);
  }, 650);
});

document.addEventListener('pointermove', (event) => {
  if (!longPressStart) return;
  if (Math.hypot(event.clientX - longPressStart.x, event.clientY - longPressStart.y) > 10) {
    cancelLongPress();
  }
});

document.addEventListener('pointerup', cancelLongPress);
document.addEventListener('pointercancel', cancelLongPress);
document.addEventListener('click', (event) => {
  if (suppressProtectedClick && getProtectedImage(event.target)) {
    event.preventDefault();
    event.stopPropagation();
    suppressProtectedClick = false;
    return;
  }
  suppressProtectedClick = false;
  hideCopyrightBubble();
}, true);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hideCopyrightBubble();
});
window.addEventListener('scroll', hideCopyrightBubble, { passive: true });
window.addEventListener('resize', hideCopyrightBubble);

const siteStatsTrigger = document.querySelector('[data-site-stats]');
let siteStatsRequest;

function getSiteStatsPosition(event) {
  if (event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
    return { x: event.clientX, y: event.clientY };
  }
  const bounds = siteStatsTrigger.getBoundingClientRect();
  return { x: bounds.left + bounds.width / 2, y: bounds.top };
}

function loadSiteVisitCount() {
  if (!siteStatsRequest) {
    siteStatsRequest = fetch('https://eo-arthurolan.goatcounter.com/counter/TOTAL.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => data.count)
      .catch((error) => {
        siteStatsRequest = null;
        throw error;
      });
  }
  return siteStatsRequest;
}

async function showSiteStats(event) {
  const position = getSiteStatsPosition(event);
  showCopyrightBubble(position.x, position.y, '正在读取访问量…');
  try {
    const count = await loadSiteVisitCount();
    showCopyrightBubble(position.x, position.y, `全站累计访问 ${count} 次`);
  } catch (error) {
    showCopyrightBubble(position.x, position.y, '访问统计暂时无法读取');
  }
}

if (siteStatsTrigger) {
  siteStatsTrigger.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') showSiteStats(event);
  });
  siteStatsTrigger.addEventListener('click', showSiteStats);
  siteStatsTrigger.addEventListener('focus', showSiteStats);
  siteStatsTrigger.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    showSiteStats(event);
  });
}
