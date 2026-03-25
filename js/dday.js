// =============================================
// D-Day
// =============================================
function getDdays() {
    return DB.get('ddays').sort((a, b) => new Date(a.date) - new Date(b.date));
}

function calcDday(dateStr) {
    const target = new Date(dateStr + 'T00:00:00');
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function formatDdayLabel(diff) {
    if (diff === 0) return 'D-Day';
    if (diff > 0)   return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
}

function renderDday() {
    const ddays = getDdays();
    const now   = new Date(); now.setHours(0, 0, 0, 0);

    const upcoming = ddays.filter(d => new Date(d.date + 'T00:00:00') >= now);
    const past     = ddays.filter(d => new Date(d.date + 'T00:00:00') < now);

    const createBtn = isAdmin()
        ? `<button class="btn btn-primary" onclick="openDdayModal()">✏️ D-Day 추가</button>` : '';

    function renderCards(list, emptyMsg) {
        if (list.length === 0) return `<div class="empty-state" style="padding:30px"><p>${emptyMsg}</p></div>`;
        const dayNames = ['일','월','화','수','목','금','토'];
        return list.map(d => {
            const diff   = calcDday(d.date);
            const label  = formatDdayLabel(diff);
            const isToday = diff === 0;
            const isPast  = diff < 0;

            let urgencyClass = 'dday-normal';
            if (isToday)            urgencyClass = 'dday-today';
            else if (diff <= 3 && diff > 0) urgencyClass = 'dday-urgent';
            else if (diff <= 7 && diff > 0) urgencyClass = 'dday-soon';
            else if (isPast)        urgencyClass = 'dday-past';

            const dateObj    = new Date(d.date + 'T00:00:00');
            const dateDisplay = `${dateObj.getFullYear()}.${String(dateObj.getMonth()+1).padStart(2,'0')}.${String(dateObj.getDate()).padStart(2,'0')} (${dayNames[dateObj.getDay()]})`;
            const adminBtns  = isAdmin()
                ? `<button class="btn btn-ghost btn-sm" style="color:var(--primary);padding:4px 8px;font-size:0.72rem" onclick="event.stopPropagation();openDdayEditModal('${d.id}')">수정</button><button class="btn btn-ghost btn-sm" style="color:var(--danger);padding:4px 8px;font-size:0.72rem" onclick="event.stopPropagation();deleteDday('${d.id}')">삭제</button>`
                : '';

            return `
            <div class="dday-card ${urgencyClass}">
                <div class="dday-left">
                    <div class="dday-emoji">${d.emoji || '📌'}</div>
                    <div class="dday-info">
                        <h4>${escapeHtml(d.title)}</h4>
                        <span class="dday-date">${dateDisplay}</span>
                    </div>
                </div>
                <div class="dday-right">
                    <span class="dday-label ${urgencyClass}">${label}</span>
                    ${adminBtns}
                </div>
            </div>`;
        }).join('');
    }

    let pastSection = '';
    if (past.length > 0) {
        pastSection = `
        <div style="margin-top:32px">
            <h3 style="font-size:1rem;font-weight:700;color:var(--text-muted);margin-bottom:14px">지난 일정</h3>
            ${renderCards(past.reverse(), '')}
        </div>`;
    }

    return `
    <div class="page">
        <div class="page-header">
            <h2>⏳ D-Day</h2>
            ${createBtn}
        </div>
        <div>${renderCards(upcoming, '등록된 D-Day가 없습니다.')}</div>
        ${pastSection}
    </div>`;
}

function openDdayModal() {
    openModal('D-Day 추가', `
        <div class="form-group">
            <label>일정 이름</label>
            <input type="text" class="form-input" id="ddayTitle" placeholder="예: 중간고사" maxlength="50">
        </div>
        <div class="form-group">
            <label>날짜</label>
            <input type="date" class="form-input" id="ddayDate">
        </div>
        <div class="form-group">
            <label>이모지 (선택)</label>
            <div class="dday-emoji-picker" id="ddayEmojiPicker">
                ${['📝','📚','🏃','🎉','🏫','🎓','✈️','🎄','🧪','🎵','⚽','🏆','📅','💡','🔔'].map(e =>
                    `<button type="button" class="emoji-btn" onclick="selectDdayEmoji(this,'${e}')">${e}</button>`
                ).join('')}
            </div>
            <input type="hidden" id="ddayEmoji" value="📌">
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
            <button class="btn btn-ghost" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" onclick="saveDday()">추가</button>
        </div>
    `);
}

function selectDdayEmoji(btn, emoji) {
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('ddayEmoji').value = emoji;
}

function saveDday() {
    if (!RateLimit.check('post')) {
        showToast('너무 자주 요청하고 있습니다.', 'warning');
        return;
    }
    const title = document.getElementById('ddayTitle').value.trim().slice(0, 50);
    const date  = document.getElementById('ddayDate').value;
    const emoji = document.getElementById('ddayEmoji').value || '📌';

    if (!title) { showToast('일정 이름을 입력해주세요.', 'warning'); return; }
    if (!date)  { showToast('날짜를 선택해주세요.', 'warning'); return; }

    const ddays = DB.get('ddays');
    ddays.push({ id: Date.now().toString(), title, date, emoji, createdAt: Date.now() });
    DB.set('ddays', ddays);
    closeModal();
    showToast('D-Day가 추가되었습니다!', 'success');
    navigate('dday');
}

function deleteDday(id) {
    if (!confirm('이 D-Day를 삭제하시겠습니까?')) return;
    DB.set('ddays', DB.get('ddays').filter(d => d.id !== id));
    showToast('D-Day가 삭제되었습니다.', 'info');
    navigate('dday');
}

function openDdayEditModal(id) {
    const ddays = DB.get('ddays');
    const dday = ddays.find(d => d.id === id);
    if (!dday) return;

    const dateObj = new Date(dday.date + 'T00:00:00');
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;

    openModal('D-Day 수정', `
        <div class="form-group">
            <label>일정 이름</label>
            <input type="text" class="form-input" id="editDdayTitle" placeholder="예: 중간고사" maxlength="50" value="${escapeHtml(dday.title)}">
        </div>
        <div class="form-group">
            <label>날짜</label>
            <input type="date" class="form-input" id="editDdayDate" value="${dateStr}">
        </div>
        <div class="form-group">
            <label>이모지 (선택)</label>
            <div class="dday-emoji-picker" id="editDdayEmojiPicker">
                ${['📝','📚','🏃','🎉','🏫','🎓','✈️','🎄','🧪','🎵','⚽','🏆','📅','💡','🔔'].map(e => {
                    const selected = (dday.emoji || '📌') === e ? ' selected' : '';
                    return `<button type="button" class="emoji-btn${selected}" onclick="selectDdayEmoji(this,'${e}')">${e}</button>`;
                }).join('')}
            </div>
            <input type="hidden" id="editDdayEmoji" value="${dday.emoji || '📌'}">
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
            <button class="btn btn-ghost" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" onclick="saveDdayEdit('${id}')">수정 완료</button>
        </div>
    `);
}

function saveDdayEdit(id) {
    const title = document.getElementById('editDdayTitle').value.trim().slice(0, 50);
    const date  = document.getElementById('editDdayDate').value;
    const emoji = document.getElementById('editDdayEmoji').value || '📌';

    if (!title) { showToast('일정 이름을 입력해주세요.', 'warning'); return; }
    if (!date)  { showToast('날짜를 선택해주세요.', 'warning'); return; }

    const ddays = DB.get('ddays');
    const idx = ddays.findIndex(d => d.id === id);
    if (idx === -1) return;

    ddays[idx].title = title;
    ddays[idx].date = date;
    ddays[idx].emoji = emoji;
    DB.set('ddays', ddays);
    closeModal();
    showToast('D-Day가 수정되었습니다!', 'success');
    navigate('dday');
}
