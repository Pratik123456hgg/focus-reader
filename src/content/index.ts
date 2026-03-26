// FocusRead AI — Content Script
// Injected into every page. Handles: text extraction, blocker overlay, reading mode.

(function () {
    'use strict';

    let readingModeActive = false;
    let overlayActive = false;
    let originalOverflow = '';

    // ─── Text Extraction ──────────────────────────────────────────
    function extractPageText(): string {
        const SKIP_TAGS = new Set([
            'script', 'style', 'noscript', 'nav', 'footer',
            'header', 'aside', 'iframe', 'img', 'svg', 'form',
            'button', 'input', 'select', 'textarea', 'figure',
        ]);

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    const p = node.parentElement;
                    if (!p) return NodeFilter.FILTER_REJECT;
                    if (SKIP_TAGS.has(p.tagName.toLowerCase())) return NodeFilter.FILTER_REJECT;
                    if (p.closest('nav, footer, header, aside, [role="navigation"], [role="banner"]'))
                        return NodeFilter.FILTER_REJECT;
                    const t = node.textContent?.trim() ?? '';
                    if (t.length < 4) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                },
            },
        );

        const parts: string[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
            const t = node.textContent?.trim();
            if (t) parts.push(t);
        }
        return parts.join(' ').replace(/\s+/g, ' ').slice(0, 12000);
    }

    // ─── Blocker Overlay ─────────────────────────────────────────
    function injectBlockerStyles(): void {
        if (document.getElementById('fr-blocker-styles')) return;
        const style = document.createElement('style');
        style.id = 'fr-blocker-styles';
        style.textContent = `
      #fr-blocker {
        position: fixed; inset: 0; z-index: 2147483647;
        background: linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #0d2d4a 100%);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', system-ui, sans-serif;
        animation: fr-fade-in 0.4s ease;
      }
      #fr-blocker.fr-hide { animation: fr-fade-out 0.4s ease forwards; }
      @keyframes fr-fade-in  { from { opacity:0; transform:scale(1.04); } to { opacity:1; transform:scale(1); } }
      @keyframes fr-fade-out { from { opacity:1; } to { opacity:0; } }
      .fr-blocker-content { text-align:center; color:#fff; padding:48px 32px; max-width:500px; }
      .fr-blocker-emoji { font-size:72px; margin-bottom:20px; display:block;
        animation: fr-pulse 2s ease-in-out infinite; }
      @keyframes fr-pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.08);} }
      .fr-blocker-title { font-size:30px; font-weight:800; margin:0 0 10px;
        background:linear-gradient(90deg,#a78bfa,#67e8f9);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
      .fr-blocker-sub { font-size:15px; color:rgba(255,255,255,.6); margin:0 0 30px; }
      .fr-ring-wrap { position:relative; width:80px; height:80px; margin:0 auto 18px; }
      .fr-ring-wrap svg { width:80px; height:80px; transform:rotate(-90deg); }
      .fr-ring-bg { fill:none; stroke:rgba(255,255,255,.12); stroke-width:6; }
      .fr-ring-prog { fill:none; stroke:#a78bfa; stroke-width:6; stroke-linecap:round;
        transition: stroke-dashoffset 1s linear; }
      .fr-ring-num { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:26px; font-weight:800; color:#fff; }
      .fr-blocker-tip { font-size:13px; color:rgba(255,255,255,.5); margin:0 0 26px; }
      .fr-back-btn { background:linear-gradient(135deg,#6c63ff,#4ecdc4); color:#fff; border:none;
        padding:13px 36px; border-radius:50px; font-size:15px; font-weight:700; cursor:pointer;
        box-shadow:0 8px 32px rgba(108,99,255,.4); transition:transform .2s, box-shadow .2s; }
      .fr-back-btn:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(108,99,255,.55); }

      #fr-reader { position:fixed; inset:0; z-index:2147483646; background:#f8f7ff;
        overflow-y:auto; font-family: Georgia, 'Times New Roman', serif;
        animation: fr-fade-in 0.35s ease; }
      .fr-reader-bar { position:sticky; top:0; background:linear-gradient(135deg,#6c63ff,#4ecdc4);
        padding:13px 22px; display:flex; align-items:center; justify-content:space-between; z-index:10;
        box-shadow:0 2px 16px rgba(108,99,255,.25); }
      .fr-reader-logo { color:#fff; font-family:'Inter',sans-serif; font-weight:700; font-size:15px; }
      .fr-reader-close { background:rgba(255,255,255,.2); color:#fff; border:1px solid rgba(255,255,255,.35);
        padding:5px 16px; border-radius:50px; font-size:13px; font-weight:600;
        cursor:pointer; font-family:'Inter',sans-serif; transition:background .2s; }
      .fr-reader-close:hover { background:rgba(255,255,255,.35); }
      .fr-reader-body { max-width:720px; margin:0 auto; padding:44px 28px 80px; }
      .fr-reader-title { font-size:27px; font-weight:800; color:#1a1240;
        font-family:'Inter',sans-serif; margin:0 0 28px; border-bottom:2px solid #e8e5ff; padding-bottom:18px; }
      .fr-reader-content { font-size:18px; line-height:1.85; color:#2d2d3f; }
      .fr-reader-content h1,.fr-reader-content h2,.fr-reader-content h3 {
        font-family:'Inter',sans-serif; color:#1a1240; margin-top:32px; margin-bottom:10px; }
      .fr-reader-content p { margin:0 0 18px; }
      .fr-reader-content a { color:#6c63ff; }
      .fr-reader-content ul,.fr-reader-content ol { padding-left:26px; margin:0 0 18px; }
      .fr-reader-content li { margin-bottom:6px; }
      .fr-reader-content blockquote { border-left:4px solid #6c63ff; margin:22px 0;
        padding:10px 18px; background:#f0eeff; border-radius:0 8px 8px 0; }
      .fr-reader-content img { max-width:100%; border-radius:8px; margin:14px 0; }
    `;
        document.head.appendChild(style);
    }

    function showBlocker(): void {
        if (overlayActive) return;
        overlayActive = true;
        injectBlockerStyles();

        const el = document.createElement('div');
        el.id = 'fr-blocker';
        const CIRC = 2 * Math.PI * 34;
        el.innerHTML = `
      <div class="fr-blocker-content">
        <span class="fr-blocker-emoji">🧠</span>
        <h1 class="fr-blocker-title">You're supposed to be studying!</h1>
        <p class="fr-blocker-sub">This site is blocked in Focus Mode.</p>
        <div class="fr-ring-wrap">
          <svg viewBox="0 0 80 80">
            <circle class="fr-ring-bg" cx="40" cy="40" r="34"/>
            <circle class="fr-ring-prog" id="fr-ring" cx="40" cy="40" r="34"
              style="stroke-dasharray:${CIRC};stroke-dashoffset:0"/>
          </svg>
          <div class="fr-ring-num" id="fr-num">5</div>
        </div>
        <p class="fr-blocker-tip">Returning to study in <strong id="fr-sec">5</strong> seconds…</p>
        <button class="fr-back-btn" id="fr-back-btn">← Go Back Now</button>
      </div>
    `;
        document.body.appendChild(el);

        let secs = 5;
        const ring = document.getElementById('fr-ring') as SVGCircleElement | null;
        const interval = setInterval(() => {
            secs--;
            const numEl = document.getElementById('fr-num');
            const secEl = document.getElementById('fr-sec');
            if (numEl) numEl.textContent = String(secs);
            if (secEl) secEl.textContent = String(secs);
            if (ring) ring.style.strokeDashoffset = String(CIRC * (1 - secs / 5));
            if (secs <= 0) { clearInterval(interval); removeBlocker(); window.history.back(); }
        }, 1000);

        document.getElementById('fr-back-btn')?.addEventListener('click', () => {
            clearInterval(interval); removeBlocker(); window.history.back();
        });
    }

    function removeBlocker(): void {
        const el = document.getElementById('fr-blocker');
        if (el) { el.classList.add('fr-hide'); setTimeout(() => el.remove(), 400); }
        overlayActive = false;
    }

    // ─── Reading Mode ─────────────────────────────────────────────
    function enableReadingMode(): void {
        if (readingModeActive) return;
        readingModeActive = true;
        injectBlockerStyles();

        const SELECTORS = [
            'article', 'main', '[role="main"]', '.post-content',
            '.entry-content', '.article-body', '.article-content',
            '.story-body', '.content-body', '#content', '#main-content',
        ];

        let mainEl: Element | null = null;
        for (const sel of SELECTORS) {
            const found = document.querySelector(sel);
            if (found && (found as HTMLElement).innerText.trim().length > 200) {
                mainEl = found.cloneNode(true) as Element;
                break;
            }
        }

        if (!mainEl) {
            const candidates = [...document.querySelectorAll<HTMLElement>('div, section')];
            let best: HTMLElement | null = null, bestLen = 0;
            for (const el of candidates) {
                const len = el.innerText.trim().length;
                if (len > bestLen) { bestLen = len; best = el; }
            }
            if (best) mainEl = best.cloneNode(true) as Element;
        }

        if (mainEl) {
            ['script', 'style', 'nav', 'footer', 'aside', 'iframe', 'form', 'button'].forEach((tag) => {
                mainEl!.querySelectorAll(tag).forEach((n) => n.remove());
            });
        }

        const reader = document.createElement('div');
        reader.id = 'fr-reader';
        reader.innerHTML = `
      <div class="fr-reader-bar">
        <span class="fr-reader-logo">🧠 FocusRead AI — Reading Mode</span>
        <button class="fr-reader-close" id="fr-reader-close">✕ Exit</button>
      </div>
      <div class="fr-reader-body">
        <h1 class="fr-reader-title">${document.title}</h1>
        <div class="fr-reader-content">${mainEl ? mainEl.innerHTML : '<p>Unable to extract content from this page.</p>'}</div>
      </div>
    `;
        originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.appendChild(reader);

        document.getElementById('fr-reader-close')?.addEventListener('click', disableReadingMode);
    }

    function disableReadingMode(): void {
        if (!readingModeActive) return;
        document.getElementById('fr-reader')?.remove();
        document.body.style.overflow = originalOverflow;
        readingModeActive = false;
    }

    // ─── Search Enhance (Google Search AI Injection) ────────────────
    function injectSearchEnhance(): void {
        // Only run on Google search pages
        if (!window.location.hostname.includes('google.com') || !window.location.pathname.includes('/search')) return;

        // Get search query from URL
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        if (!query) return;

        // Check if already injected
        if (document.getElementById('fr-search-enhance-card')) return;

        // Create card container
        const card = document.createElement('div');
        card.id = 'fr-search-enhance-card';
        card.innerHTML = `
            <div style="
              position: fixed; right: 20px; top: 100px; width: 320px;
              background: linear-gradient(135deg, #1a0533 0%, #2d1b69 100%);
              border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 12px;
              box-shadow: 0 12px 40px rgba(108, 99, 255, 0.2);
              color: white; font-family: 'Inter', system-ui, sans-serif;
              z-index: 10000; overflow: hidden;
              animation: fr-search-fade-in 0.4s ease;
            " class="fr-search-card">
              <style>
                @keyframes fr-search-fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fr-search-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .fr-search-close { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.1);
                  border: none; color: white; width: 28px; height: 28px; border-radius: 6px;
                  cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;
                  transition: background 0.2s; }
                .fr-search-close:hover { background: rgba(255,255,255,0.2); }
              </style>
              
              <div style="background: linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%); padding: 16px 16px 12px;
              display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">🧠</span>
                <div>
                  <div style="font-weight: 700; font-size: 14px;">FocusRead AI</div>
                  <div style="font-size: 11px; opacity: 0.8;">AI-Powered Answer</div>
                </div>
              </div>
              
              <div style="padding: 16px;">
                <div id="fr-search-loading" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 20px 0;">
                  <span style="font-size: 18px; animation: fr-search-spin 1s linear infinite;">⚙️</span>
                  <span style="font-size: 13px; color: rgba(255,255,255,0.8);">Analyzing your query...</span>
                </div>
                <div id="fr-search-answer" style="display: none; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.95);"></div>
              </div>
              
              <div id="fr-search-followup-container" style="display: none; border-top: 1px solid rgba(167, 139, 250, 0.3); padding: 12px 16px; gap: 8px; display: flex; flex-direction: column;">
                <input type="text" id="fr-search-followup-input" placeholder="Ask a follow-up question..." 
                  style="background: rgba(255,255,255,0.1); border: 1px solid rgba(167, 139, 250, 0.4);
                  color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif;
                  outline: none; transition: border 0.2s;" />
              </div>
              
              <button class="fr-search-close" id="fr-search-dismiss">✕</button>
            </div>
        `;

        document.body.appendChild(card);

        // Dismiss button
        document.getElementById('fr-search-dismiss')?.addEventListener('click', () => {
            const el = document.getElementById('fr-search-enhance-card');
            if (el) {
                el.style.animation = 'fr-search-fade-in 0.4s ease reverse forwards';
                setTimeout(() => el.remove(), 300);
            }
        });

        // Fetch AI answer
        chrome.runtime.sendMessage({ action: 'searchEnhance', query }, (response) => {
            const loadingEl = document.getElementById('fr-search-loading');
            const answerEl = document.getElementById('fr-search-answer');
            const followupContainer = document.getElementById('fr-search-followup-container');

            if (loadingEl) loadingEl.style.display = 'none';
            if (answerEl && response?.data) {
                answerEl.textContent = response.data;
                answerEl.style.display = 'block';
                if (followupContainer) followupContainer.style.display = 'flex';
            }
        });
    }

    // Check settings and inject on load
    function checkSearchEnhance(): void {
        chrome.storage.local.get('searchEnhance', (result) => {
            if (result.searchEnhance !== false) {
                // Default to true if not set
                injectSearchEnhance();
            }
        });
    }

    // Run on load and on history changes
    checkSearchEnhance();
    window.addEventListener('popstate', checkSearchEnhance);

    // ─── YouTube Transcript Extraction ────────────────────────────
    function extractYouTubeTranscript(): Promise<string> {
        return new Promise((resolve) => {
            // Try multiple approaches to get transcript
            
            // Approach 1: Try clicking the transcript toggle button
            const tryTranscriptButton = () => {
                // Look for "Show transcript" button in various places
                const buttons = document.querySelectorAll('button, [role="button"]');
                let transcriptBtn = null;
                
                for (const btn of buttons) {
                    if (btn.textContent?.toLowerCase().includes('transcript') || 
                        btn.title?.toLowerCase().includes('transcript') ||
                        btn.getAttribute('aria-label')?.toLowerCase().includes('transcript')) {
                        transcriptBtn = btn as HTMLElement;
                        break;
                    }
                }
                
                if (transcriptBtn) {
                    transcriptBtn.click();
                    return true;
                }
                
                // Try the three-dot menu approach
                const menuButton = document.querySelector('[aria-label="More actions"]') as HTMLElement;
                if (menuButton) {
                    menuButton.click();
                    return true;
                }
                
                return false;
            };

            if (!tryTranscriptButton()) {
                resolve('Transcript button not found. Ensure video has captions enabled.');
                return;
            }

            // Wait for transcript panel to open
            setTimeout(() => {
                // Approach 2: Try multiple selectors for transcript content
                let transcriptText = '';

                // Try selector 1: ytd-transcript-segment-renderer (official transcripts)
                let segments = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');
                if (segments.length > 0) {
                    transcriptText = Array.from(segments)
                        .map((seg) => seg.textContent?.trim() || '')
                        .filter(Boolean)
                        .join('\n');
                }

                // Try selector 2: yt-formatted-string with role button
                if (!transcriptText) {
                    segments = document.querySelectorAll('yt-formatted-string[role="button"]');
                    transcriptText = Array.from(segments)
                        .map((seg) => seg.textContent?.trim() || '')
                        .filter(Boolean)
                        .join('\n');
                }

                // Try selector 3: Generic transcript panel content
                if (!transcriptText) {
                    const transcriptPanel = document.querySelector('ytd-transcript-renderer, [aria-label*="Transcript"], .transcript-panel');
                    if (transcriptPanel) {
                        segments = transcriptPanel.querySelectorAll('[role="button"], .segment-text, .transcribed-text');
                        transcriptText = Array.from(segments)
                            .map((seg) => seg.textContent?.trim() || '')
                            .filter(Boolean)
                            .join('\n');
                    }
                }

                // Try selector 4: All text content from visible elements in video player area
                if (!transcriptText) {
                    const mainContent = document.querySelector('ytd-rich-section-renderer, .content');
                    if (mainContent) {
                        const elements = mainContent.querySelectorAll('p, span, div');
                        transcriptText = Array.from(elements)
                            .map((el) => el.textContent?.trim() || '')
                            .filter((text) => text && text.length > 10)
                            .slice(0, 50)
                            .join('\n');
                    }
                }

                if (transcriptText.length > 20) {
                    resolve(transcriptText);
                } else {
                    resolve('Unable to extract transcript. Try enabling captions on the video.');
                }
            }, 1500);
        });
    }

    // ─── Smart Highlighter ────────────────────────────────────────
    let highlighterTimeout: number;

    function removeHighlighter(): void {
        const existing = document.getElementById('fr-highlighter-toolbar');
        if (existing) existing.remove();
    }

    document.addEventListener('mouseup', () => {
        clearTimeout(highlighterTimeout);
        removeHighlighter();

        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) return;

        const selectedText = selection.toString().trim();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.id = 'fr-highlighter-toolbar';
        toolbar.innerHTML = `
            <div style="
              position: fixed; left: ${rect.left + rect.width / 2 - 130}px; top: ${rect.top - 50}px;
              background: #1a0533; border: 2px solid #6c63ff; border-radius: 12px;
              color: white; font-family: 'Inter', system-ui, sans-serif;
              z-index: 99999; display: flex; gap: 8px; padding: 8px;
              box-shadow: 0 8px 24px rgba(108, 99, 255, 0.3);
              animation: fr-toolbar-pop 0.25s ease;
              user-select: none;
            " class="fr-highlighter-buttons">
              <style>
                @keyframes fr-toolbar-pop { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .fr-toolbar-btn {
                  background: rgba(108, 99, 255, 0.2); border: 1px solid #6c63ff; color: #a78bfa;
                  padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
                  cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
                }
                .fr-toolbar-btn:hover { background: rgba(108, 99, 255, 0.4); }
              </style>
              <button class="fr-toolbar-btn" id="fr-explain-btn">🧠 Explain</button>
              <button class="fr-toolbar-btn" id="fr-flashcard-btn">🃏 To Card</button>
              <button class="fr-toolbar-btn" id="fr-copy-btn">📋 Copy</button>
            </div>
        `;

        document.body.appendChild(toolbar);

        // Explain button
        document.getElementById('fr-explain-btn')?.addEventListener('click', () => {
            chrome.runtime.sendMessage(
                { action: 'explainText', text: selectedText },
                (response) => {
                    if (response?.data) {
                        const tooltip = document.createElement('div');
                        tooltip.style.cssText = `
                          position: fixed; left: ${rect.left + rect.width / 2 - 150}px; top: ${rect.bottom + 20}px;
                          background: linear-gradient(135deg, #6c63ff, #4ecdc4); border-radius: 8px;
                          color: white; padding: 12px; border-radius: 8px; max-width: 300px; font-size: 12px;
                          font-family: 'Inter', sans-serif; z-index: 100000; line-height: 1.5;
                          box-shadow: 0 12px 32px rgba(108, 99, 255, 0.3);
                        `;
                        tooltip.textContent = response.data;
                        document.body.appendChild(tooltip);

                        setTimeout(() => tooltip.remove(), 6000);
                        removeHighlighter();
                    }
                }
            );
        });

        // To Flashcard button
        document.getElementById('fr-flashcard-btn')?.addEventListener('click', () => {
            chrome.runtime.sendMessage(
                { action: 'addHighlightFlashcard', text: selectedText },
                () => {
                    const confirm = document.createElement('div');
                    confirm.style.cssText = `
                      position: fixed; left: ${rect.left + rect.width / 2 - 100}px; top: ${rect.top - 70}px;
                      background: #10b981; color: white; padding: 10px 16px; border-radius: 6px;
                      font-size: 12px; font-weight: 600; font-family: 'Inter', sans-serif; z-index: 100001;
                      animation: fr-fade-in 0.3s ease;
                    `;
                    confirm.textContent = '✅ Saved to flashcards!';
                    document.body.appendChild(confirm);

                    setTimeout(() => confirm.remove(), 2000);
                    removeHighlighter();
                }
            );
        });

        // Copy button
        document.getElementById('fr-copy-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(selectedText).then(() => {
                const confirm = document.createElement('div');
                confirm.style.cssText = `
                  position: fixed; left: ${rect.left + rect.width / 2 - 100}px; top: ${rect.top - 70}px;
                  background: #3b82f6; color: white; padding: 10px 16px; border-radius: 6px;
                  font-size: 12px; font-weight: 600; font-family: 'Inter', sans-serif; z-index: 100001;
                  animation: fr-fade-in 0.3s ease;
                `;
                confirm.textContent = '✓ Copied!';
                document.body.appendChild(confirm);

                setTimeout(() => confirm.remove(), 1500);
                removeHighlighter();
            });
        });

        // Auto-dismiss after 4 seconds
        highlighterTimeout = window.setTimeout(removeHighlighter, 4000);
    });

    // ─── Message Listener ─────────────────────────────────────────
    chrome.runtime.onMessage.addListener(
        (
            request: { action: string; transcript?: string },
            _sender,
            sendResponse: (r: { text?: string; title?: string; transcript?: string; success?: boolean }) => void,
        ) => {
            if (request.action === 'getPageText') {
                sendResponse({ text: extractPageText(), title: document.title });
                return true;
            }
            if (request.action === 'enableReadingMode') {
                enableReadingMode();
                sendResponse({ success: true });
                return true;
            }
            if (request.action === 'disableReadingMode') {
                disableReadingMode();
                sendResponse({ success: true });
                return true;
            }
            if (request.action === 'getYouTubeTranscript') {
                extractYouTubeTranscript().then((transcript) => {
                    sendResponse({ transcript });
                });
                return true;
            }
            if (request.action === 'printPage') {
                window.print();
                sendResponse({ success: true });
                return true;
            }
        },
    );

    // Listen for focus mode event dispatched by background.js
    window.addEventListener('focusread:block', () => showBlocker());
})();
