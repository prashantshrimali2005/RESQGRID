// CivicFix — Lightweight hash-based SPA router

export interface PageResult {
  html: string;
  init?: () => void;
  cleanup?: () => void;
}

export type PageHandler = () => PageResult;

const routes: Record<string, PageHandler> = {};
let currentCleanup: (() => void) | null = null;

export function registerRoute(path: string, handler: PageHandler) {
  routes[path] = handler;
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function getCurrentPath(): string {
  return window.location.hash.slice(1) || '/home';
}

function setupNavLinks() {
  document.querySelectorAll('[data-path]').forEach(link => {
    link.addEventListener('click', (e: Event) => {
      e.preventDefault();
      navigate('/' + (link as HTMLElement).getAttribute('data-path'));
    });
  });
}

export function initRouter(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  async function renderRoute() {
    const path = getCurrentPath();
    const handler = routes[path] || routes['/home'];
    if (!handler) return;

    if (currentCleanup && typeof currentCleanup === 'function') {
      currentCleanup();
      currentCleanup = null;
    }

    const result = handler();
    container!.innerHTML = result.html;
    currentCleanup = result.cleanup || null;

    const main = container!.querySelector('main');
    if (main) main.classList.add('page-enter');

    if (result.init) result.init();
    setupNavLinks();
  }

  window.addEventListener('hashchange', renderRoute);

  if (!window.location.hash) {
    window.location.hash = '/home';
  } else {
    renderRoute();
  }
}
