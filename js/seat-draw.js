// =============================================
// 자리 뽑기
// =============================================

const SEAT_COLS_DEFAULT = 6;

// 줄별 배경 색상 (파스텔)
const SEAT_ROW_COLORS = [
    { bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.30)',  num: '#6366f1' },
    { bg: 'rgba(6,182,212,0.10)',   border: 'rgba(6,182,212,0.30)',   num: '#0891b2' },
    { bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.30)',  num: '#059669' },
    { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.30)',  num: '#d97706' },
    { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.30)',   num: '#dc2626' },
    { bg: 'rgba(168,85,247,0.10)',  border: 'rgba(168,85,247,0.30)',  num: '#9333ea' },
];

function _getSeatStudents() {
    return ACCOUNTS.filter(a => /^\d{5}$/.test(String(a.id))).sort((a, b) => Number(a.id) - Number(b.id));
}

function renderSeatDraw() {
    const saved    = DB.get('seat_layout', null);
    const cols     = DB.get('seat_cols', SEAT_COLS_DEFAULT);
    const students = _getSeatStudents();
    const n        = students.length;
    const rows     = Math.ceil(n / cols);
    const admin    = isAdmin();
    const seats    = saved || students.map(s => s.nickname);

    const colsOptions = [4,5,6,7,8].map(c =>
        `<option value="${c}" ${c === cols ? 'selected' : ''}>${c}열</option>`
    ).join('');

    const adminBar = admin ? `
        <div style="
            background:var(--bg-card);border:1.5px solid var(--border);border-radius:14px;
            padding:16px 20px;margin-bottom:24px;
            display:flex;gap:12px;align-items:center;flex-wrap:wrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.05)">
            <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:0.82rem;font-weight:600;color:var(--text-muted)">열 수</span>
                <select class="form-input" id="seatColsSelect"
                    style="width:auto;padding:7px 12px;font-size:0.85rem;border-radius:8px"
                    onchange="changeSeatCols(this.value)">${colsOptions}</select>
            </div>
            <div style="flex:1;min-width:0"></div>
            <button class="btn btn-primary" id="seatDrawBtn" onclick="startSeatDraw()"
                style="padding:10px 22px;font-size:0.9rem;gap:6px;display:flex;align-items:center">
                <span style="font-size:1.1rem">🎲</span> 자리 뽑기
            </button>
            <button onclick="resetSeatDraw()"
                style="padding:10px 16px;font-size:0.85rem;font-weight:600;border-radius:10px;
                    background:rgba(239,68,68,0.08);color:#dc2626;border:1.5px solid rgba(239,68,68,0.25);
                    cursor:pointer;transition:all 0.2s"
                onmouseover="this.style.background='rgba(239,68,68,0.15)'"
                onmouseout="this.style.background='rgba(239,68,68,0.08)'">
                🗑 초기화
            </button>
            <span style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap">
                셀 클릭 시 직접 편집
            </span>
        </div>
    ` : '';

    const statusBadge = saved
        ? `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(16,185,129,0.12);
            color:#059669;border:1px solid rgba(16,185,129,0.25);border-radius:20px;
            padding:3px 10px;font-size:0.75rem;font-weight:700">
            <span style="width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block"></span>
            배치 완료
           </span>`
        : `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(245,158,11,0.1);
            color:#d97706;border:1px solid rgba(245,158,11,0.25);border-radius:20px;
            padding:3px 10px;font-size:0.75rem;font-weight:700">
            미배치
           </span>`;

    // 칠판
    const blackboard = `
        <div style="text-align:center;margin-bottom:28px;position:relative">
            <div style="
                display:inline-block;position:relative;
                background:linear-gradient(160deg,#1a4731 0%,#14532d 50%,#166534 100%);
                color:#e2ffe8;padding:14px 0;width:min(100%,600px);border-radius:12px;
                font-weight:800;font-size:1rem;letter-spacing:0.18em;
                box-shadow:0 6px 24px rgba(20,83,45,0.35),inset 0 1px 0 rgba(255,255,255,0.08);
                border:3px solid #5a3e1b;
                text-shadow:0 1px 4px rgba(0,0,0,0.4)">
                <span style="opacity:0.5;font-size:0.7rem;position:absolute;top:5px;left:14px">✏</span>
                칠 판 (앞)
                <span style="opacity:0.5;font-size:0.7rem;position:absolute;top:5px;right:14px">✏</span>
            </div>
            <div style="margin:0 auto;width:min(80%,500px);height:8px;
                background:linear-gradient(90deg,transparent,rgba(91,62,27,0.4),transparent);
                border-radius:0 0 6px 6px"></div>
        </div>`;

    const gridHtml = _buildSeatGrid(seats, cols, rows, n);

    // 문 표시
    const doorHtml = `
        <div style="text-align:right;margin-top:20px;padding-right:4px">
            <span style="display:inline-flex;align-items:center;gap:6px;
                font-size:0.75rem;color:var(--text-muted);font-weight:600">
                <span style="display:inline-block;width:18px;height:24px;background:var(--bg-card);
                    border:2px solid var(--border);border-radius:3px 6px 6px 3px;
                    box-shadow:inset -2px 0 4px rgba(0,0,0,0.08);position:relative">
                    <span style="position:absolute;right:3px;top:50%;transform:translateY(-50%);
                        width:3px;height:3px;border-radius:50%;background:var(--text-muted)"></span>
                </span>
                출입구
            </span>
        </div>`;

    const footer = `
        <div style="display:flex;align-items:center;justify-content:space-between;
            margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
            <span style="font-size:0.78rem;color:var(--text-muted)">
                총 <strong style="color:var(--text-primary)">${n}명</strong> &nbsp;·&nbsp;
                <strong style="color:var(--text-primary)">${rows}줄</strong> × <strong style="color:var(--text-primary)">${cols}열</strong>
            </span>
            ${statusBadge}
        </div>`;

    return `
    <div class="page">
        <div class="page-header">
            <div>
                <h2 style="display:flex;align-items:center;gap:10px">🎲 자리 뽑기</h2>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">
                    ${admin ? '관리자 · 자리 뽑기 및 직접 편집 가능' : '담임선생님이 배정한 자리입니다'}
                </p>
            </div>
        </div>

        ${adminBar}

        <div class="card" style="padding:28px 24px;border-radius:16px;overflow:hidden">
            ${blackboard}
            <div id="seatGrid">${gridHtml}</div>
            ${doorHtml}
            ${footer}
        </div>
    </div>`;
}

function _buildSeatGrid(seats, cols, rows, n) {
    const admin = isAdmin();
    let html = `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;max-width:780px;margin:0 auto">`;
    for (let r = 0; r < rows; r++) {
        const color = SEAT_ROW_COLORS[r % SEAT_ROW_COLORS.length];
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            if (idx < n) {
                const name = seats[idx] || '?';
                const clickAttr = admin
                    ? `onclick="editSeat(${idx})" title="클릭하여 편집"`
                    : '';
                html += `
                <div class="seat-cell" id="seat-${idx}" ${clickAttr} style="
                    background:${color.bg};
                    border:1.5px solid ${color.border};
                    border-radius:12px;
                    padding:12px 6px 10px;
                    text-align:center;
                    transition:all 0.18s;
                    position:relative;
                    box-shadow:0 2px 8px rgba(0,0,0,0.05);
                    ${admin ? 'cursor:pointer' : ''}">
                    <div style="
                        position:absolute;top:6px;left:7px;
                        font-size:0.6rem;font-weight:800;
                        color:${color.num};
                        opacity:0.8;letter-spacing:0.02em">${idx + 1}</div>
                    ${admin ? `<div style="position:absolute;top:5px;right:7px;font-size:0.6rem;color:${color.num};opacity:0.45">✏</div>` : ''}
                    <div style="
                        width:34px;height:34px;border-radius:50%;
                        background:${color.border};
                        margin:0 auto 6px;
                        display:flex;align-items:center;justify-content:center;
                        font-size:1rem">
                        🧑‍🎓
                    </div>
                    <div class="seat-name" style="
                        font-size:0.78rem;font-weight:700;
                        color:var(--text-primary);
                        line-height:1.2;
                        word-break:keep-all">${escapeHtml(name)}</div>
                </div>`;
            } else {
                // 빈 자리
                html += `<div style="
                    border:1.5px dashed var(--border);border-radius:12px;
                    min-height:90px;opacity:0.35"></div>`;
            }
        }
    }
    html += '</div>';
    return html;
}

function editSeat(idx) {
    if (!isAdmin()) return;
    const cell = document.getElementById(`seat-${idx}`);
    if (!cell) return;
    const nameEl = cell.querySelector('.seat-name');
    if (!nameEl) return;
    const current = nameEl.textContent.trim();
    if (cell.querySelector('input')) return;

    cell.style.outline = '2px solid var(--primary)';
    cell.style.outlineOffset = '2px';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = current;
    input.maxLength = 20;
    input.style.cssText = `
        width:100%;border:none;outline:none;background:transparent;
        text-align:center;font-size:0.78rem;font-weight:700;
        color:var(--text-primary);padding:0;`;

    nameEl.replaceWith(input);
    input.focus();
    input.select();

    function save() {
        const val = input.value.trim() || current;
        const seats = DB.get('seat_layout', null) || _getSeatStudents().map(s => s.nickname);
        seats[idx] = val;
        DB.set('seat_layout', seats);
        const newNameEl = document.createElement('div');
        newNameEl.className = 'seat-name';
        newNameEl.style.cssText = 'font-size:0.78rem;font-weight:700;color:var(--text-primary);line-height:1.2;word-break:keep-all';
        newNameEl.textContent = val;
        input.replaceWith(newNameEl);
        cell.style.outline = '';
        showToast(`${idx + 1}번 자리: ${val}`, 'success');
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = current; input.blur(); }
    });
}

function changeSeatCols(val) {
    DB.set('seat_cols', parseInt(val));
    render();
}

function resetSeatDraw() {
    if (!isAdmin()) return;
    if (!confirm('자리 배치를 초기화할까요?')) return;
    DB.remove('seat_layout');
    showToast('자리 배치가 초기화되었습니다.', 'info');
    render();
}

let _seatAnimTimer = null;

function startSeatDraw() {
    if (!isAdmin()) { showToast('관리자만 자리를 뽑을 수 있습니다.', 'error'); return; }

    const students = _getSeatStudents();
    const n        = students.length;
    const names    = students.map(s => s.nickname);
    const shuffled = [...names].sort(() => Math.random() - 0.5);

    const btn = document.getElementById('seatDrawBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span style="font-size:1.1rem">⏳</span> 뽑는 중...'; }

    const grid = document.getElementById('seatGrid');
    if (!grid) return;

    let frame = 0;
    const totalFrames = 40;
    if (_seatAnimTimer) clearInterval(_seatAnimTimer);

    _seatAnimTimer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const temp = [...names].sort(() => Math.random() - 0.5);

        for (let i = 0; i < n; i++) {
            const el = document.getElementById(`seat-${i}`);
            if (!el) continue;
            const nameEl = el.querySelector('.seat-name');
            if (nameEl) nameEl.textContent = temp[i];

            // 속도가 느려지며 색상도 안정됨
            if (progress < 0.7) {
                const hue = Math.random() * 360;
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                el.style.background = `hsl(${hue},60%,${isDark ? '22%' : '90%'})`;
                el.style.borderColor = `hsl(${hue},60%,${isDark ? '38%' : '72%'})`;
            }
        }

        if (frame >= totalFrames) {
            clearInterval(_seatAnimTimer);
            _seatAnimTimer = null;

            const cols  = DB.get('seat_cols', SEAT_COLS_DEFAULT);
            const rows  = Math.ceil(n / cols);

            for (let i = 0; i < n; i++) {
                const el = document.getElementById(`seat-${i}`);
                if (!el) continue;
                const nameEl = el.querySelector('.seat-name');
                if (nameEl) nameEl.textContent = shuffled[i];

                // 원래 줄 색으로 복구
                const r = Math.floor(i / cols);
                const color = SEAT_ROW_COLORS[r % SEAT_ROW_COLORS.length];
                el.style.background  = color.bg;
                el.style.borderColor = color.border;
                el.style.transform   = 'scale(1.06)';
                el.style.boxShadow   = `0 4px 16px ${color.border}`;
                setTimeout(() => {
                    if (el) { el.style.transform = ''; el.style.boxShadow = ''; }
                }, 500 + i * 12);
            }

            DB.set('seat_layout', shuffled);
            if (btn) { btn.disabled = false; btn.innerHTML = '<span style="font-size:1.1rem">🎲</span> 자리 뽑기'; }

            // 상태 배지 업데이트
            const footer = document.querySelector('[data-seat-status]');
            showToast('🎉 자리 뽑기 완료!', 'success');
        }
    }, 45);
}
