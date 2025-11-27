import * as ReactNamespace from 'react';
import { useEffect, useRef } from 'react';
import * as ReactDOMLegacy from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactIsNamespace from 'react-is';
import * as RechartsNamespace from 'recharts';
import Chart from 'chart.js/auto';
import { resolveLegacyUrl } from '@/lib/utils';

type LegacyPageProps = {
  htmlPath: string;
};

declare global {
  interface Window {
    React?: typeof ReactNamespace;
    ReactDOM?: typeof ReactDOMLegacy & {
      createRoot?: typeof ReactDOMClient.createRoot;
      hydrateRoot?: typeof ReactDOMClient.hydrateRoot;
    };
    ReactIs?: typeof ReactIsNamespace;
    Recharts?: typeof RechartsNamespace;
    Chart?: typeof Chart;
  }
}

function ensureLegacyGlobals() {
  if (typeof window === 'undefined') return;

  if (!window.React) {
    window.React = ReactNamespace;
  }

  if (!window.ReactDOM) {
    window.ReactDOM = {
      ...ReactDOMLegacy,
      createRoot: ReactDOMClient.createRoot,
      hydrateRoot: ReactDOMClient.hydrateRoot
    };
  } else {
    if (!window.ReactDOM.createRoot) {
      window.ReactDOM.createRoot = ReactDOMClient.createRoot;
    }
    if (!window.ReactDOM.hydrateRoot) {
      window.ReactDOM.hydrateRoot = ReactDOMClient.hydrateRoot;
    }
  }

  if (!window.ReactIs) {
    window.ReactIs = ReactIsNamespace;
  }

  if (!window.Recharts) {
    window.Recharts = RechartsNamespace;
  }

  if (!window.Chart) {
    window.Chart = Chart;
  }
}

ensureLegacyGlobals();

export function LegacyPage({ htmlPath }: LegacyPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const cleanupNodes: HTMLElement[] = [];
    const baseUrl = new URL(htmlPath, window.location.origin);

    async function injectScript(element: HTMLScriptElement) {
      return new Promise<void>((resolve) => {
        const scriptEl = document.createElement('script');
        scriptEl.async = false;
        scriptEl.dataset.legacy = 'true';

        const handleResolve = () => resolve();

        if (element.src) {
          const resolvedSrc = resolveLegacyUrl(element.getAttribute('src') ?? '', baseUrl);
          scriptEl.src = resolvedSrc;
          scriptEl.onload = handleResolve;
          scriptEl.onerror = handleResolve;
        } else if (element.textContent) {
          scriptEl.textContent = element.textContent;
          handleResolve();
        } else {
          handleResolve();
        }

        document.body.appendChild(scriptEl);
        cleanupNodes.push(scriptEl);
      });
    }

    async function loadScript(src: string): Promise<void> {
      return new Promise((resolve) => {
        // Check if script is already loaded
        if (document.querySelector(`script[data-legacy-src="${src}"]`)) {
          resolve();
          return;
        }

        // Try alternative paths for common scripts
        const tryPaths = [src];
        if (src.includes('/common/')) {
          // If it's trying to load from /common/, also try /legacy/common/
          const legacyPath = src.replace('/common/', '/legacy/common/');
          if (legacyPath !== src) {
            tryPaths.push(legacyPath);
          }
          // Also try the direct path if it was relative
          const directPath = src.includes(window.location.origin) 
            ? src 
            : new URL(src.replace(/^.*\/common\//, '/common/'), window.location.origin).href;
          if (directPath !== src && !tryPaths.includes(directPath)) {
            tryPaths.push(directPath);
          }
        } else if (src.startsWith('/dashboard/')) {
          const publicLegacyPath = src.replace('/dashboard/', '/legacy/dashboard/');
          if (!tryPaths.includes(publicLegacyPath)) {
            tryPaths.push(publicLegacyPath);
          }
          const directPath = src.includes(window.location.origin)
            ? src
            : new URL(publicLegacyPath, window.location.origin).href;
          if (!tryPaths.includes(directPath)) {
            tryPaths.push(directPath);
          }
        }

        let currentPathIndex = 0;

        const tryLoad = (pathToTry: string) => {
          const script = document.createElement('script');
          script.src = pathToTry;
          script.async = false;
          script.dataset.legacy = 'true';
          script.dataset.legacySrc = src; // Keep original src for tracking
          script.onload = () => resolve();
          script.onerror = () => {
            currentPathIndex++;
            if (currentPathIndex < tryPaths.length) {
              // Try next path
              tryLoad(tryPaths[currentPathIndex]);
            } else {
              console.warn(`Failed to load script from all attempted paths: ${tryPaths.join(', ')}`);
              resolve(); // Resolve anyway to continue loading other scripts
            }
          };
          document.body.appendChild(script);
          cleanupNodes.push(script);
        };

        tryLoad(tryPaths[0]);
      });
    }

    async function loadPage() {
      const response = await fetch(htmlPath, { cache: 'no-cache' });
      const html = await response.text();
      if (cancelled) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      if (containerRef.current) {
        containerRef.current.innerHTML = doc.body.innerHTML;
      }

      if (doc.title) {
        document.title = doc.title;
      }

      const styles = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
      styles.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;
        const resolvedHref = resolveLegacyUrl(href, baseUrl);
        if (document.querySelector(`link[data-legacy-href="${resolvedHref}"]`)) return;
        const linkEl = document.createElement('link');
        linkEl.rel = 'stylesheet';
        linkEl.href = resolvedHref;
        linkEl.dataset.legacyHref = resolvedHref;
        document.head.appendChild(linkEl);
        cleanupNodes.push(linkEl);
      });

      // Pre-load critical scripts (storage.js and common.js) before others
      const scripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script'));
      const criticalScripts: HTMLScriptElement[] = [];
      const otherScripts: HTMLScriptElement[] = [];

      scripts.forEach((script) => {
        const src = script.getAttribute('src') || '';
        if (src.includes('storage.js') || src.includes('common.js')) {
          criticalScripts.push(script);
        } else {
          otherScripts.push(script);
        }
      });

      // Load critical scripts first
      for (const script of criticalScripts) {
        if (script.src) {
          const resolvedSrc = resolveLegacyUrl(script.src, baseUrl);
          await loadScript(resolvedSrc);
        } else if (script.textContent) {
          await injectScript(script);
        }
      }

      // Then load other scripts
      for (const script of otherScripts) {
        // eslint-disable-next-line no-await-in-loop
        await injectScript(script);
      }

      document.dispatchEvent(new Event('DOMContentLoaded'));
    }

    loadPage().catch((error) => {
      console.error('Failed to load legacy page:', error);
    });

    return () => {
      cancelled = true;
      cleanupNodes.forEach((node) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
      cleanupNodes.length = 0;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [htmlPath]);

  return <div ref={containerRef} className="legacy-page" />;
}

