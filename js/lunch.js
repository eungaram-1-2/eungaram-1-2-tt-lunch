// =============================================
// 급식 메뉴 (Firebase + GitHub Actions 크롤링)
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
        ? `<br><span class="allergen-list" title="${allergenNums.map(n => `${n}.${ALLERGEN_MAP[n]}`).join(', ')}">${allergenNums.join('·')}</span>`
        : '';
    return `${name}${allergenHtml}`;
}

function _lunchTodayStr() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

// =============================================
// 급식 데이터 로드 (Firebase 우선, JSON 폴백)
// =============================================
let _lunchDataPromise = null;

async function _fetchLunchDataFromFirebase() {
    if (!fbReady()) return null;

    try {
        const today = _lunchTodayStr();
        const snapshot = await _fbDB.ref(`lunch/${today}`).once('value');
        const data = snapshot.val();

        if (data && data.items && Array.isArray(data.items)) {
            console.info('[Firebase] 오늘 급식 데이터 로드 성공');
            return {
                updated: data.updated || new Date().toISOString(),
                menus: { [today]: data }
            };
        }
        return null;
    } catch (e) {
        console.warn('[Firebase] 급식 로드 실패:', e.message);
        return null;
    }
}

async function _fetchLunchDataFromJSON() {
    try {
        const res = await fetch(LUNCH_DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('[JSON] 급식 데이터 로드 실패:', e.message);
        return { updated: '', menus: {} };
    }
}

async function _fetchLunchData() {
    if (_lunchDataPromise) return _lunchDataPromise;

    _lunchDataPromise = (async () => {
        // Firebase와 JSON을 병렬로 시도
        const [fbData] = await Promise.all([
            _fetchLunchDataFromFirebase(),
            // Firebase가 느리면 JSON에서 가져올 준비
        ]);

        // Firebase 데이터가 있으면 사용, 없으면 JSON
        if (fbData && Object.keys(fbData.menus).length > 0) {
            return fbData;
        }

        return await _fetchLunchDataFromJSON();
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
    const table = document.querySelector('.lunch-table-horizontal');
    if (!table) {
        showToast('급식 표를 찾을 수 없습니다.', 'error');
        return;
    }

    try {
        // 원본 요소의 computed style 미리 수집 (CSS 변수 해석용)
        const originalEls = [table, ...table.querySelectorAll('*')];
        const computedStyles = originalEls.map(el => {
            const cs = window.getComputedStyle(el);
            return {
                color:           cs.color,
                backgroundColor: cs.backgroundColor,
                borderColor:     cs.borderColor,
                fontSize:        cs.fontSize,
                fontWeight:      cs.fontWeight,
                borderTopColor:  cs.borderTopColor,
                borderBottomColor: cs.borderBottomColor,
                borderLeftColor: cs.borderLeftColor,
                borderRightColor: cs.borderRightColor,
            };
        });

        const canvas = await html2canvas(table, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (_doc, clonedTable) => {
                // CSS 변수가 해석된 실제 색상을 인라인으로 주입
                const clonedEls = [clonedTable, ...clonedTable.querySelectorAll('*')];
                clonedEls.forEach((el, i) => {
                    const s = computedStyles[i];
                    if (!s) return;
                    el.style.color           = s.color;
                    el.style.fontSize        = s.fontSize;
                    el.style.fontWeight      = s.fontWeight;
                    // 배경이 투명이면 흰색 유지, 아니면 원본 색 적용
                    if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        el.style.backgroundColor = s.backgroundColor;
                    } else {
                        el.style.backgroundColor = 'transparent';
                    }
                    el.style.borderTopColor    = s.borderTopColor;
                    el.style.borderBottomColor = s.borderBottomColor;
                    el.style.borderLeftColor   = s.borderLeftColor;
                    el.style.borderRightColor  = s.borderRightColor;
                });
            }
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        const today = new Date().toISOString().split('T')[0];
        link.download = `급식_${today}.png`;
        link.click();
    } catch (err) {
        console.error('급식 저장 실패:', err);
        showToast('급식 저장에 실패했습니다.', 'error');
    }
}

// =============================================
// 빠른 자동 스크롤 (선택적)
// =============================================
function enableAutoScrollLunchTable() {
    const wrapper = document.querySelector('.lunch-table-wrapper');
    if (!wrapper) return;

    let scrollSpeed = 2; // px/ms (빠른 속도)
    let scrollTimer = null;

    const autoScroll = () => {
        if (wrapper.scrollLeft < wrapper.scrollWidth - wrapper.clientWidth) {
            wrapper.scrollLeft += scrollSpeed;
            scrollTimer = requestAnimationFrame(autoScroll);
        } else {
            // 끝에 도달하면 처음으로 리셋
            setTimeout(() => {
                wrapper.scrollLeft = 0;
                scrollTimer = requestAnimationFrame(autoScroll);
            }, 3000); // 3초 대기
        }
    };

    // 마우스/터치 상호작용 시 자동 스크롤 중단
    wrapper.addEventListener('wheel', () => {
        if (scrollTimer) cancelAnimationFrame(scrollTimer);
        scrollTimer = null;
    });

    wrapper.addEventListener('touchstart', () => {
        if (scrollTimer) cancelAnimationFrame(scrollTimer);
        scrollTimer = null;
    });

    // 스크롤 완료 후 다시 시작 (3초 후)
    wrapper.addEventListener('scroll', () => {
        if (scrollTimer) cancelAnimationFrame(scrollTimer);
        setTimeout(() => {
            scrollTimer = requestAnimationFrame(autoScroll);
        }, 3000);
    }, { once: false });

    // 초기 시작 (1초 지연)
    setTimeout(() => {
        scrollTimer = requestAnimationFrame(autoScroll);
    }, 1000);
}

// loadLunchPage() 이후 호출
async function loadLunchPageWithAutoScroll() {
    await loadLunchPage();
    // 테이블 렌더링 후 자동 스크롤 활성화
    setTimeout(() => enableAutoScrollLunchTable(), 100);
}

// =============================================
// 초기 프리페치 (빠른 로딩)
// =============================================
// 스크립트 로드 시 급식 데이터를 미리 가져옴
_fetchLunchData();
fetchLunchMenu();
