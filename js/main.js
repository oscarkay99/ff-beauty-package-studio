(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Preloader ---------------- */
  const preloader = document.getElementById('preloader');
  const hero = document.getElementById('hero');
  const finishLoad = () => {
    if (preloader) preloader.classList.add('is-hidden');
    if (hero) hero.classList.add('is-ready');
  };
  if (reduceMotion) {
    finishLoad();
  } else {
    window.addEventListener('load', () => setTimeout(finishLoad, 900));
    // safety fallback in case the load event is delayed; the CSS-only
    // forceHidePreloader animation is a second, independent backstop
    setTimeout(finishLoad, 2600);
  }

  /* ---------------- Header scroll state ---------------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Nav underline indicator ---------------- */
  const navDesktop = document.querySelector('.nav-desktop');
  const navIndicator = document.querySelector('.nav-indicator');
  if (navDesktop && navIndicator) {
    const navLinks = navDesktop.querySelectorAll('a');
    const moveIndicator = (el) => {
      const navRect = navDesktop.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      navIndicator.style.width = r.width + 'px';
      navIndicator.style.transform = `translateX(${r.left - navRect.left}px)`;
    };
    navLinks.forEach((a) => a.addEventListener('mouseenter', () => moveIndicator(a)));
    if (navLinks[0]) moveIndicator(navLinks[0]);
  }

  /* ---------------- Mobile menu ---------------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuToggle && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    menuToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  }

  /* ---------------- Scroll reveals ---------------- */
  const revealEls = document.querySelectorAll('.reveal-up');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));

    // safety net: force-reveal anything the observer missed (e.g. an
    // element whose threshold never triggers at some viewport size)
    setTimeout(() => {
      revealEls.forEach((el) => el.classList.add('is-in'));
    }, 4000);
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------- Services tabs ---------------- */
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.service-list');
  const tabIndicator = document.querySelector('.tab-indicator');
  const tabsWrap = document.querySelector('.tabs');

  const revealPanelItems = (panel) => {
    const items = panel.querySelectorAll('li');
    items.forEach((li) => li.classList.remove('is-in'));
    requestAnimationFrame(() => {
      items.forEach((li) => li.classList.add('is-in'));
    });
  };

  const moveTabIndicator = (tabEl) => {
    if (!tabIndicator || !tabsWrap) return;
    const wrapRect = tabsWrap.getBoundingClientRect();
    const r = tabEl.getBoundingClientRect();
    tabIndicator.style.width = r.width + 'px';
    tabIndicator.style.left = (r.left - wrapRect.left) + 'px';
    tabIndicator.style.top = (r.bottom - wrapRect.top - 1) + 'px';
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === target));
      moveTabIndicator(tab);
      const activePanel = document.querySelector(`.service-list[data-panel="${target}"]`);
      if (activePanel) revealPanelItems(activePanel);
    });
  });

  const initialTab = document.querySelector('.tab.is-active');
  if (initialTab) {
    window.addEventListener('load', () => moveTabIndicator(initialTab));
    setTimeout(() => moveTabIndicator(initialTab), 300);
  }

  // reveal first panel items when scrolled into view
  const firstPanel = document.querySelector('.service-list.is-active');
  if (firstPanel && 'IntersectionObserver' in window) {
    const panelIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealPanelItems(entry.target);
          panelIO.disconnect();
        }
      });
    }, { threshold: 0.2 });
    panelIO.observe(firstPanel);
  } else if (firstPanel) {
    revealPanelItems(firstPanel);
  }

  window.addEventListener('resize', () => {
    const active = document.querySelector('.tab.is-active');
    if (active) moveTabIndicator(active);
  });

  // nav links pointing at #locs land on the tab button itself (native anchor
  // scroll), also activate that tab so the Locs panel is what's shown
  document.querySelectorAll('a[href="#locs"]').forEach((a) => {
    a.addEventListener('click', () => {
      const locsTab = document.getElementById('locs');
      if (locsTab) locsTab.click();
    });
  });

  /* ---------------- Gallery card scrim (keeps captions legible over bright photos) ---------------- */
  document.querySelectorAll('.gallery-card').forEach((card) => {
    if (!card.querySelector('img, video')) return;
    const scrim = document.createElement('span');
    scrim.className = 'gallery-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    const label = card.querySelector('.gallery-label');
    card.insertBefore(scrim, label);
  });

  /* ---------------- Gallery drag-to-scroll + progress ---------------- */
  const galleryTrack = document.getElementById('galleryTrack');
  const galleryProgressBar = document.getElementById('galleryProgressBar');
  if (galleryTrack) {
    let isDown = false, startX = 0, scrollStart = 0;

    galleryTrack.addEventListener('pointerdown', (e) => {
      isDown = true;
      startX = e.clientX;
      scrollStart = galleryTrack.scrollLeft;
      galleryTrack.setPointerCapture(e.pointerId);
    });
    galleryTrack.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      galleryTrack.scrollLeft = scrollStart - (e.clientX - startX);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
      galleryTrack.addEventListener(ev, () => { isDown = false; })
    );

    const updateProgress = () => {
      const max = galleryTrack.scrollWidth - galleryTrack.clientWidth;
      const pct = max > 0 ? (galleryTrack.scrollLeft / max) * 100 : 0;
      if (galleryProgressBar) {
        galleryProgressBar.style.transform = `translateX(0)`;
        galleryProgressBar.style.width = Math.max(pct, 8) + '%';
      }
    };
    galleryTrack.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------------- Back to top ---------------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- Footer year ---------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Lazy video mount ----------------
     <video> has no native lazy-loading, unlike <img loading="lazy">.
     Give a video data-src instead of src (see README "Adding Photos & Video")
     and it won't be requested until it's about to scroll into view. */
  const lazyVideos = document.querySelectorAll('video[data-src]');
  if (lazyVideos.length) {
    if ('IntersectionObserver' in window) {
      const videoIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const v = entry.target;
          v.muted = true;
          v.addEventListener('playing', () => v.closest('.gallery-card')?.classList.add('is-playing'));
          v.src = v.dataset.src;
          v.load();
          delete v.dataset.src;
          v.play().catch(() => {});
          videoIO.unobserve(v);
        });
      }, { rootMargin: '300px 0px' });
      lazyVideos.forEach((v) => videoIO.observe(v));
    } else {
      lazyVideos.forEach((v) => { v.src = v.dataset.src; v.load(); });
    }
  }

  /* ---------------- Appointment request form ----------------
     No backend on this static site, so instead of "submitting" anywhere,
     this builds a formatted message and hands it to WhatsApp, the studio's
     actual booking channel. */
  const appointmentForm = document.getElementById('appointmentForm');
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(appointmentForm);
      const name = (data.get('name') || '').toString().trim();
      const phone = (data.get('phone') || '').toString().trim();
      const service = (data.get('service') || '').toString().trim();
      const date = (data.get('date') || '').toString().trim();
      const notes = (data.get('notes') || '').toString().trim();

      const lines = [
        'Hi FF Beauty Package Studio, I would like to request an appointment.',
        '',
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Service: ${service}`,
        `Preferred date: ${date || 'Flexible'}`,
      ];
      if (notes) lines.push(`Notes: ${notes}`);

      const message = encodeURIComponent(lines.join('\n'));
      window.open(`https://wa.me/16144326449?text=${message}`, '_blank', 'noopener');
    });
  }

  /* ---------------- Cookie consent banner ---------------- */
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAccept = document.getElementById('cookieAccept');
  if (cookieBanner && cookieAccept) {
    const CONSENT_KEY = 'ff_cookie_consent';
    let alreadyAccepted = false;
    try { alreadyAccepted = localStorage.getItem(CONSENT_KEY) === 'yes'; } catch (e) {}

    if (!alreadyAccepted) {
      setTimeout(() => {
        cookieBanner.classList.add('is-visible');
        document.body.classList.add('cookie-open');
      }, 700);
    }
    cookieAccept.addEventListener('click', () => {
      try { localStorage.setItem(CONSENT_KEY, 'yes'); } catch (e) {}
      cookieBanner.classList.remove('is-visible');
      document.body.classList.remove('cookie-open');
    });
  }

  /* ---------------- Chat assistant widget (Groq-powered) ----------------
     Messages are sent to a Google Apps Script Web App, which holds the
     Groq API key server-side and proxies the call. See
     google-apps-script/README.md for the deployment steps. */
  const chatLauncher = document.getElementById('chatLauncher');
  const chatPanel = document.getElementById('chatPanel');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatQuickReplies = document.getElementById('chatQuickReplies');

  const CHAT_API_URL = 'https://script.google.com/macros/s/AKfycbzY5QEp5MYoWT5RTu7cJbI0f9zA7GqUVHRXLlC8gPySHXXsS2nV9gjWEGYN7FOCYSQE/exec';

  if (chatLauncher && chatPanel && chatMessages && chatForm && chatInput && chatQuickReplies) {
    const PHONE = '614-432-6449';
    const QUICK_PROMPTS = [
      'What services do you offer?',
      'What are your hours?',
      'Where are you located?',
      'How do I book?',
      'Tell me about the traditional wedding package',
      'Do you do Sisterlocks?',
    ];
    const GREETING = "Hi! I'm here to help with quick questions about FF Beauty Package Studio. Ask about services, hours, location, or booking, or tap a topic below.";
    const FALLBACK = `I'm having trouble reaching my brain right now. Call or WhatsApp us at ${PHONE} and we'll take great care of you.`;

    let isOpen = false;
    let isSending = false;
    let history = [];

    const addMessage = (text, from) => {
      const el = document.createElement('div');
      el.className = `chat-msg chat-msg--${from}`;
      el.textContent = text;
      chatMessages.appendChild(el);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return el;
    };

    const renderQuickReplies = () => {
      chatQuickReplies.innerHTML = '';
      QUICK_PROMPTS.forEach((prompt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chat-chip';
        btn.textContent = prompt;
        btn.addEventListener('click', () => sendMessage(prompt));
        chatQuickReplies.appendChild(btn);
      });
    };

    const sendMessage = async (text) => {
      if (isSending) return;
      isSending = true;
      addMessage(text, 'user');
      const typingEl = addMessage('...', 'bot');

      if (!CHAT_API_URL || CHAT_API_URL.indexOf('PASTE_') === 0) {
        typingEl.textContent = FALLBACK;
        isSending = false;
        return;
      }

      try {
        const res = await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ message: text, history }),
        });
        const data = await res.json();
        const reply = data.reply || FALLBACK;
        typingEl.textContent = reply;
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: reply });
        history = history.slice(-8);
      } catch (err) {
        typingEl.textContent = FALLBACK;
      } finally {
        isSending = false;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    };

    chatLauncher.addEventListener('click', () => {
      isOpen = !isOpen;
      chatPanel.classList.toggle('is-open', isOpen);
      chatLauncher.setAttribute('aria-expanded', String(isOpen));
      chatPanel.setAttribute('aria-hidden', String(!isOpen));
      if (isOpen && !chatMessages.childElementCount) {
        addMessage(GREETING, 'bot');
        renderQuickReplies();
      }
      if (isOpen) chatInput.focus();
    });

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInput.value.trim();
      if (!val || isSending) return;
      sendMessage(val);
      chatInput.value = '';
    });
  }

})();
