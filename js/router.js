// =============================================
// 라우터
// =============================================
let currentPage = 'home';
let pageParams  = {};

function navigate(page, params = {}) {
    if (!RateLimit.check('navigate')) return;
    if (typeof _adminUnlisten === 'function') {
        _adminUnlisten();
        _adminUnlisten = null;
    }
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

const BANNED_RESTRICTED   = ['board','board-detail','board-write','dday','logs','boardlog'];
const TIMEOUT_RESTRICTED  = ['board','board-detail','board-write','dday','notices','notice-detail','notice-write','votes','vote-detail','vote-create','logs','boardlog'];
const GUEST_ALLOWED       = ['home','login','timetable','lunch','academic'];

function renderLoginRequiredPage() {
    return `
    <div class="page">
        <div class="empty-state">
            <div class="empty-icon">🔒</div>
            <p style="font-weight:700;font-size:1rem">로그인이 필요합니다.</p>
            <p style="font-size:0.85rem;margin-top:8px;color:var(--text-muted)">시간표는 로그인 없이 볼 수 있습니다.</p>
            <button class="btn btn-primary" style="margin-top:18px" onclick="navigate('login')">로그인하기</button>
        </div>
    </div>`;
}

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

    if (!isLoggedIn() && !GUEST_ALLOWED.includes(currentPage)) {
        app.innerHTML = renderLoginRequiredPage();
        return;
    }

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
        case 'login':        app.innerHTML = renderLogin();             break;
        case 'notices':      app.innerHTML = renderNotices();           break;
        case 'notice-detail':app.innerHTML = renderPostDetail('notices'); break;
        case 'notice-write': app.innerHTML = renderPostWrite('notices'); break;
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
        // case 'seat-draw':    app.innerHTML = renderSeatDraw();          break;
        case 'change-password': app.innerHTML = renderChangePassword(); break;
        case 'lunch':        app.innerHTML = renderLunch(); setTimeout(() => loadLunchPage(), 0); break;
        case 'admin':        app.innerHTML = renderAdmin();             break;
        case 'logs':         app.innerHTML = renderLogs();              break;
        case 'boardlog':     app.innerHTML = renderBoardLog();          break;
        default:             app.innerHTML = renderHome();
    }
}

function updateNav() {
    const authDiv = document.getElementById('navAuth');
    const user    = currentUser();

    if (user) {
        const bc = user.role === 'admin' ? 'badge-admin' : 'badge-user';
        const bt = user.role === 'admin' ? '관리자' : '학생';
        const banBadge = isBanned() ? `<span class="badge-banned" style="font-size:0.68rem">정지됨</span>` : '';
        const adminBtn = user.role === 'admin'
            ? `<button class="btn btn-outline btn-sm" onclick="navigate('admin')" style="border-color:var(--primary);color:var(--primary);font-size:0.78rem">⚙️ 관리자</button>`
            : '';
        // 데스크탑: 배지 + 닉네임 + 관리자버튼 + 로그아웃 모두 표시
        authDiv.innerHTML = `
            <div class="user-info">
                <span class="user-badge ${bc}">${bt}</span>
                ${banBadge}
                <span class="nav-user-nick">${escapeHtml(user.nickname)}</span>
                <span class="nav-auth-desktop">${adminBtn}
                    <button class="btn btn-ghost btn-sm" onclick="navigate('change-password')">🔑 비번변경</button>
                    <button class="btn btn-ghost btn-sm" onclick="logout()">로그아웃</button>
                </span>
            </div>`;
        // 모바일 햄버거 메뉴: 구분선 + 관리자 + 로그아웃
        const mobileSection = document.getElementById('navMenuUserSection');
        if (mobileSection) {
            mobileSection.style.display = '';
            mobileSection.innerHTML = `
                <div class="nav-menu-divider"></div>
                <span class="nav-menu-user-label">${escapeHtml(user.nickname)} (${bt})</span>
                ${user.role === 'admin' ? `<a href="#" onclick="navigate('admin')">⚙️ 관리자 대시보드</a>` : ''}
                <a href="#" onclick="navigate('change-password')">🔑 비밀번호 변경</a>
                <a href="#" onclick="logout()">🚪 로그아웃</a>`;
        }
    } else {
        authDiv.innerHTML = `<button class="btn btn-primary btn-sm" onclick="navigate('login')">로그인</button>`;
        const mobileSection = document.getElementById('navMenuUserSection');
        if (mobileSection) mobileSection.style.display = 'none';
    }

    const loggedIn = isLoggedIn();
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('guest-mode', !loggedIn);

    document.querySelectorAll('.nav-menu li').forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;
        const p = a.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
        // 비로그인 시 시간표, 급식, 학사일정만 표시
        li.style.display = (!loggedIn && p !== 'timetable' && p !== 'lunch' && p !== 'academic') ? 'none' : '';
        a.classList.remove('active');
        if (p === currentPage ||
            (p === 'notices'   && currentPage.startsWith('notice')) ||
            (p === 'board'     && (currentPage.startsWith('board') || currentPage === 'boardlog'))  ||
            (p === 'votes'     && currentPage.startsWith('vote'))   ||
            (p === 'links'     && currentPage === 'links')          ||
            (p === 'dday'      && currentPage === 'dday')  ||
            (p === 'lunch'     && currentPage === 'lunch')  ||
            (p === 'academic'  && currentPage === 'academic')  ||
            (p === 'admin'     && (currentPage === 'admin' || currentPage === 'logs'))) {
            a.classList.add('active');
        }
    });
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const btn  = document.getElementById('hamburger');
    let backdrop = document.getElementById('menuBackdrop');
    if (!backdrop) {
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
    menu.classList.toggle('active');
    btn && btn.classList.toggle('active');
    backdrop.classList.toggle('active');
    const isOpen = menu.classList.contains('active');
    btn && btn.setAttribute('aria-expanded', isOpen);
    btn && btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
}

// 스크롤 감지
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });
