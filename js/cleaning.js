// =============================================
// 청소 당번표
// =============================================

const DEFAULT_CLEANING = {
    areas: [
        { name: '교실 쓸기',        emoji: '🧹', time: '방과후', color: '#3b82f6' },
        { name: '교실 닦기',        emoji: '🧽', time: '방과후', color: '#10b981' },
        { name: '복도 쓸기',        emoji: '🚪', time: '방과후', color: '#f97316' },
        { name: '음악실 청소',      emoji: '🎵', time: '점심시간', color: '#8b5cf6' },
        { name: '음악실 닦기',      emoji: '🎵', time: '점심시간', color: '#ec4899' }
    ],
    schedule: {
        '교실 쓸기': { '월': [1,2,3,4], '화': [1,2,3,4], '수': [1,2,3,4], '목': [1,2,3,4], '금': [1,2,3,4] },
        '교실 닦기': { '월': [5,6,7,8], '화': [5,6,7,8], '수': [5,6,7,8], '목': [5,6,7,8], '금': [5,6,7,8] },
        '복도 쓸기': { '월': [9,10,11,12], '화': [9,10,11,12], '수': [9,10,11,12], '목': [9,10,11,12], '금': [9,10,11,12] },
        '음악실 청소': { '월': [13,14,15,16], '화': [], '수': [13,14,15,16], '목': [], '금': [13,14,15,16] },
        '음악실 닦기': { '월': [17,18,19,20], '화': [], '수': [17,18,19,20], '목': [], '금': [17,18,19,20] }
    }
};

function getCleaningData() {
    const stored = DB.get('cleaning_schedule');
    if (stored && stored.areas && stored.schedule) return stored;
    return JSON.parse(JSON.stringify(DEFAULT_CLEANING));
}

function getMyArea(studentNum, data) {
    for (const areaName in data.schedule) {
        for (const day in data.schedule[areaName]) {
            if (data.schedule[areaName][day].includes(studentNum)) {
                return { name: areaName, day };
            }
        }
    }
    return null;
}

function getTodayDay() {
    const days = ['일','월','화','수','목','금','토'];
    return days[new Date().getDay()];
}

function renderCleaning() {
    const data   = getCleaningData();
    const user   = currentUser();
    const isAdmin = user && user.role === 'admin';

    let myNum = null;
    if (user) {
        const m = user.id.match(/^1020(\d+)$/);
        if (m) myNum = parseInt(m[1], 10);
    }

    const todayDay = getTodayDay();
    const myArea = myNum ? getMyArea(myNum, data) : null;
    const myTodayArea = myArea && myArea.day === todayDay ? myArea : null;

    // 오늘 청소 배너
    const todayBanner = myTodayArea
        ? `<div style="background:linear-gradient(135deg,rgba(239,68,68,.15) 0%,rgba(239,68,68,.05) 100%);border:2px solid #ef4444;border-radius:16px;padding:16px 22px;margin-bottom:20px;font-weight:600;color:var(--text)">
            <span style="font-size:1.4rem">🚨</span>
            <div style="display:inline-block;margin-left:12px">
                <div style="font-size:0.8rem;opacity:0.8;margin-bottom:2px">오늘 청소</div>
                <div style="font-size:1.05rem;font-weight:800">${myTodayArea.name}</div>
            </div>
           </div>`
        : '';

    // 청소 당번표 (테이블)
    const days = ['월','화','수','목','금','토','일'];
    let tableHtml = '<table class="cleaning-table"><thead><tr><th class="cleaning-th-area">청소 항목</th>';
    days.forEach(d => {
        tableHtml += `<th class="cleaning-th-day">${d}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    data.areas.forEach((area, areaIdx) => {
        tableHtml += `<tr><td class="cleaning-td-area" style="border-left:4px solid ${area.color};background:${area.color}15">
            <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:1.3rem">${area.emoji}</span>
                <div>
                    <div style="font-weight:800;font-size:0.95rem">${area.name}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${area.time}</div>
                </div>
            </div>
        </td>`;

        days.forEach(day => {
            const students = data.schedule[area.name][day] || [];
            const studentStr = students.join(', ');
            const cellClass = myTodayArea && myTodayArea.name === area.name && myTodayArea.day === day ? 'my-cell' : '';
            const clickAttr = isAdmin ? `onclick="openCleaningEditCell('${area.name}', '${day}')"` : '';
            const cursor = isAdmin ? 'cursor:pointer' : '';
            const bgColor = `${area.color}08`;

            tableHtml += `<td class="cleaning-td-day ${cellClass}" style="${cursor};background:${bgColor}" ${clickAttr}>
                <div class="cleaning-cell-content">${studentStr || '—'}</div>
            </td>`;
        });

        tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';

    return `
    <div class="page">
        <div class="page-header">
            <h2>🧹 청소 당번표</h2>
            <p style="font-size:0.88rem;color:var(--text-muted)">은가람중학교 1학년 2반 청소 당번 일정</p>
        </div>
        ${todayBanner}
        <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
            ${tableHtml}
        </div>
        ${isAdmin ? `<p style="text-align:center;font-size:0.78rem;color:var(--text-muted);margin-top:16px">💡 셀을 클릭하여 편집할 수 있습니다.</p>` : ''}
        ${isAdmin ? `<div style="text-align:center;margin-top:20px"><button class="btn btn-outline btn-sm" onclick="viewCleaningHistory()" style="font-size:0.85rem">📋 변경 이력 확인</button></div>` : ''}
        <p style="text-align:center;font-size:0.78rem;color:var(--text-muted);margin-top:24px">
            구역 변경은 관리자(선생님)만 가능합니다.
        </p>
    </div>`;
}

// ── 관리자 셀 편집 모달 ──
function openCleaningEditCell(areaName, day) {
    const data = getCleaningData();
    const students = data.schedule[areaName][day] || [];

    const bodyHtml = `
    <div style="display:flex;flex-direction:column;gap:14px">
        <label style="font-size:0.88rem;font-weight:700">${areaName} — ${day}요일</label>
        <input id="cell_students" class="form-input" value="${students.join(', ')}" placeholder="학생 번호 입력 (쉼표로 구분)">
        <div style="display:flex;gap:10px">
            <button class="btn btn-primary" style="flex:1" onclick="saveCleaningCell('${areaName}', '${day}')">저장</button>
            <button class="btn btn-danger btn-outline" style="flex:1" onclick="clearCleaningCell('${areaName}', '${day}')">비우기</button>
        </div>
    </div>`;
    openModal(`${areaName} 편집`, bodyHtml);
}

function addCleaningHistory(type, areaName, day, oldValue, newValue) {
    const history = DB.get('cleaning_history', []);
    history.push({
        id: Date.now(),
        type: type,
        areaName: areaName,
        day: day,
        oldValue: oldValue,
        newValue: newValue,
        timestamp: new Date().toISOString(),
        changedBy: currentUser() ? currentUser().nickname : '알 수 없음'
    });
    DB.set('cleaning_history', history);
    addLog('cleaning_modified', { type, areaName, day, oldValue: oldValue.join(','), newValue: newValue.join(',') });
}

function saveCleaningCell(areaName, day) {
    const raw = document.getElementById('cell_students').value || '';
    const students = raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);

    const data = getCleaningData();
    const oldValue = [...(data.schedule[areaName][day] || [])];

    // 변경 이력 저장
    addCleaningHistory('modify', areaName, day, oldValue, students);

    // 현재 데이터 업데이트
    data.schedule[areaName][day] = students;
    DB.set('cleaning_schedule', data);
    closeModal();
    navigate('cleaning');
}

function clearCleaningCell(areaName, day) {
    const data = getCleaningData();
    const oldValue = [...(data.schedule[areaName][day] || [])];

    // 변경 이력 저장
    addCleaningHistory('clear', areaName, day, oldValue, []);

    // 현재 데이터 업데이트
    data.schedule[areaName][day] = [];
    DB.set('cleaning_schedule', data);
    closeModal();
    navigate('cleaning');
}

// 청소표 변경 이력 조회
function viewCleaningHistory() {
    const user = currentUser();
    if (!user || user.role !== 'admin') {
        showToast('관리자만 접근할 수 있습니다.', 'error');
        return;
    }

    const history = DB.get('cleaning_history', []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (history.length === 0) {
        openModal('청소표 변경 이력', '<p style="text-align:center;color:var(--text-muted)">변경 이력이 없습니다.</p>');
        return;
    }

    const historyHtml = history.map(h => {
        const date = new Date(h.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
        const typeLabel = h.type === 'modify' ? '수정' : '삭제';
        const typeColor = h.type === 'modify' ? '#3b82f6' : '#ef4444';

        return `
        <div style="padding:12px;border-left:3px solid ${typeColor};background:${typeColor}08;margin-bottom:10px;border-radius:6px;font-size:0.88rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <strong style="color:${typeColor}">${typeLabel}</strong>
                <span style="color:var(--text-muted);font-size:0.8rem">${dateStr}</span>
            </div>
            <div style="color:var(--text-muted);margin-bottom:4px">${h.areaName} — ${h.day}요일</div>
            <div style="margin-top:6px">
                <div style="font-size:0.8rem;color:var(--text-muted)">이전: <span style="color:var(--text)">${h.oldValue.length > 0 ? h.oldValue.join(', ') : '(비어있음)'}</span></div>
                <div style="font-size:0.8rem;color:var(--text-muted)">변경: <span style="color:var(--text)">${h.newValue.length > 0 ? h.newValue.join(', ') : '(비어있음)'}</span></div>
            </div>
            <div style="margin-top:4px;font-size:0.75rem;color:var(--text-muted)">변경자: ${h.changedBy}</div>
        </div>`;
    }).join('');

    const bodyHtml = `
    <div style="max-height:400px;overflow-y:auto">
        ${historyHtml}
    </div>`;

    openModal('청소표 변경 이력', bodyHtml);
}
