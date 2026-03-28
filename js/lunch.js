// =============================================
// 급식 메뉴 (GitHub Actions 크롤링)
// =============================================
const LUNCH_DATA_URL = 'data/lunch.json';

// 음식명에서 알레르기 정보 파싱 및 포맷팅
function cleanMenuItem(text) {
    if (!text) return '';
    // 알레르기 번호 파싱: (1.5.6.10) 형태
    const allergenMatch = text.match(/\(([\d.]+)\)/);
    const allergenNums = allergenMatch
        ? allergenMatch[1].split('.').map(Number).filter(n => ALLERGEN_MAP[n]).sort((a, b) => a - b)
        : [];
    // 알레르기 번호 및 크기 표시 제거
    const name = text.replace(/\([\d.]+\)/g, '').replace(/\([가-힣]+\)/g, '').trim();
    if (!name) return '';
    const allergenHtml = allergenNums.length
        ? `<span class="allergen-list" title="${allergenNums.map(n => `${n}.${ALLERGEN_MAP[n]}`).join(', ')}">${allergenNums.join('·')}</span>`
        : '';
    return `${name}${allergenHtml}`;
}

function _lunchTodayStr() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

// =============================================
// 급식 데이터 JSON 로드
// =============================================
let _lunchDataPromise = null;

async function _fetchLunchData() {
    if (_lunchDataPromise) return _lunchDataPromise;

    _lunchDataPromise = (async () => {
        try {
            const res = await fetch(LUNCH_DATA_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn('급식 데이터 로드 실패:', e.message);
            return { updated: '', menus: {} };
        }
    })();

    return _lunchDataPromise;
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

    _todayMenuPromise = _fetchLunchData().then(data => {
        const menu = data.menus[todayStr];
        if (!menu || !menu.items.length) return null;

        const result = { items: menu.items, kcal: menu.kcal, date: todayStr };
        localStorage.setItem(cacheKey, JSON.stringify(result));

        // 어제 캐시 정리
        const yesterday = new Date(Date.now() - 86400000);
        const yp = n => String(n).padStart(2, '0');
        localStorage.removeItem(`lunch_${yesterday.getFullYear()}-${yp(yesterday.getMonth()+1)}-${yp(yesterday.getDate())}`);

        return result;
    });

    return _todayMenuPromise;
}

// =============================================
// 주간 급식 (전체보기용)
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

    // JSON 데이터 로드
    const data = await _fetchLunchData();

    // 각 날짜별로 메뉴 추출
    for (const dayData of weekDays) {
        const menu = data.menus[dayData.date];
        if (menu) {
            dayData.items = menu.items;
            dayData.kcal  = menu.kcal || null;
        }
    }

    return weekDays;
}

// 스크립트 로드 시 프리페치
_fetchLunchData();
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
        `<li class="lunch-item">${cleanMenuItem(item)}</li>`
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
            <button class="btn btn-primary" onclick="downloadLunch()" style="margin-top:12px">📥 급식 저장</button>
        </div>
        <div class="container" style="max-width:900px;margin:0 auto;padding:0 20px 60px">
            <div class="allergen-panel" id="allergenPanel">
                <div class="allergen-panel-toggle" onclick="document.getElementById('allergenPanel').classList.toggle('open')">
                    <span>🚨 알레르기 정보</span>
                    <span class="allergen-panel-arrow">▼</span>
                </div>
                <div class="allergen-panel-items">
                    <span class="allergen-panel-item"><strong>1</strong>난류</span>
                    <span class="allergen-panel-item"><strong>2</strong>우유</span>
                    <span class="allergen-panel-item"><strong>3</strong>메밀</span>
                    <span class="allergen-panel-item"><strong>4</strong>땅콩</span>
                    <span class="allergen-panel-item"><strong>5</strong>대두</span>
                    <span class="allergen-panel-item"><strong>6</strong>밀</span>
                    <span class="allergen-panel-item"><strong>7</strong>고등어</span>
                    <span class="allergen-panel-item"><strong>8</strong>게</span>
                    <span class="allergen-panel-item"><strong>9</strong>새우</span>
                    <span class="allergen-panel-item"><strong>10</strong>돼지고기</span>
                    <span class="allergen-panel-item"><strong>11</strong>복숭아</span>
                    <span class="allergen-panel-item"><strong>12</strong>토마토</span>
                    <span class="allergen-panel-item"><strong>13</strong>아황산류</span>
                    <span class="allergen-panel-item"><strong>14</strong>호두</span>
                    <span class="allergen-panel-item"><strong>15</strong>닭고기</span>
                    <span class="allergen-panel-item"><strong>16</strong>쇠고기</span>
                    <span class="allergen-panel-item"><strong>17</strong>오징어</span>
                    <span class="allergen-panel-item"><strong>18</strong>조개류</span>
                    <span class="allergen-panel-item"><strong>19</strong>잣</span>
                </div>
            </div>
            <div class="lunch-page-card" id="lunchPageCard">
                <div class="lunch-loading">
                    <span class="lunch-spinner"></span>
                    <span>급식 정보 불러오는 중...</span>
                </div>
            </div>
            <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:20px">
                출처: <a href="https://eungaram-m.goegh.kr/eungaram-m/ad/fm/foodmenu/selectFoodMenuView.do?mi=8056" target="_blank" rel="noopener noreferrer" style="color:var(--primary)">은가람 중학교 공식 홈페이지</a>
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
                <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px">방학, 공휴일, 또는 데이터 준비 중일 수 있습니다.</p>
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
            return `<td class="lunch-table-item-cell">${item ? cleanMenuItem(item) : '<span style="color:var(--text-muted)">-</span>'}</td>`;
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

// 급식 저장
async function downloadLunch() {
    const weeklyData = await fetchWeeklyLunch();
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    let text = '🍱 은가람 중학교 이번 주 급식\n';
    text += `저장일시: ${new Date().toLocaleString('ko-KR')}\n\n`;

    // 요일별 급식
    weeklyData.forEach(day => {
        text += `📅 ${day.day}요일 (${day.displayDate})\n`;
        if (day.items.length === 0) {
            text += '  - 급식 정보 없음\n';
        } else {
            day.items.forEach(item => {
                // 알레르기 번호 제거하고 텍스트만 표시
                const cleanedItem = item.replace(/\([\d.]+\)/g, '').trim();
                text += `  - ${cleanedItem}\n`;
            });
        }
        if (day.kcal) {
            text += `  🔥 ${day.kcal} kcal\n`;
        }
        text += '\n';
    });

    // 알레르기 정보
    text += '\n🚨 알레르기 정보\n';
    text += '─'.repeat(40) + '\n';
    Object.entries(ALLERGEN_MAP).forEach(([num, name]) => {
        text += `${num}.${name}  `;
        if (num % 5 === 0) text += '\n';
    });

    // 다운로드
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const firstDay = weeklyData[0].displayDate;
    link.download = `급식_${firstDay.replace(/\./g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
}
