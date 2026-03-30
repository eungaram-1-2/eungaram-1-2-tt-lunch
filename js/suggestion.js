// =============================================
// 건의함/신고함
// =============================================
let sgSelectedType = null;

// 신고함 1개월 만료 자동 삭제
function sgPurgeExpiredReports() {
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
    const reports = DB.get('reports', []);
    const valid = reports.filter(r => (Date.now() - new Date(r.createdAt).getTime()) < ONE_MONTH);
    if (valid.length !== reports.length) DB.set('reports', valid);
}

function renderSuggestion() {
    sgPurgeExpiredReports();
    sgSelectedType = null;

    const user = currentUser();
    const studentId = user ? user.id : '';
    const userName  = user ? user.nickname : '';

    return `
    <div class="page">
        <div class="sg-form">

            <!-- 헤더 -->
            <div class="sg-header-card">
                <div class="sg-header-icon">📮</div>
                <h2 class="sg-header-title">1-2반 건의함 / 신고함</h2>
                <div class="sg-header-pills">
                    <span class="sg-pill sg-pill-blue">💬 건의 → 학급회의 반영</span>
                    <span class="sg-pill sg-pill-red">🚨 신고 → 담임선생님 전달</span>
                </div>
                <p class="sg-header-notice">신고자의 신원은 철저히 보호됩니다.</p>
            </div>

            <!-- 진행 표시 -->
            <div class="sg-progress-bar"><div class="sg-progress-fill" id="sgProgress" style="width:0%"></div></div>

            <!-- 카드1: 학번 -->
            <div class="sg-card sg-card-active">
                <div class="sg-card-num">01</div>
                <label class="sg-label">학번 <span class="sg-required">*</span></label>
                <div class="sg-input-wrap">
                    <input type="text" id="sg-student-id" class="sg-input" placeholder="예: 10201" value="${studentId}" oninput="sgUpdateProgress()">
                </div>
                ${studentId ? `<p class="sg-helper">✓ 로그인된 계정: <strong>${studentId}</strong></p>` : `<p class="sg-helper" style="color:var(--danger)">미로그인 상태입니다</p>`}
            </div>

            <!-- 카드2: 이름 -->
            <div class="sg-card">
                <div class="sg-card-num">02</div>
                <label class="sg-label">귀하의 이름 <span class="sg-required">*</span></label>
                <div class="sg-input-wrap">
                    <input type="text" id="sg-name" class="sg-input" placeholder="예: 홍길동" value="${userName}" oninput="sgUpdateProgress()">
                </div>
            </div>

            <!-- 카드3: 건의/신고 선택 -->
            <div class="sg-card">
                <div class="sg-card-num">03</div>
                <label class="sg-label">건의인가요, 신고인가요? <span class="sg-required">*</span></label>
                <div class="sg-type-selector">
                    <label class="sg-type-btn" id="sg-type-btn-건의" onclick="sgToggleType('건의')">
                        <input type="radio" name="sg-type" value="건의" style="display:none">
                        <span class="sg-type-icon">💬</span>
                        <span class="sg-type-name">건의</span>
                        <span class="sg-type-desc">학급회의에서 검토해요</span>
                    </label>
                    <label class="sg-type-btn" id="sg-type-btn-신고" onclick="sgToggleType('신고')">
                        <input type="radio" name="sg-type" value="신고" style="display:none">
                        <span class="sg-type-icon">🚨</span>
                        <span class="sg-type-name">신고</span>
                        <span class="sg-type-desc">담임선생님께 전달돼요</span>
                    </label>
                </div>
            </div>

            <!-- 건의 섹션 -->
            <div id="sg-section-suggestion" class="sg-section-hidden">
                <div class="sg-card">
                    <div class="sg-card-num">04</div>
                    <label class="sg-label">건의할 내용 <span class="sg-required">*</span></label>
                    <div class="sg-textarea-wrap">
                        <textarea id="sg-suggestion-content" class="sg-textarea"
                            placeholder="어떤 점을 건의하고 싶으신가요? 구체적으로 적어주실수록 좋아요."
                            rows="5" maxlength="1000" oninput="sgCountChars('sg-suggestion-content','sg-suggestion-count',1000);sgUpdateProgress()"></textarea>
                    </div>
                    <div class="sg-char-bar">
                        <span id="sg-suggestion-count" class="sg-char-count">0 / 1000</span>
                    </div>
                </div>

                <div class="sg-card">
                    <div class="sg-card-num">05</div>
                    <label class="sg-label">학급회의 등에서 이름을 공개할까요? <span class="sg-required">*</span></label>
                    <div class="sg-radio-group">
                        <label class="sg-radio-option">
                            <input type="radio" name="sg-name-public" value="yes" checked>
                            <span class="sg-radio-box"></span>
                            <div class="sg-radio-text">
                                <span class="sg-radio-main">이름 공개 허용합니다</span>
                                <span class="sg-radio-sub">학급회의에서 발의자로 소개될 수 있어요</span>
                            </div>
                        </label>
                        <label class="sg-radio-option">
                            <input type="radio" name="sg-name-public" value="no">
                            <span class="sg-radio-box"></span>
                            <div class="sg-radio-text">
                                <span class="sg-radio-main">이름 공개 허용하지 않습니다</span>
                                <span class="sg-radio-sub">익명으로 처리됩니다</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- 신고 섹션 -->
            <div id="sg-section-report" class="sg-section-hidden">
                <div class="sg-info-banner">
                    🔒 신고자 정보는 담임선생님 외에 누구에게도 공개되지 않습니다.
                </div>

                <div class="sg-card">
                    <div class="sg-card-num">04</div>
                    <label class="sg-label">신고할 사람의 이름 <span class="sg-required">*</span></label>
                    <div class="sg-input-wrap">
                        <input type="text" id="sg-report-target" class="sg-input" placeholder="예: 홍길동" oninput="sgUpdateProgress()">
                    </div>
                </div>

                <div class="sg-card">
                    <div class="sg-card-num">05</div>
                    <label class="sg-label">신고 사유 <span class="sg-required">*</span></label>
                    <div class="sg-textarea-wrap">
                        <textarea id="sg-report-reason" class="sg-textarea"
                            placeholder="어떤 일이 있었는지 구체적으로 적어주세요. 날짜, 장소, 상황을 포함하면 도움이 됩니다."
                            rows="5" maxlength="1000" oninput="sgCountChars('sg-report-reason','sg-report-count',1000);sgUpdateProgress()"></textarea>
                    </div>
                    <div class="sg-char-bar">
                        <span id="sg-report-count" class="sg-char-count">0 / 1000</span>
                    </div>
                </div>
            </div>

            <!-- 제출 버튼 -->
            <button class="sg-submit-btn" onclick="sgSubmit()" id="sgSubmitBtn">
                <span>제출하기</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>

        </div>
    </div>`;
}

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
