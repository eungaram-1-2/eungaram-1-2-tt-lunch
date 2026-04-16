// =============================================
// 홈 페이지
// =============================================
function renderHome() {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const todayDow = dayNames[new Date().getDay()];

    // ── D-Day 데이터 ──
    const upcomingDdays = DB.get('ddays')
        .filter(d => new Date(d.date + 'T00:00:00') >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    let ddayStripItems = '';
    if (upcomingDdays.length > 0) {
        ddayStripItems = upcomingDdays.map(d => {
            const diff = calcDday(d.date);
            const label = formatDdayLabel(diff);
            let cls = 'dday-chip-normal';
            if (diff === 0) cls = 'dday-chip-today';
            else if (diff <= 3) cls = 'dday-chip-urgent';
            else if (diff <= 7) cls = 'dday-chip-soon';
            return `<div class="dday-chip ${cls}" onclick="navigate('dday')">
                <span>${d.emoji || '📌'}</span>
                <strong>${escapeHtml(d.title)}</strong>
                <span class="dday-chip-label">${label}</span>
            </div>`;
        }).join('');
    }
    const ddayStrip = ddayStripItems
        ? `<div class="dday-strip"><div class="dday-banner">${ddayStripItems}</div></div>`
        : '';

    // ── 사이드바 D-Day 목록 ──
    let sideDdayItems = '';
    if (upcomingDdays.length > 0) {
        sideDdayItems = upcomingDdays.slice(0, 4).map(d => {
            const diff = calcDday(d.date);
            const label = formatDdayLabel(diff);
            let badgeBg = 'rgba(79,70,229,0.1)'; let badgeColor = 'var(--primary)';
            if (diff === 0) { badgeBg = 'rgba(239,68,68,0.12)'; badgeColor = '#ef4444'; }
            else if (diff <= 3) { badgeBg = 'rgba(245,158,11,0.12)'; badgeColor = '#d97706'; }
            else if (diff <= 7) { badgeBg = 'rgba(6,182,212,0.12)'; badgeColor = '#0891b2'; }
            return `<div class="side-dday-item">
                <span class="side-dday-label">${d.emoji || '📌'} ${escapeHtml(d.title)}</span>
                <span class="side-dday-badge" style="background:${badgeBg};color:${badgeColor}">${label}</span>
            </div>`;
        }).join('');
    } else {
        sideDdayItems = `<p style="font-size:0.82rem;color:var(--text-muted);padding:8px 0">등록된 D-Day가 없습니다.</p>`;
    }

    // ── 급식 위젯 ──
    const lunchHtml = renderLunchWidget();
    setTimeout(() => loadLunchWidget(), 0);

    setTimeout(() => { _initHeroCanvas(); _initHeroClock(); }, 0);

    return `
    <div class="hero">
        <canvas class="hero-canvas" id="heroCanvas"></canvas>
        <div class="hero-blob hero-blob-1"></div>
        <div class="hero-blob hero-blob-2"></div>
        <div class="hero-blob hero-blob-3"></div>
        <div class="hero-blob hero-blob-4"></div>
        <div class="hero-grid"></div>

        <div class="hero-inner">
            <div class="hero-content">
                <div class="hero-badge">🏫 은가람 중학교 1학년 2반</div>
                <h1>서로 배우고<br><span class="highlight">함께 성장하는</span><br>공동체</h1>
                <p>급식·시간표·학사일정을 한 곳에서 확인하세요</p>
                <div class="hero-clock" id="heroClock"></div>
                <div class="hero-btn-row">
                    <button class="hero-btn hero-btn-primary" onclick="navigate('lunch')">🍴 오늘 급식</button>
                    <button class="hero-btn hero-btn-outline" onclick="navigate('timetable')">📅 시간표</button>
                </div>
            </div>
            <div class="hero-orb-visual" aria-hidden="true"></div>
        </div>

        <div class="hero-stats-bar">
            <div class="hero-stat">
                <span class="hero-stat-num">1·2</span>
                <span class="hero-stat-label">학년·반</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
                <span class="hero-stat-num">7</span>
                <span class="hero-stat-label">교시 / 일</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
                <span class="hero-stat-num">5</span>
                <span class="hero-stat-label">주요 기능</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
                <span class="hero-stat-num">2026</span>
                <span class="hero-stat-label">학년도</span>
            </div>
        </div>
    </div>

    ${ddayStrip}

    <div class="home-quick-bar">
        <div class="quick-pill" onclick="navigate('timetable')">
            <span class="quick-pill-icon">📅</span><span>시간표</span>
        </div>
        <div class="quick-pill" onclick="navigate('academic')">
            <span class="quick-pill-icon">🗓️</span><span>학사일정</span>
        </div>
        <div class="quick-pill" onclick="navigate('lunch')">
            <span class="quick-pill-icon">🍱</span><span>급식</span>
        </div>
        <!-- <div class="quick-pill" onclick="navigate('suggestion')">
            <span class="quick-pill-icon">📮</span><span>건의함/신고함</span>
        </div> -->
        <!-- <div class="quick-pill" onclick="navigate('board')">
            <span class="quick-pill-icon">💬</span><span>게시판</span>
        </div>
        <div class="quick-pill" onclick="navigate('dday')">
            <span class="quick-pill-icon">⏰</span><span>D-Day</span>
        </div>
        <div class="quick-pill" onclick="navigate('votes')">
            <span class="quick-pill-icon">🗳️</span><span>투표</span>
        </div> -->
        <div class="quick-pill" onclick="navigate('links')">
            <span class="quick-pill-icon">🔗</span><span>바로가기</span>
        </div>
    </div>

    <div style="max-width:1160px;margin:0 auto;padding:0 20px">
        ${lunchHtml}
    </div>

    <div class="features" style="padding-top:48px">
        <div class="section-header">
            <h2>주요 기능</h2>
            <p>학급 운영에 필요한 모든 기능을 제공합니다</p>
        </div>
        <div class="feature-mosaic" style="max-width:1160px;margin:0 auto;padding:0 20px">
            <div class="feature-card" onclick="navigate('timetable')">
                <div class="feature-card-inner">
                    <div class="feature-icon">📅</div>
                    <h3>스마트 시간표</h3>
                    <p>오늘 수업을<br>한눈에.</p>
                </div>
            </div>
            <div class="feature-card" onclick="navigate('lunch')">
                <div class="feature-card-inner">
                    <div class="feature-icon">🍱</div>
                    <h3>오늘의 급식</h3>
                    <p>매일 업데이트되는<br>식단 정보.</p>
                </div>
            </div>
            <div class="feature-card" onclick="navigate('academic')">
                <div class="feature-card-inner">
                    <div class="feature-icon">🗓️</div>
                    <h3>학사일정</h3>
                    <p>학교 주요 일정을<br>한눈에 확인.</p>
                </div>
            </div>
            <div class="feature-card" onclick="navigate('links')">
                <div class="feature-card-inner">
                    <div class="feature-icon">🔗</div>
                    <h3>바로가기</h3>
                    <p>자주 쓰는 링크를<br>한 곳에서.</p>
                </div>
            </div>
            <!-- <div class="feature-card" onclick="navigate('board')">
                <div class="feature-card-inner">
                    <div class="feature-icon">💬</div>
                    <h3>자유게시판</h3>
                    <p>친구들과<br>자유롭게 소통.</p>
                </div>
            </div>
            <div class="feature-card" onclick="navigate('votes')">
                <div class="feature-card-inner">
                    <div class="feature-icon">🗳️</div>
                    <h3>투표 &amp; 설문</h3>
                    <p>공정한<br>학급 의사결정.</p>
                </div>
            </div>
            <div class="feature-card" onclick="isLoggedIn() ? navigate('chat') : navigate('login')">
                <div class="feature-card-inner">
                    <div class="feature-icon">💭</div>
                    <h3>실시간 채팅</h3>
                    <p>친구들과<br>즉시 소통.</p>
                </div>
            </div>
            <div class="feature-card" onclick="window.open('https://docs.google.com/forms/u/0/d/e/1FAIpQLSc1s4oIvfvoT_GbvdFU95ZglDqYvsfngXrwZOaiaeDDC2NsiA/formResponse','_blank')">
                <div class="feature-card-inner">
                    <div class="feature-icon">📮</div>
                    <h3>건의함</h3>
                    <p>의견을<br>자유롭게 제출.</p>
                </div>
            </div> -->
        </div>
    </div>

    <!-- <div class="school-info-section">
        <div class="section-header">
            <h2>🏫 은가람 중학교 소개</h2>
            <p>우리 학교를 소개합니다</p>
        </div>

        <div class="school-motto-card">
            <div class="school-motto-badge">교훈</div>
            <div class="school-motto-text">지혜 · 사랑 · 열정</div>
        </div>

        <div class="school-info-list">
            <div class="school-info-item">
                <div class="school-info-img-wrap" style="border-color:#7c3aed">
                    <img src="assets/logo.svg" alt="교표" class="school-info-img">
                </div>
                <div class="school-info-body">
                    <div class="school-info-badge" style="background:#7c3aed">교표</div>
                    <ul class="school-info-bullets" style="--dot:#7c3aed">
                        <li>지구를 표현하는 원안에 책으로 쌓아올린 나무는 은가람중학교의 교목인 소나무를 상징함</li>
                        <li>테두리의 보라색의 원은 은가람중학교의 교화인 라일락을 상징하는 색으로 교목과 교화가 어우러져 화합과 협동을 추구함</li>
                    </ul>
                </div>
            </div>

            <div class="school-info-item">
                <div class="school-info-img-wrap" style="border-color:#16a34a">
                    <div class="school-info-emoji">🌲</div>
                </div>
                <div class="school-info-body">
                    <div class="school-info-badge" style="background:#16a34a">교목</div>
                    <ul class="school-info-bullets" style="--dot:#16a34a">
                        <li>소나무를 우리말로는 '솔'이라고 하는데 높고 으뜸이라는 의미를 가짐.</li>
                        <li>사계절 늘 푸른 침엽수로 정직 인내 번영을 상징하며 소나무의 기상과 같이 높은 꿈과 이상을 지니길 바라는 의미</li>
                    </ul>
                </div>
            </div>

            <div class="school-info-item">
                <div class="school-info-img-wrap" style="border-color:#e11d48">
                    <div class="school-info-emoji">🌸</div>
                </div>
                <div class="school-info-body">
                    <div class="school-info-badge" style="background:#e11d48">교화</div>
                    <ul class="school-info-bullets" style="--dot:#e11d48">
                        <li>라일락의 많은 꽃이 모여 아름다움을 나타냄은 협동단결의 표상이며 겸손을 지닌 향기로운 청소년으로서 사랑받은 인간상을 추구함.</li>
                        <li>라일락의 꽃말은 '젊은날의추억'임. 달콤하고 은은하며 품위있는 향기를 지녔으며 꿈과 희망을 안겨주는 꽃임</li>
                    </ul>
                </div>
            </div>
        </div>
    </div> -->`;
}

// =============================================
// 히어로 캔버스 파티클
// =============================================
let _heroAnimId = null;

function _initHeroCanvas() {
    if (_heroAnimId) { cancelAnimationFrame(_heroAnimId); _heroAnimId = null; }

    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;

    function resize() {
        canvas.width  = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }
    resize();

    const COUNT = 90;
    const particles = Array.from({ length: COUNT }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.6 + 0.3,
        speed: Math.random() * 0.35 + 0.08,
        drift: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.6 + 0.2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.025 + 0.008,
    }));

    // 반짝이는 별 레이어 (크고 밝음)
    const stars = Array.from({ length: 18 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.2 + 0.8,
        alpha: Math.random(),
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.04 + 0.015,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        // 라이트: 황금빛/흰색  /  다크: 청백/보라
        const dustColor  = isDark ? '200, 220, 255' : '255, 240, 210';
        const starColor1 = isDark ? '255, 255, 255'  : '255, 255, 255';
        const starColor2 = isDark ? '160, 200, 255'  : '255, 200, 120';

        // 파티클 (떠오르는 먼지)
        for (const p of particles) {
            p.pulse += p.pulseSpeed;
            const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${dustColor}, ${a})`;
            ctx.fill();

            p.y -= p.speed;
            p.x += p.drift;
            if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
            if (p.x < -5 || p.x > canvas.width + 5) p.x = Math.random() * canvas.width;
        }

        // 별 (반짝임)
        for (const s of stars) {
            s.pulse += s.pulseSpeed;
            const a = 0.3 + 0.7 * ((Math.sin(s.pulse) + 1) / 2);
            const size = s.r * (0.7 + 0.5 * ((Math.sin(s.pulse * 0.7) + 1) / 2));

            const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 3);
            grad.addColorStop(0, `rgba(${starColor1}, ${a})`);
            grad.addColorStop(1, `rgba(${starColor2}, 0)`);
            ctx.beginPath();
            ctx.arc(s.x, s.y, size * 3, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }

        _heroAnimId = requestAnimationFrame(draw);
    }

    draw();

    // 히어로 영역 벗어나면 중단
    const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) {
            cancelAnimationFrame(_heroAnimId);
            _heroAnimId = null;
            obs.disconnect();
        }
    });
    obs.observe(hero);

    window.addEventListener('resize', resize, { passive: true });
}

// =============================================
// 히어로 실시간 시계
// =============================================
let _heroClockTimer = null;

function _initHeroClock() {
    if (_heroClockTimer) { clearInterval(_heroClockTimer); _heroClockTimer = null; }
    const el = document.getElementById('heroClock');
    if (!el) return;

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    function tick() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const dow = dayNames[now.getDay()];
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const clockEl = document.getElementById('heroClock');
        if (clockEl) {
            clockEl.textContent = `${y}.${m}.${d} (${dow}) ${hh}:${mm}:${ss}`;
        } else {
            clearInterval(_heroClockTimer);
            _heroClockTimer = null;
        }
    }
    tick();
    _heroClockTimer = setInterval(tick, 1000);
}
