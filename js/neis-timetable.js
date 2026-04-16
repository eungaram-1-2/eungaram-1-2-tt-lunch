// =============================================
// NEIS API에서 시간표 데이터 로드
// =============================================

const NEIS_CONFIG = {
    API_KEY: 'ed50e755df5d42d4b94db728feab7952',
    ATPT_CODE: 'J10',  // 경기도
    SCHOOL_CODE: '7692130',  // 은가람중학교
    GRADE: '1',
    CLASS: '2',
    BASE_URL: 'https://open.neis.go.kr/hub/misTimetable'
};

// 요일명 매핑
const DAY_NAMES = ['월', '화', '수', '목', '금'];

/**
 * 주간 날짜 범위 구하기 (현재 주의 월~금)
 * @returns {Array<string>} YYYYMMDD 형식의 날짜 배열
 */
function getWeekDateRange() {
    const today = new Date();
    const dayOfWeek = today.getDay();  // 0=일, 1=월 ... 5=금, 6=토

    // 현재 주의 월요일 구하기
    const monday = new Date(today);
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);  // 월요일이 1
    monday.setDate(diff);

    // 월~금 5일간의 날짜 배열 생성
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}${m}${day}`);
    }
    return dates;
}

/**
 * NEIS API에서 시간표 데이터 조회 (주간)
 * @returns {Promise<Object>} 요일별 정렬된 시간표 데이터
 */
async function fetchNeisTimeTableData() {
    const dates = getWeekDateRange();
    const allData = {};  // { YYYYMMDD: [row1, row2, ...], ... }

    try {
        // 월~금 각각 조회
        const promises = dates.map(dateStr =>
            fetch(`${NEIS_CONFIG.BASE_URL}?KEY=${NEIS_CONFIG.API_KEY}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SCHOOL_CODE}&ALL_TI_YMD=${dateStr}`)
                .then(r => r.ok ? r.json() : null)
                .catch(e => {
                    console.warn(`[NEIS] ${dateStr} 조회 실패:`, e.message);
                    return null;
                })
        );

        const responses = await Promise.all(promises);

        // 각 날짜별 데이터 필터링
        responses.forEach((json, idx) => {
            if (!json || !json.misTimetable || !json.misTimetable[1]) return;

            const filtered = json.misTimetable[1].row.filter(r =>
                r.GRADE === NEIS_CONFIG.GRADE && r.CLASS_NM === NEIS_CONFIG.CLASS
            );

            if (filtered.length > 0) {
                allData[dates[idx]] = filtered;
            }
        });

        return allData;
    } catch (e) {
        console.warn('[NEIS] 주간 시간표 로드 실패:', e.message);
        return {};
    }
}

/**
 * NEIS 데이터를 현재 TIMETABLE 형식으로 변환
 * @param {Object} neisDataByDate YYYYMMDD별 정렬된 NEIS 데이터
 * @returns {Object} TIMETABLE 형식의 객체
 */
function parseNeisDataToTimetable(neisDataByDate) {
    if (!neisDataByDate || Object.keys(neisDataByDate).length === 0) return null;

    // 기존 시간표 구조 유지
    const periods = TIMETABLE.periods.slice();  // 기본값 복사
    const schedule = TIMETABLE.schedule.map((row, idx) => [...row]);  // 깊은 복사

    // 각 날짜별로 처리
    Object.entries(neisDataByDate).forEach(([dateStr, neisData]) => {
        // 날짜로부터 요일 계산 (0=월 ... 4=금)
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6));
        const day = parseInt(dateStr.slice(6, 8));
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay() - 1;

        if (dayOfWeek < 0 || dayOfWeek > 4) return;  // 월~금만 처리

        // 교시별 데이터 정렬
        neisData.forEach(row => {
            const perio = parseInt(row.PERIO);
            const subject = row.ITRT_CNTNT;

            if (perio >= 1 && perio <= 7 && subject) {
                schedule[perio - 1][dayOfWeek] = { s: subject, t: '' };  // 선생님 정보는 비워둠
            }
        });
    });

    return {
        periods: periods,
        days: TIMETABLE.days,
        schedule: schedule,
        source: 'NEIS',
        updated: new Date().toISOString()
    };
}

/**
 * NEIS API → Firebase → 웹사이트 흐름
 */
async function loadTimetableFromNEIS() {
    console.log('[시간표] NEIS API에서 주간 시간표 로드 시작...');

    // 1. NEIS API에서 월~금 데이터 조회
    const neisDataByDate = await fetchNeisTimeTableData();
    if (Object.keys(neisDataByDate).length === 0) {
        console.warn('[NEIS] 데이터 없음 → Firebase/기본값 사용');
        return false;
    }

    // 2. 데이터 파싱
    const timetable = parseNeisDataToTimetable(neisDataByDate);
    if (!timetable) return false;

    // 3. TIMETABLE 업데이트
    TIMETABLE = timetable;
    console.log('[NEIS] 주간 시간표 업데이트 완료:', Object.keys(neisDataByDate).length, '일간');

    // 4. Firebase에 저장 (선택사항)
    if (fbReady()) {
        try {
            _fbDB.ref('config/timetable').set(timetable).catch(e => {
                console.warn('[Firebase] 시간표 저장 실패:', e);
            });
        } catch (e) {}
    }

    return true;
}
