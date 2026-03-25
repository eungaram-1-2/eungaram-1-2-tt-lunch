// =============================================
// 급식 메뉴 (CORS 프록시 경유 스크래핑)
// =============================================
const LUNCH_SCHOOL_URL = 'https://eungaram-m.goegh.kr/eungaram-m/ad/fm/foodmenu/selectFoodMenuView.do?mi=8056';
const LUNCH_PROXIES    = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/get?url='
];

function _lunchTodayStr() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

// td에서 메뉴 아이템 추출
function _extractMenuFromTd(td) {
    const clone = td.cloneNode(true);
    clone.querySelectorAll('a').forEach(a => a.remove());
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

    return clone.textContent
        .split('\n')
        .map(line => {
            line = line.trim();
            if (line.includes('상세보기')) return null;
            line = line.replace(/\([\d.]+\)/g, '');
            line = line.replace(/\([가-힣]{1,3}\)/g, '');
            line = line.replace(/[\d.]+\s*Kcal/gi, '');
            line = line.replace(/\d{4}-\d{2}-\d{2}/g, '');
            line = line.replace(/[월화수목금토일]\s*/g, '');
            line = line.replace(/\[.*?\]/g, '');
            line = line.trim();
            return line.length > 0 ? line : null;
        })
        .filter(Boolean);
}

// 특정 날짜 문자열로 메뉴 td 찾기
function _findMenuTdByDate(doc, dateStr) {
    let dateTd = null;
    for (const td of doc.querySelectorAll('td, th')) {
        if (td.textContent.includes(dateStr)) {
            dateTd = td;
            break;
        }
    }
    if (!dateTd) return null;

    const tr     = dateTd.closest('tr');
    const rowTds = tr ? Array.from(tr.querySelectorAll('td, th')) : [];

    // 같은 행에서 br이 많은 td
    let menuTd = null;
    let maxBr  = 0;
    for (const td of rowTds) {
        const brs = td.querySelectorAll('br').length;
        if (brs > maxBr) { maxBr = brs; menuTd = td; }
    }

    // br 없으면 다음 행에서 같은 열
    if (!menuTd || maxBr < 2) {
        const table  = dateTd.closest('table');
        const rows   = table ? Array.from(table.querySelectorAll('tr')) : [];
        const colIdx = rowTds.indexOf(dateTd);
        for (let i = rows.indexOf(tr) + 1; i < rows.length; i++) {
            const tds = rows[i].querySelectorAll('td, th');
            if (colIdx < tds.length && tds[colIdx].querySelectorAll('br').length >= 2) {
                menuTd = tds[colIdx];
                break;
            }
        }
    }

    return menuTd || null;
}

// =============================================
// HTML 한 번만 가져오기 (공유 캐시)
// =============================================
let _rawHtmlPromise = null;

function _fetchRawHtml() {
    if (_rawHtmlPromise) return _rawHtmlPromise;

    _rawHtmlPromise = (async () => {
        for (let i = 0; i < LUNCH_PROXIES.length; i++) {
            try {
                const proxy = LUNCH_PROXIES[i];
                let fetchUrl, parseResponse;

                if (proxy.includes('allorigins')) {
                    fetchUrl = proxy + encodeURIComponent(LUNCH_SCHOOL_URL);
                    parseResponse = (res) => res.json().then(json => json.contents || '');
                } else {
                    fetchUrl = proxy + LUNCH_SCHOOL_URL;
                    parseResponse = (res) => res.text();
                }

                const res = await fetch(fetchUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const html = await parseResponse(res);
                if (html && html.length > 100) return html;
            } catch (e) {
                console.warn(`프록시 ${i+1}/${LUNCH_PROXIES.length} 실패:`, e.message);
            }
        }
        console.warn('모든 프록시 실패, 오프라인 모드');
        return '';
    })();

    return _rawHtmlPromise;
}

// =============================================
// 오늘의 급식 (홈 위젯용)
// =============================================
let _todayMenuPromise = null;

async function fetchLunchMenu() {
    if (_todayMenuPromise) return _todayMenuPromise;

    const todayStr = _lunchTodayStr();
    const cacheKey = `lunch_${todayStr}`;
    const cached   = localStorage.getItem(cacheKey);
    if (cached) {
        _todayMenuPromise = Promise.resolve(JSON.parse(cached));
        return _todayMenuPromise;
    }

    _todayMenuPromise = _fetchRawHtml().then(html => {
        if (!html) return null;
        const doc    = new DOMParser().parseFromString(html, 'text/html');
        const menuTd = _findMenuTdByDate(doc, todayStr);
        if (!menuTd) return null;

        const items  = _extractMenuFromTd(menuTd);
        const kcalM  = menuTd.textContent.match(/([\d.]+)\s*Kcal/i);
        const kcal   = kcalM ? kcalM[1] : null;
        if (!items.length) return null;

        const menu = { items, kcal, date: todayStr };
        localStorage.setItem(cacheKey, JSON.stringify(menu));

        // 어제 캐시 정리
        const yesterday = new Date(Date.now() - 86400000);
        const yp = n => String(n).padStart(2, '0');
        localStorage.removeItem(`lunch_${yesterday.getFullYear()}-${yp(yesterday.getMonth()+1)}-${yp(yesterday.getDate())}`);

        return menu;
    });

    return _todayMenuPromise;
}

// =============================================
// 주간 급식 (전체보기용) — HTML 1번만 요청
// =============================================
async function fetchWeeklyLunch() {
    const dayNames  = ['일','월','화','수','목','금','토'];
    const today     = new Date();
    const dayOfWeek = today.getDay();

    // 이번 주 월요일
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

    // 월~금 날짜 목록
    const p = n => String(n).padStart(2, '0');
    const weekDays = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            date:        `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`,
            displayDate: `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())}`,
            day:         dayNames[d.getDay()],
            items:       [],
            kcal:        null
        };
    });

    // HTML 한 번만 가져오기
    const html = await _fetchRawHtml();
    if (!html) return weekDays;

    const doc = new DOMParser().parseFromString(html, 'text/html');

    // 각 날짜별로 메뉴 추출
    for (const dayData of weekDays) {
        const menuTd = _findMenuTdByDate(doc, dayData.date);
        if (!menuTd) continue;

        dayData.items = _extractMenuFromTd(menuTd);
        const kcalM   = menuTd.textContent.match(/([\d.]+)\s*Kcal/i);
        dayData.kcal  = kcalM ? kcalM[1] : null;
    }

    return weekDays;
}

// 스크립트 로드 시 즉시 프리패치
_fetchRawHtml();
fetchLunchMenu();

// =============================================
// 홈 화면용 급식 위젯
// =============================================
function renderLunchWidget() {
    return `
    <div class="lunch-widget" id="lunchWidget">
        <div class="lunch-widget-header">
            <span class="lunch-icon">🍱</span>
            <div>
                <h3>오늘의 급식</h3>
                <p class="lunch-date" id="lunchDate"></p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="navigate('lunch')" style="margin-left:auto">전체보기</button>
        </div>
        <div class="lunch-widget-body" id="lunchWidgetBody">
            <div class="lunch-loading">
                <span class="lunch-spinner"></span>
                <span>급식 정보 불러오는 중...</span>
            </div>
        </div>
    </div>`;
}

async function loadLunchWidget() {
    const body   = document.getElementById('lunchWidgetBody');
    const dateEl = document.getElementById('lunchDate');
    if (!body) return;

    const menu  = await fetchLunchMenu();
    const today = new Date();
    const days  = ['일','월','화','수','목','금','토'];
    const p     = n => String(n).padStart(2, '0');

    if (dateEl) {
        dateEl.textContent = `${today.getFullYear()}.${p(today.getMonth()+1)}.${p(today.getDate())} (${days[today.getDay()]})`;
    }

    if (!menu) {
        body.innerHTML = `<div class="lunch-empty">🚫 오늘은 급식이 없거나 정보를 불러올 수 없습니다.</div>`;
        return;
    }

    const kcalBadge = menu.kcal ? `<span class="lunch-kcal">${menu.kcal} kcal</span>` : '';
    const itemsHtml = menu.items.map(item =>
        `<li class="lunch-item">${escapeHtml(item)}</li>`
    ).join('');

    body.innerHTML = `
        ${kcalBadge}
        <ul class="lunch-list">${itemsHtml}</ul>`;
}

// =============================================
// 전용 급식 페이지 (주간 테이블)
// =============================================
function renderLunch() {
    return `
    <div class="page">
        <div class="page-header">
            <h2>🍱 이번 주 급식</h2>
            <p>은가람 중학교</p>
        </div>
        <div class="container" style="max-width:900px;margin:0 auto;padding:0 20px 60px">
            <div class="lunch-page-card" id="lunchPageCard">
                <div class="lunch-loading">
                    <span class="lunch-spinner"></span>
                    <span>급식 정보 불러오는 중...</span>
                </div>
            </div>
            <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:20px">
                출처: <a href="${LUNCH_SCHOOL_URL}" target="_blank" rel="noopener noreferrer" style="color:var(--primary)">은가람 중학교 공식 홈페이지</a>
            </p>
        </div>
    </div>`;
}

async function loadLunchPage() {
    const card = document.getElementById('lunchPageCard');
    if (!card) return;

    const weeklyData = await fetchWeeklyLunch();
    const hasAny = weeklyData.some(d => d.items.length > 0);

    if (!hasAny) {
        card.innerHTML = `
            <div class="lunch-empty" style="padding:48px 24px;text-align:center">
                <div style="font-size:3rem;margin-bottom:16px">🚫</div>
                <p style="font-weight:600;font-size:1rem">급식 정보를 불러올 수 없습니다.</p>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px">방학, 공휴일, 또는 네트워크 오류일 수 있습니다.</p>
            </div>`;
        return;
    }

    const maxItems = Math.max(...weeklyData.map(d => d.items.length), 1);

    const headerHtml = `
        <tr>
            <th style="width:44px"></th>
            ${weeklyData.map(day => `
                <th class="lunch-table-header-cell">
                    <strong>${day.day}</strong><br>
                    <span style="font-size:0.72rem;color:var(--text-muted)">${day.displayDate}</span>
                </th>`).join('')}
        </tr>`;

    const menuRows = Array.from({ length: maxItems }).map((_, idx) => {
        const cells = weeklyData.map(day => {
            const item = day.items[idx] || '';
            return `<td class="lunch-table-item-cell">${item ? escapeHtml(item) : '<span style="color:var(--text-muted)">-</span>'}</td>`;
        }).join('');
        return `<tr><td class="lunch-table-num">${idx + 1}</td>${cells}</tr>`;
    }).join('');

    const kcalRow = `
        <tr class="lunch-table-kcal-row">
            <td class="lunch-table-num">🔥</td>
            ${weeklyData.map(day => `
                <td class="lunch-table-item-cell">
                    ${day.kcal ? `<strong>${day.kcal} kcal</strong>` : '<span style="color:var(--text-muted)">-</span>'}
                </td>`).join('')}
        </tr>`;

    card.innerHTML = `
        <div class="lunch-table-wrapper">
            <table class="lunch-table-horizontal">
                <thead>${headerHtml}</thead>
                <tbody>${menuRows}${kcalRow}</tbody>
            </table>
        </div>`;
}
