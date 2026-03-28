// =============================================
// 시간표
// =============================================
function renderTimetable() {
    const dow = new Date().getDay(); // 0=일, 1=월 ... 5=금, 6=토
    const todayIdx = dow - 1; // 0=월 ... 4=금, -1 or 5=주말

    // ── 오늘 수업 가로 카드 바 ──
    let todayBarHtml = '';
    if (todayIdx >= 0 && todayIdx <= 4) {
        const todayChips = TIMETABLE.periods.map((p, pi) => {
            const c = TIMETABLE.schedule[pi][todayIdx];
            if (!c || !c.s) return '';
            const color = SUBJ_COLORS[c.s] || '#64748b';
            return `<div class="tt-today-chip" style="background:${color}">
                <span class="period-num">${p.num}교시 ${p.time}</span>
                <span style="font-size:1rem;font-weight:800;color:#fff">${c.s}</span>
                <span style="font-size:0.7rem;color:rgba(255,255,255,0.75)">${c.t}</span>
            </div>`;
        }).filter(Boolean).join('');

        const dayLabel = TIMETABLE.days[todayIdx] + '요일';
        todayBarHtml = `
        <div style="background:linear-gradient(135deg,var(--primary) 0%,var(--cyan) 100%);border-radius:var(--radius);padding:20px 24px;margin-bottom:20px;box-shadow:var(--shadow)">
            <div style="font-size:0.78rem;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:12px">📅 오늘 (${dayLabel}) 수업</div>
            <div class="tt-today-bar">
                ${todayChips || '<span style="color:rgba(255,255,255,0.7);font-size:0.88rem">오늘은 수업이 없거나 주말입니다.</span>'}
            </div>
        </div>`;
    } else {
        todayBarHtml = `
        <div style="background:linear-gradient(135deg,var(--primary) 0%,var(--cyan) 100%);border-radius:var(--radius);padding:20px 24px;margin-bottom:20px;box-shadow:var(--shadow)">
            <div style="font-size:0.88rem;font-weight:600;color:rgba(255,255,255,0.85)">📅 오늘은 주말이에요! 편히 쉬세요 🎉</div>
        </div>`;
    }

    // ── 전체 시간표 테이블 ──
    const rows = TIMETABLE.periods.map((p, pi) => {
        const cells = TIMETABLE.days.map((d, di) => {
            const c = TIMETABLE.schedule[pi][di];
            const isToday = di === todayIdx;
            const cls = isToday ? ' class="today-col"' : '';
            if (!c || !c.s) return `<td${cls}><span style="color:var(--text-muted);font-size:1.1rem;line-height:2.5rem">—</span></td>`;
            const color = SUBJ_COLORS[c.s] || '#64748b';
            return `<td${cls}><span class="subject-chip" style="background:${color}">${c.s}</span><span class="teacher">${c.t}</span></td>`;
        }).join('');
        return `<tr><td class="period-cell">${p.num}교시<br><small>${p.time}</small></td>${cells}</tr>`;
    }).join('');

    const headers = TIMETABLE.days.map((d, i) =>
        `<th${i === todayIdx ? ' class="today-col"' : ''}>${d}요일</th>`
    ).join('');

    return `
    <div class="page">
        <div class="page-header">
            <h2>📅 1학년 2반 시간표</h2>
            <p style="font-size:0.88rem;color:var(--text-muted)">은가람 중학교</p>
            <button class="btn btn-primary" onclick="downloadTimetable()" style="margin-top:12px">📥 시간표 저장</button>
        </div>
        ${todayBarHtml}
        <div class="card card-body">
            <div class="timetable-container">
                <table class="timetable">
                    <thead><tr><th>교시</th>${headers}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    </div>`;
}

// 시간표 저장 (이미지)
async function downloadTimetable() {
    const table = document.querySelector('.timetable');
    if (!table) {
        showToast('시간표를 찾을 수 없습니다.', 'error');
        return;
    }

    try {
        const canvas = await html2canvas(table, {
            scale: 2,
            backgroundColor: '#ffffff',
            padding: 10,
            logging: false
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `시간표_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
    } catch (err) {
        console.error('시간표 저장 실패:', err);
        showToast('시간표 저장에 실패했습니다.', 'error');
    }
}
