// =============================================
// 라우터
// =============================================
let currentPage = 'home';
let pageParams  = {};

function navigate(page, params = {}) {
    if (!RateLimit.check('navigate')) return;
    currentPage = page;
    pageParams  = params;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 모바일 메뉴 자동 닫기
    const menu     = document.getElementById('navMenu');
    const btn      = document.getElementById('hamburger');
    const backdrop = document.getElementById('menuBackdrop');
    if (menu)     menu.classList.remove('active');
    if (btn)      btn.classList.remove('active');
    if (btn)      btn.setAttribute('aria-expanded', 'false');
    if (btn)      btn.setAttribute('aria-label', '메뉴 열기');
    if (backdrop) backdrop.classList.remove('active');
}

const BANNED_RESTRICTED   = ['board','board-detail','board-write','dday'];
const TIMEOUT_RESTRICTED  = ['board','board-detail','board-write','dday','votes','vote-detail','vote-create'];
const GUEST_ALLOWED       = ['home','timetable','lunch','academic','weather','cleaning','map','board','board-detail','board-write','votes','vote-detail','vote-create','dday','chat','links','suggestion'];

// 로그인 기능 삭제로 인해 더 이상 사용되지 않음
// function renderLoginRequiredPage() { ... }

function renderBannedPage() {
    return `
    <div class="page">
        <div class="empty-state">
            <div class="empty-icon">🚫</div>
            <p style="color:var(--danger);font-weight:700;font-size:1rem">계정이 정지되었습니다.</p>
            <p style="font-size:0.85rem;margin-top:8px;color:var(--text-muted)">공지사항 보기, 투표 보기, 바로가기만 이용할 수 있습니다.<br>문의는 담임선생님께 연락하세요.</p>
        </div>
    </div>`;
}

function renderTimedOutPage() {
    const info   = getTimeoutInfo();
    const until  = info ? info.until : Date.now();
    const pad    = n => String(n).padStart(2, '0');

    function fmtUntil(ts) {
        const d = new Date(ts);
        const days  = ['일','월','화','수','목','금','토'];
        return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} (${days[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function fmtRemaining(ms) {
        if (ms <= 0) return '00:00:00';
        const s  = Math.floor(ms / 1000);
        const dd = Math.floor(s / 86400);
        const hh = Math.floor((s % 86400) / 3600);
        const mm = Math.floor((s % 3600) / 60);
        const ss = s % 60;
        if (dd > 0) return `${dd}일 ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
        return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    }

    // 카운트다운 시작 (DOM 삽입 후)
    setTimeout(() => {
        const el = document.getElementById('timeoutCountdown');
        if (!el) return;
        const tick = () => {
            const rem = until - Date.now();
            if (rem <= 0) { render(); return; }   // 만료 → 자동 해제
            el.textContent = fmtRemaining(rem);
        };
        tick();
        const t = setInterval(() => {
            if (!document.getElementById('timeoutCountdown')) { clearInterval(t); return; }
            tick();
        }, 1000);
    }, 0);

    return `
    <div class="page">
        <div class="empty-state timeout-state">
            <div class="timeout-icon">⏳</div>
            <p class="timeout-title">일시적으로 제한되었습니다</p>
            <p class="timeout-sub">아래 시간이 지나면 자동으로 해제됩니다.</p>
            <div class="timeout-countdown-wrap">
                <span id="timeoutCountdown" class="timeout-countdown">${fmtRemaining(until - Date.now())}</span>
            </div>
            <p class="timeout-until">해제 시각: <strong>${fmtUntil(until)}</strong></p>
            <p class="timeout-hint">홈, 시간표, 바로가기는 이용할 수 있습니다.</p>
        </div>
    </div>`;
}

function render() {
    const app = document.getElementById('app');
    updateNav();
    applyTheme(getTheme());

    if (isLoggedIn() && isBanned() && BANNED_RESTRICTED.includes(currentPage)) {
        app.innerHTML = renderBannedPage();
        return;
    }

    if (isLoggedIn() && isTimedOut() && TIMEOUT_RESTRICTED.includes(currentPage)) {
        app.innerHTML = renderTimedOutPage();
        return;
    }

    switch (currentPage) {
        case 'home':         app.innerHTML = renderHome();              break;
        case 'board':        app.innerHTML = renderBoard();             break;
        case 'board-detail': app.innerHTML = renderPostDetail('board'); break;
        case 'board-write':  app.innerHTML = renderPostWrite('board');  break;
        case 'timetable':    app.innerHTML = renderTimetable();         break;
        case 'academic':     renderAcademicCalendar();                  break;
        case 'votes':        app.innerHTML = renderVotes();             break;
        case 'vote-detail':  app.innerHTML = renderVoteDetail();        break;
        case 'vote-create':  app.innerHTML = renderVoteCreate();        break;
        case 'dday':         app.innerHTML = renderDday();              break;
        case 'chat':         app.innerHTML = renderChat();              break;
        case 'links':        app.innerHTML = renderLinks();             break;
        case 'suggestion':   app.innerHTML = renderSuggestion();       break;
        // case 'seat-draw':    app.innerHTML = renderSeatDraw();          break;
        case 'lunch':        app.innerHTML = renderLunch(); setTimeout(() => loadLunchPageWithAutoScroll(), 0); break;
        case 'cleaning':     app.innerHTML = renderCleaning(); break;
        case 'map':          app.innerHTML = renderMap(); setTimeout(() => initMapPage(), 0); break;
        default:             app.innerHTML = renderHome();
    }
}

function updateNav() {
    const authDiv = document.getElementById('navAuth');
    authDiv.innerHTML = '';
    const mobileSection = document.getElementById('navMenuUserSection');
    if (mobileSection) mobileSection.style.display = 'none';

    const loggedIn = isLoggedIn();
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('guest-mode', !loggedIn);

    document.querySelectorAll('.nav-menu li').forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;
        const p = a.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
        const guestHidden = [];
        li.style.display = (!loggedIn && guestHidden.includes(p)) ? 'none' : '';
        a.classList.remove('active');
        if (p === currentPage ||
            (p === 'board'     && currentPage.startsWith('board'))  ||
            (p === 'votes'     && currentPage.startsWith('vote'))   ||
            (p === 'links'     && currentPage === 'links')          ||
            (p === 'dday'      && currentPage === 'dday')  ||
            (p === 'lunch'     && currentPage === 'lunch')  ||
            (p === 'academic'  && currentPage === 'academic')  ||
            (p === 'weather'   && currentPage === 'weather') ||
            (p === 'cleaning'  && currentPage === 'cleaning')) {
            a.classList.add('active');
        }
    });
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const btn  = document.getElementById('hamburger');
    console.log('[DEBUG] toggleMenu called. Menu found:', !!menu, 'Button found:', !!btn);

    let backdrop = document.getElementById('menuBackdrop');
    if (!backdrop) {
        console.log('[DEBUG] Creating backdrop');
        backdrop = document.createElement('div');
        backdrop.id = 'menuBackdrop';
        backdrop.className = 'menu-backdrop';
        backdrop.onclick = () => {
            menu.classList.remove('active');
            btn && btn.classList.remove('active');
            btn && btn.setAttribute('aria-expanded', 'false');
            btn && btn.setAttribute('aria-label', '메뉴 열기');
            backdrop.classList.remove('active');
        };
        document.body.appendChild(backdrop);
    }
    console.log('[DEBUG] Before toggle. Menu has "active":', menu && menu.classList.contains('active'));
    menu.classList.toggle('active');
    btn && btn.classList.toggle('active');
    backdrop.classList.toggle('active');
    const isOpen = menu.classList.contains('active');
    console.log('[DEBUG] After toggle. Menu now has "active":', isOpen);
    btn && btn.setAttribute('aria-expanded', isOpen);
    btn && btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
}

// 스크롤 감지
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });
