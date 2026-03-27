// =============================================
// 자리 뽑기
// =============================================

const SEAT_COLS_DEFAULT = 6;

function _getSeatStudents() {
    return ACCOUNTS.filter(a => /^\d{5}$/.test(String(a.id))).sort((a, b) => Number(a.id) - Number(b.id));
}

function renderSeatDraw() {
    const saved   = DB.get('seat_layout', null);
    const cols    = DB.get('seat_cols', SEAT_COLS_DEFAULT);
    const students = _getSeatStudents();
    const n       = students.length;
    const rows    = Math.ceil(n / cols);

    const admin   = isAdmin();

    // 저장된 배치 or 빈 상태
    let seats = saved || students.map(s => s.nickname);

    const colsOptions = [4,5,6,7,8].map(c =>
        `<option value="${c}" ${c === cols ? 'selected' : ''}>${c}열</option>`
    ).join('');

    const adminControls = admin ? `
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
            <select class="form-input" id="seatColsSelect" style="width:auto;padding:8px 12px"
                onchange="changeSeatCols(this.value)">${colsOptions}</select>
            <button class="btn btn-primary" id="seatDrawBtn" onclick="startSeatDraw()">🎲 자리 뽑기</button>
            <button class="btn btn-outline" onclick="resetSeatDraw()" style="color:var(--danger);border-color:var(--danger)">초기화</button>
        </div>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:20px">관리자만 자리를 뽑을 수 있습니다. 결과는 모든 학생에게 보입니다.</p>
    ` : `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px">담임선생님이 뽑은 자리 배치입니다.</p>`;

    const boardHtml = `
        <div style="text-align:center;margin-bottom:20px">
            <div style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;
                padding:10px 80px;border-radius:8px;font-weight:700;font-size:0.95rem;letter-spacing:0.08em;
                box-shadow:0 4px 16px rgba(59,130,246,0.4)">칠 판</div>
        </div>`;

    const gridHtml = _buildSeatGrid(seats, cols, rows, n);

    const legendHtml = `
        <div style="margin-top:24px;font-size:0.8rem;color:var(--text-muted);text-align:center">
            총 ${n}명 · ${rows}줄 × ${cols}열
            ${!saved ? ' · 아직 자리를 뽑지 않았습니다' : ''}
        </div>`;

    return `
    <div class="page">
        <div class="page-header">
            <h2>🎲 자리 뽑기</h2>
        </div>
        ${adminControls}
        <div class="card" style="padding:28px">
            ${boardHtml}
            <div id="seatGrid">${gridHtml}</div>
            ${legendHtml}
        </div>
    </div>`;
}

function _buildSeatGrid(seats, cols, rows, n) {
    let html = `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;max-width:700px;margin:0 auto">`;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            if (idx < n) {
                const name = seats[idx] || '?';
                html += `
                <div class="seat-cell" id="seat-${idx}" style="
                    background:var(--bg-card);border:2px solid var(--border);border-radius:10px;
                    padding:10px 4px;text-align:center;font-size:0.82rem;font-weight:700;
                    color:var(--text-primary);transition:all 0.2s;
                    box-shadow:0 2px 6px rgba(0,0,0,0.06)">
                    <div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:2px">${idx + 1}번</div>
                    <div class="seat-name">${escapeHtml(name)}</div>
                </div>`;
            } else {
                html += `<div></div>`;
            }
        }
    }
    html += '</div>';
    return html;
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
    const cols     = DB.get('seat_cols', SEAT_COLS_DEFAULT);
    const rows     = Math.ceil(n / cols);

    // 셔플된 최종 결과
    const names    = students.map(s => s.nickname);
    const shuffled = [...names].sort(() => Math.random() - 0.5);

    const btn = document.getElementById('seatDrawBtn');
    if (btn) btn.disabled = true;

    const grid = document.getElementById('seatGrid');
    if (!grid) return;

    // 셀에 랜덤 깜빡임 애니메이션 (1.8초)
    let frame = 0;
    const totalFrames = 36;
    if (_seatAnimTimer) clearInterval(_seatAnimTimer);

    _seatAnimTimer = setInterval(() => {
        frame++;
        const temp = [...names].sort(() => Math.random() - 0.5);
        for (let i = 0; i < n; i++) {
            const el = document.getElementById(`seat-${i}`);
            if (el) {
                const nameEl = el.querySelector('.seat-name');
                if (nameEl) nameEl.textContent = temp[i];
                el.style.background = `hsl(${Math.random()*360},70%,${getComputedStyle(document.documentElement).getPropertyValue('--theme') === 'dark' ? '25%' : '92%'})`;
            }
        }

        if (frame >= totalFrames) {
            clearInterval(_seatAnimTimer);
            _seatAnimTimer = null;

            // 최종 결과 표시
            for (let i = 0; i < n; i++) {
                const el = document.getElementById(`seat-${i}`);
                if (el) {
                    const nameEl = el.querySelector('.seat-name');
                    if (nameEl) nameEl.textContent = shuffled[i];
                    el.style.background = '';
                    el.style.border = '2px solid var(--primary)';
                    el.style.transform = 'scale(1.04)';
                    setTimeout(() => {
                        if (el) { el.style.border = ''; el.style.transform = ''; }
                    }, 600);
                }
            }

            DB.set('seat_layout', shuffled);
            if (btn) btn.disabled = false;
            showToast('🎉 자리 뽑기 완료!', 'success');
        }
    }, 50);
}
