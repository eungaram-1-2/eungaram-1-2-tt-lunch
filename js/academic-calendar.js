// 학사 일정 데이터
const academicCalendarData = {
    "year": 2026,
    "events": [
        { "date": "2026-03-03", "title": "입학식/개학식", "category": "major" },
        { "date": "2026-03-04", "title": "2,3학년 동아리 안내", "category": "event" },
        { "date": "2026-03-09", "title": "3학년 진단 평가", "category": "exam" },
        { "date": "2026-03-12", "title": "학급자치(임원선거)", "category": "event" },
        { "date": "2026-03-18", "title": "학부모 총회", "category": "event" },
        { "date": "2026-03-19", "title": "학급자치", "category": "event" },
        { "date": "2026-03-20", "title": "1학년 표준화 검사", "category": "exam" },
        { "date": "2026-03-30", "title": "디지털 성폭력 예방교육", "category": "education" },
        { "date": "2026-03-30", "title": "학부모 상담주간(3/30~4/3)", "category": "event" },
        { "date": "2026-04-07", "title": "1학년 표준화 검사 결과", "category": "event" },
        { "date": "2026-04-16", "title": "장애 인식 개선 교육", "category": "education" },
        { "date": "2026-04-27", "title": "2,3학년 1차 지필 평가", "category": "exam" },
        { "date": "2026-04-28", "title": "2,3학년 1차 지필 평가", "category": "exam" },
        { "date": "2026-04-30", "title": "1학년 진로직업체험", "category": "event" },
        { "date": "2026-05-01", "title": "재량 휴업일", "category": "holiday" },
        { "date": "2026-05-04", "title": "재량 휴업일", "category": "holiday" },
        { "date": "2026-05-05", "title": "어린이날", "category": "holiday" },
        { "date": "2026-05-05", "title": "1일형 현장체험학습(자율)", "category": "event" },
        { "date": "2026-05-07", "title": "1학년 건강 검사", "category": "event" },
        { "date": "2026-05-08", "title": "놀이로 배우는 진로", "category": "event" },
        { "date": "2026-05-14", "title": "성폭력, 성희롱, 성매매 예방 교육", "category": "education" },
        { "date": "2026-05-27", "title": "1학년 청소년 노동 인권 교육", "category": "education" },
        { "date": "2026-05-29", "title": "아동학대 예방교육", "category": "education" },
        { "date": "2026-06-03", "title": "전국동시 지방선거(휴일)", "category": "holiday" },
        { "date": "2026-06-06", "title": "현충일(휴일)", "category": "holiday" },
        { "date": "2026-06-30", "title": "2,3학년 2차 지필평가", "category": "exam" },
        { "date": "2026-07-01", "title": "2,3학년 2차 지필평가", "category": "exam" },
        { "date": "2026-07-02", "title": "2,3학년 2차 지필평가", "category": "exam" },
        { "date": "2026-07-07", "title": "가정폭력 및 아동학대 예방교육", "category": "education" },
        { "date": "2026-07-08", "title": "진로 직업 체험", "category": "event" },
        { "date": "2026-07-09", "title": "기업가정신 진로캠프", "category": "event" },
        { "date": "2026-07-14", "title": "학생 인권 교육", "category": "education" },
        { "date": "2026-07-16", "title": "1~4교시 수업, 흡연 예방 교육", "category": "education" },
        { "date": "2026-07-17", "title": "제헌절", "category": "holiday" },
        { "date": "2026-07-20", "title": "방학식", "category": "major" },
        { "date": "2026-08-15", "title": "광복절", "category": "holiday" },
        { "date": "2026-08-17", "title": "대체 공휴일", "category": "holiday" },
        { "date": "2026-08-18", "title": "교내 환경 정화 활동", "category": "event" },
        { "date": "2026-08-20", "title": "학교폭력 예방 교육", "category": "education" },
        { "date": "2026-09-22", "title": "교내 환경 정화 활동", "category": "event" },
        { "date": "2026-09-24", "title": "추석", "category": "holiday" },
        { "date": "2026-09-25", "title": "추석", "category": "holiday" },
        { "date": "2026-09-28", "title": "금요일 시간표로 변경 운영", "category": "event" },
        { "date": "2026-09-29", "title": "2,3학년 1차 지필 평가", "category": "exam" },
        { "date": "2026-09-30", "title": "2,3학년 1차 지필 평가", "category": "exam" },
        { "date": "2026-10-01", "title": "마약 예방 교육", "category": "education" },
        { "date": "2026-10-03", "title": "개천절", "category": "holiday" },
        { "date": "2026-10-08", "title": "학급 자치", "category": "event" },
        { "date": "2026-10-09", "title": "한글날", "category": "holiday" },
        { "date": "2026-10-15", "title": "성폭력, 성희롱, 성매매 예방 교육", "category": "education" },
        { "date": "2026-10-16", "title": "학교스포츠클럽 축제, 교내 환경정화활동", "category": "event" },
        { "date": "2026-10-26", "title": "학부모 상담주간", "category": "event" },
        { "date": "2026-11-19", "title": "대학수학능력시험(학교장재량휴업일)", "category": "event" },
        { "date": "2026-11-23", "title": "3학년 2차 지필평가", "category": "exam" },
        { "date": "2026-11-24", "title": "3학년 2차 지필평가", "category": "exam" },
        { "date": "2026-11-25", "title": "3학년 2차 지필평가", "category": "exam" },
        { "date": "2026-12-15", "title": "1,2학년 2차 지필 평가", "category": "exam" },
        { "date": "2026-12-16", "title": "1,2학년 2차 지필 평가", "category": "exam" },
        { "date": "2026-12-17", "title": "1,2학년 2차 지필 평가", "category": "exam" },
        { "date": "2026-12-22", "title": "전교 학생자치 회장단 선거", "category": "event" },
        { "date": "2026-12-23", "title": "대학생 멘토링, 진로콘서트", "category": "event" },
        { "date": "2026-12-25", "title": "성탄절", "category": "holiday" },
        { "date": "2027-01-01", "title": "신정", "category": "holiday" },
        { "date": "2027-01-06", "title": "1~4교시 수업", "category": "event" },
        { "date": "2027-01-08", "title": "종업식", "category": "major" }
    ]
};

let currentCalendarMonth = new Date().getMonth() + 1;
let currentCalendarYear = new Date().getFullYear();

function renderAcademicCalendar() {
    const app = document.getElementById('app');

    const html = `
        <div class="academic-calendar-container">
            <div class="calendar-header">
                <h1>📚 학사일정</h1>
                <div class="calendar-nav">
                    <button class="btn-nav btn-prev" onclick="prevMonth()">◀ 이전</button>
                    <h2 class="month-display" id="monthDisplay">${currentCalendarYear}년 ${String(currentCalendarMonth).padStart(2, '0')}월</h2>
                    <button class="btn-nav btn-next" onclick="nextMonth()">다음 ▶</button>
                </div>
            </div>

            <div class="legend">
                <div class="legend-item">
                    <span class="legend-color" style="background: #ff6b6b;"></span>
                    <span>중요 행사</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #4ecdc4;"></span>
                    <span>시험</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #ffd93d;"></span>
                    <span>학교행사</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #a8e6cf;"></span>
                    <span>교육</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #ffe66d;"></span>
                    <span>휴일</span>
                </div>
            </div>

            <div class="month-calendar" id="monthCalendar"></div>

            <div class="month-events" id="monthEvents"></div>

            <div class="uncertainty-note">
                <strong>⚠️ 주의</strong>
                <p><span style="color: #c92a2a;">이 학사일정은 불확실할 수도 있습니다.</span> 정확한 일정은 학교 공지사항을 확인하세요.</p>
            </div>
        </div>
    `;

    app.innerHTML = html;
    renderMonthCalendar();
}

function renderMonthCalendar() {
    const monthCalendarDiv = document.getElementById('monthCalendar');
    const monthEventsDiv = document.getElementById('monthEvents');

    // 유효한 월 범위 확인 (3월부터 다음해 1월까지)
    if ((currentCalendarYear === 2026 && currentCalendarMonth < 3) ||
        (currentCalendarYear === 2027 && currentCalendarMonth > 1)) {
        monthCalendarDiv.innerHTML = '<p style="text-align: center; padding: 20px;">학사일정이 없는 기간입니다.</p>';
        monthEventsDiv.innerHTML = '';
        return;
    }

    const firstDay = new Date(currentCalendarYear, currentCalendarMonth - 1, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // 이벤트 맵 생성
    const eventMap = {};
    academicCalendarData.events.forEach(event => {
        const eventDate = new Date(event.date);
        if (eventDate.getFullYear() === currentCalendarYear &&
            eventDate.getMonth() + 1 === currentCalendarMonth) {
            const key = eventDate.getDate();
            if (!eventMap[key]) {
                eventMap[key] = [];
            }
            eventMap[key].push(event);
        }
    });

    // 달력 HTML 생성
    let calendarHTML = `
        <div class="weekdays">
            <div class="weekday">일</div>
            <div class="weekday">월</div>
            <div class="weekday">화</div>
            <div class="weekday">수</div>
            <div class="weekday">목</div>
            <div class="weekday">금</div>
            <div class="weekday">토</div>
        </div>
        <div class="days">
    `;

    let currentDate = new Date(startDate);
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
        const isCurrentMonth = currentDate.getMonth() === firstDay.getMonth() &&
                              currentDate.getFullYear() === firstDay.getFullYear();
        const dayClass = isCurrentMonth ? '' : 'other-month';
        const sundayClass = currentDate.getDay() === 0 ? 'sunday' : '';
        const saturdayClass = currentDate.getDay() === 6 ? 'saturday' : '';

        const dayEvents = eventMap[currentDate.getDate()] || [];
        let eventsHTML = `<div class="day-number">${currentDate.getDate()}</div>`;

        dayEvents.forEach((event, idx) => {
            if (idx < 2) {
                eventsHTML += `<div class="day-event event-${event.category}" title="${event.title}">${event.title}</div>`;
            }
        });

        if (dayEvents.length > 2) {
            eventsHTML += `<div class="day-event event-more">+${dayEvents.length - 2}</div>`;
        }

        calendarHTML += `
            <div class="day ${dayClass} ${sundayClass} ${saturdayClass}">
                ${eventsHTML}
            </div>
        `;

        currentDate.setDate(currentDate.getDate() + 1);
    }

    calendarHTML += '</div>';
    monthCalendarDiv.innerHTML = calendarHTML;

    // 이번 달 이벤트 목록
    const monthEvents = academicCalendarData.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === currentCalendarYear &&
               eventDate.getMonth() + 1 === currentCalendarMonth;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    let eventsListHTML = '<h3>📋 이번 달 일정</h3><div class="events-list">';
    if (monthEvents.length === 0) {
        eventsListHTML += '<p style="text-align: center; color: #999;">이번 달 일정이 없습니다.</p>';
    } else {
        monthEvents.forEach(event => {
            const date = new Date(event.date);
            const dateStr = `${date.getDate()}일`;
            const uncertainBadge = event.uncertain ? ' <span style="color: #c92a2a; font-size: 0.85em;">(불확실)</span>' : '';
            eventsListHTML += `
                <div class="event-item">
                    <span class="event-date">${dateStr}</span>
                    <span class="event-title">${event.title}${uncertainBadge}</span>
                </div>
            `;
        });
    }
    eventsListHTML += '</div>';
    monthEventsDiv.innerHTML = eventsListHTML;
}

function prevMonth() {
    currentCalendarMonth--;
    if (currentCalendarMonth < 1) {
        currentCalendarMonth = 12;
        currentCalendarYear--;
    }
    updateMonthDisplay();
    renderMonthCalendar();
}

function nextMonth() {
    currentCalendarMonth++;
    if (currentCalendarMonth > 12) {
        currentCalendarMonth = 1;
        currentCalendarYear++;
    }
    updateMonthDisplay();
    renderMonthCalendar();
}

function updateMonthDisplay() {
    const monthDisplay = document.getElementById('monthDisplay');
    if (monthDisplay) {
        monthDisplay.textContent = `${currentCalendarYear}년 ${String(currentCalendarMonth).padStart(2, '0')}월`;
    }
}

// 초기 월 설정: 현재 월 또는 3월(시작)
function initializeCalendarMonth() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (currentYear === 2026 && currentMonth >= 3) {
        currentCalendarMonth = currentMonth;
        currentCalendarYear = currentYear;
    } else if (currentYear === 2027 && currentMonth === 1) {
        currentCalendarMonth = 1;
        currentCalendarYear = 2027;
    } else {
        // 범위 밖이면 3월 시작
        currentCalendarMonth = 3;
        currentCalendarYear = 2026;
    }
}

// 페이지 로드 시 초기화
initializeCalendarMonth();
