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
 * NEIS API에서 시간표 데이터 조회
 * @param {string} dateStr YYYYMMDD 형식의 날짜
 * @returns {Promise<Array>} 해당 날짜의 시간표 데이터
 */
async function fetchNeisTimeTableData(dateStr = null) {
    if (!dateStr) {
        const d = new Date();
        dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }

    try {
        const url = `${NEIS_CONFIG.BASE_URL}?KEY=${NEIS_CONFIG.API_KEY}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SCHOOL_CODE}&ALL_TI_YMD=${dateStr}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        if (!json.misTimetable || !json.misTimetable[1]) return [];

        // GRADE=1, CLASS_NM=2 인 데이터만 필터링
        return json.misTimetable[1].row.filter(r =>
            r.GRADE === NEIS_CONFIG.GRADE && r.CLASS_NM === NEIS_CONFIG.CLASS
        );
    } catch (e) {
        console.warn('[NEIS] 시간표 로드 실패:', e.message);
        return [];
    }
}

/**
 * NEIS 데이터를 현재 TIMETABLE 형식으로 변환
 * @param {Array} neisData NEIS API에서 온 데이터 배열
 * @returns {Object} TIMETABLE 형식의 객체
 */
function parseNeisDataToTimetable(neisData) {
    if (!neisData || neisData.length === 0) return null;

    // 날짜로부터 요일 계산
    const dateStr = neisData[0].ALL_TI_YMD;  // YYYYMMDD
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6));
    const day = parseInt(dateStr.slice(6, 8));
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay() - 1;  // 0=월 ... 4=금

    // 교시별 데이터 정렬
    const byPeriod = {};
    neisData.forEach(row => {
        const perio = parseInt(row.PERIO);
        byPeriod[perio] = row.ITRT_CNTNT;
    });

    // 기존 시간표 구조 유지
    const periods = TIMETABLE.periods.slice();  // 기본값 복사
    const schedule = TIMETABLE.schedule.map((row, idx) => [...row]);  // 깊은 복사

    // 조회한 날짜 열에만 업데이트
    if (dayOfWeek >= 0 && dayOfWeek <= 4) {
        for (let perio = 1; perio <= 6; perio++) {
            const subject = byPeriod[perio];
            if (subject) {
                schedule[perio - 1][dayOfWeek] = { s: subject, t: '' };  // 선생님 정보는 비워둠
            }
        }
    }

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
    console.log('[시간표] NEIS API에서 데이터 로드 시작...');

    // 1. NEIS API에서 데이터 조회
    const neisData = await fetchNeisTimeTableData();
    if (neisData.length === 0) {
        console.warn('[NEIS] 데이터 없음 → Firebase/기본값 사용');
        return false;
    }

    // 2. 데이터 파싱
    const timetable = parseNeisDataToTimetable(neisData);
    if (!timetable) return false;

    // 3. TIMETABLE 업데이트
    TIMETABLE = timetable;
    console.log('[NEIS] 시간표 업데이트 완료:', timetable);

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
