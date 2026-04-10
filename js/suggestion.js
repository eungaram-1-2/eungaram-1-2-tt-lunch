// =============================================
// 건의함/신고함 (Google Forms로 대체됨)
// =============================================
let sgSelectedType = null;

// 신고함 1개월 만료 자동 삭제
/*
function sgPurgeExpiredReports() {
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
    const reports = DB.get('reports', []);
    const valid = reports.filter(r => (Date.now() - new Date(r.createdAt).getTime()) < ONE_MONTH);
    if (valid.length !== reports.length) DB.set('reports', valid);
}
*/

function renderSuggestion() {
    // Google Forms로 리다이렉트
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSc1s4oIvfvoT_GbvdFU95ZglDqYvsfngXrwZOaiaeDDC2NsiA/viewform?usp=header';
    window.location.href = formUrl;

    return `<div class="page"><p>Google Forms로 이동 중입니다...</p></div>`;
}

/*
function sgToggleType(type) {
    sgSelectedType = type;

    // 버튼 활성화 스타일
    ['건의', '신고'].forEach(t => {
        const btn = document.getElementById('sg-type-btn-' + t);
        if (!btn) return;
        if (t === type) btn.classList.add('sg-type-btn-active');
        else btn.classList.remove('sg-type-btn-active');
    });

    const ss = document.getElementById('sg-section-suggestion');
    const rs = document.getElementById('sg-section-report');

    if (type === '건의') {
        ss.classList.remove('sg-section-hidden'); ss.classList.add('sg-section-visible');
        rs.classList.remove('sg-section-visible'); rs.classList.add('sg-section-hidden');
    } else {
        rs.classList.remove('sg-section-hidden'); rs.classList.add('sg-section-visible');
        ss.classList.remove('sg-section-visible'); ss.classList.add('sg-section-hidden');
    }

    sgUpdateProgress();
}

function sgCountChars(textareaId, countId, max) {
    const ta = document.getElementById(textareaId);
    const cnt = document.getElementById(countId);
    if (!ta || !cnt) return;
    const len = ta.value.length;
    cnt.textContent = len + ' / ' + max;
    cnt.style.color = len > max * 0.9 ? 'var(--danger)' : 'var(--text-muted)';
}

function sgUpdateProgress() {
    const id = document.getElementById('sg-student-id')?.value?.trim();
    const name = document.getElementById('sg-name')?.value?.trim();
    const type = sgSelectedType;
    let filled = 0, total = 3;
    if (id) filled++;
    if (name) filled++;
    if (type) {
        filled++;
        if (type === '건의') {
            total = 5;
            if (document.getElementById('sg-suggestion-content')?.value?.trim()) filled++;
            filled++; // 공개여부는 기본값 있음
        } else if (type === '신고') {
            total = 5;
            if (document.getElementById('sg-report-target')?.value?.trim()) filled++;
            if (document.getElementById('sg-report-reason')?.value?.trim()) filled++;
        }
    }
    const pct = Math.min(100, Math.round(filled / total * 100));
    const bar = document.getElementById('sgProgress');
    if (bar) bar.style.width = pct + '%';
}

function sgSubmit() {
    const studentId = document.getElementById('sg-student-id')?.value?.trim();
    const name = document.getElementById('sg-name')?.value?.trim();
    const type = sgSelectedType;

    if (!studentId) { showToast('학번을 입력해주세요.', 'error'); return; }
    if (!name) { showToast('이름을 입력해주세요.', 'error'); return; }
    if (!type) { showToast('건의 또는 신고를 선택해주세요.', 'error'); return; }

    let item = { id: Date.now(), type, studentId, name, createdAt: new Date().toISOString() };

    if (type === '건의') {
        const content = document.getElementById('sg-suggestion-content')?.value?.trim();
        if (!content) { showToast('건의할 내용을 입력해주세요.', 'error'); return; }
        if (content.length > 1000) { showToast('건의 내용은 1000자 이내여야 합니다.', 'error'); return; }
        item.content = content;
        item.namePublic = document.querySelector('input[name="sg-name-public"]:checked')?.value === 'yes';

        const suggestions = DB.get('suggestions', []);
        suggestions.unshift(item);
        DB.set('suggestions', suggestions);
        addLog('suggestion_created', { studentId, content: content.substring(0, 100) });
    } else {
        const targetName = document.getElementById('sg-report-target')?.value?.trim();
        const reason = document.getElementById('sg-report-reason')?.value?.trim();
        if (!targetName) { showToast('신고할 사람의 이름을 입력해주세요.', 'error'); return; }
        if (!reason) { showToast('신고 사유를 입력해주세요.', 'error'); return; }
        if (reason.length > 1000) { showToast('신고 사유는 1000자 이내여야 합니다.', 'error'); return; }
        item.targetName = targetName;
        item.reason = reason;

        sgPurgeExpiredReports();
        const reports = DB.get('reports', []);
        reports.unshift(item);
        DB.set('reports', reports);
        addLog('report_created', { studentId, targetName, reason: reason.substring(0, 100) });
    }

    // 제출 버튼 완료 상태
    const btn = document.getElementById('sgSubmitBtn');
    if (btn) { btn.textContent = '✓ 제출 완료'; btn.disabled = true; btn.classList.add('sg-submit-done'); }

    const bar = document.getElementById('sgProgress');
    if (bar) bar.style.width = '100%';

    showToast(type === '건의' ? '건의사항이 접수되었습니다. 감사합니다!' : '신고가 접수되었습니다. 신원은 철저히 보호됩니다.', 'success');
    setTimeout(() => navigate('links'), 1500);
}
*/
