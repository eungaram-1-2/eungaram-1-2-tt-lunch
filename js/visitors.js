// =============================================
// 방문자 카운터
// =============================================

function _visitTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function _visitWeekStart() {
    const now = new Date();
    const day = now.getDay();                 // 0=일, 1=월 ...
    const diff = day === 0 ? 6 : day - 1;    // 월요일 기준
    const mon = new Date(now);
    mon.setDate(now.getDate() - diff);
    return `${mon.getFullYear()}-${String(mon.getMonth()+1).padStart(2,'0')}-${String(mon.getDate()).padStart(2,'0')}`;
}

function _visitMonthStart() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
}

function _visitYearStart() {
    return `${new Date().getFullYear()}-01-01`;
}

function trackVisit() {
    const today = _visitTodayKey();
    const dedupKey = `visit_sess_${today}`;

    // 같은 세션에서 이미 카운트했으면 표시만 갱신
    if (sessionStorage.getItem(dedupKey)) {
        loadVisitorCounts();
        return;
    }
    sessionStorage.setItem(dedupKey, '1');

    if (fbReady()) {
        _fbDB.ref(`visitors/${today}`).transaction(v => (v || 0) + 1,
            (err) => { if (!err) loadVisitorCounts(); }
        );
    } else {
        const lsKey = `vis_${today}`;
        localStorage.setItem(lsKey, (parseInt(localStorage.getItem(lsKey) || '0') + 1));
        loadVisitorCounts();
    }
}

async function loadVisitorCounts() {
    const today      = _visitTodayKey();
    const weekStart  = _visitWeekStart();
    const monthStart = _visitMonthStart();
    const yearStart  = _visitYearStart();

    let c = { today: 0, week: 0, month: 0, year: 0 };

    if (fbReady()) {
        try {
            const snap = await _fbDB.ref('visitors')
                .orderByKey().startAt(yearStart).endAt(today).once('value');
            (snap.val() ? Object.entries(snap.val()) : []).forEach(([d, n]) => {
                const v = parseInt(n) || 0;
                if (d === today)      c.today += v;
                if (d >= weekStart)   c.week  += v;
                if (d >= monthStart)  c.month += v;
                c.year += v;
            });
        } catch (e) {
            console.warn('[Visitors] 읽기 실패:', e);
        }
    } else {
        Object.keys(localStorage).forEach(k => {
            if (!k.startsWith('vis_')) return;
            const d = k.slice(4);
            const v = parseInt(localStorage.getItem(k)) || 0;
            if (d === today)     c.today += v;
            if (d >= weekStart)  c.week  += v;
            if (d >= monthStart) c.month += v;
            if (d >= yearStart)  c.year  += v;
        });
    }

    _renderVisitorStats(c);
}

function _renderVisitorStats(c) {
    const el = document.getElementById('visitorStats');
    if (!el) return;
    const fmt = n => n.toLocaleString('ko-KR');
    el.innerHTML = `
        <div class="visitor-wrap">
            <span class="visitor-label-head">👁 방문자</span>
            <div class="visitor-items">
                <div class="visitor-item">
                    <span class="visitor-period">오늘</span>
                    <span class="visitor-num">${fmt(c.today)}</span>
                </div>
                <div class="visitor-sep"></div>
                <div class="visitor-item">
                    <span class="visitor-period">이번 주</span>
                    <span class="visitor-num">${fmt(c.week)}</span>
                </div>
                <div class="visitor-sep"></div>
                <div class="visitor-item">
                    <span class="visitor-period">이번 달</span>
                    <span class="visitor-num">${fmt(c.month)}</span>
                </div>
                <div class="visitor-sep"></div>
                <div class="visitor-item">
                    <span class="visitor-period">올해</span>
                    <span class="visitor-num">${fmt(c.year)}</span>
                </div>
            </div>
        </div>`;
}
