// =============================================
// 건의함/신고함
// =============================================
let sgSelectedType = null;

function renderSuggestion() {
    const user = currentUser();
    const studentId = user ? user.id : '';
    const userName = user ? user.nickname : '';

    return `
    <div class="page">
        <div class="sg-form">
            <!-- 헤더 카드 -->
            <div class="sg-header-card">
                <h2 style="margin-bottom:8px;font-size:1.5rem;font-weight:800">1-2반 건의함/신고함</h2>
                <p style="font-size:0.95rem;color:var(--text-secondary);line-height:1.6;margin-bottom:0">
                    건의사항은 학급회의에서 검토하여 반영합니다.<br>
                    신고사항은 담임선생님께 보고되며, 신고자의 신원은 보호됩니다.
                </p>
            </div>

            <!-- 카드1: 학번 -->
            <div class="sg-card">
                <label class="sg-label">학번 <span class="sg-required">*</span></label>
                <div class="sg-input-wrap">
                    <input type="text" id="sg-student-id" class="sg-input" placeholder="예: 10201" value="${studentId}">
                </div>
                <p class="sg-helper">현재 로그인한 계정: ${studentId || '미로그인 상태'}</p>
            </div>

            <!-- 카드2: 이름 -->
            <div class="sg-card">
                <label class="sg-label">귀하의 이름 <span class="sg-required">*</span></label>
                <div class="sg-input-wrap">
                    <input type="text" id="sg-name" class="sg-input" placeholder="예: 홍길동" value="${userName}">
                </div>
            </div>

            <!-- 카드3: 건의/신고 선택 -->
            <div class="sg-card">
                <label class="sg-label">건의인가요, 신고인가요? <span class="sg-required">*</span></label>
                <div class="sg-radio-group">
                    <div class="sg-radio-option">
                        <label>
                            <input type="radio" name="sg-type" value="건의" onchange="sgToggleType('건의')">
                            <span>건의</span>
                        </label>
                    </div>
                    <div class="sg-radio-option">
                        <label>
                            <input type="radio" name="sg-type" value="신고" onchange="sgToggleType('신고')">
                            <span>신고</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- 건의 섹션 -->
            <div id="sg-section-suggestion" style="display:none">
                <!-- 카드4a: 건의 내용 -->
                <div class="sg-card">
                    <label class="sg-label">건의할 내용 <span class="sg-required">*</span></label>
                    <div class="sg-textarea-wrap">
                        <textarea id="sg-suggestion-content" class="sg-textarea" placeholder="건의사항을 자세히 적어주세요. (최대 1000자)" rows="6" maxlength="1000"></textarea>
                    </div>
                    <p class="sg-helper" id="sg-suggestion-count">0 / 1000</p>
                </div>

                <!-- 카드5a: 이름 공개 여부 -->
                <div class="sg-card">
                    <label class="sg-label">학급회의 등에서 이름을 공개할 것인지에 대한 여부 <span class="sg-required">*</span></label>
                    <div class="sg-radio-group">
                        <div class="sg-radio-option">
                            <label>
                                <input type="radio" name="sg-name-public" value="yes" checked>
                                <span>이름 공개 허용합니다</span>
                            </label>
                        </div>
                        <div class="sg-radio-option">
                            <label>
                                <input type="radio" name="sg-name-public" value="no">
                                <span>이름 공개 허용하지 않습니다</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 신고 섹션 -->
            <div id="sg-section-report" style="display:none">
                <!-- 카드4b: 신고 대상 -->
                <div class="sg-card">
                    <label class="sg-label">신고할 사람의 이름 <span class="sg-required">*</span></label>
                    <div class="sg-input-wrap">
                        <input type="text" id="sg-report-target" class="sg-input" placeholder="예: 홍길동">
                    </div>
                </div>

                <!-- 카드5b: 신고 사유 -->
                <div class="sg-card">
                    <label class="sg-label">신고 사유 <span class="sg-required">*</span></label>
                    <div class="sg-textarea-wrap">
                        <textarea id="sg-report-reason" class="sg-textarea" placeholder="신고 사유를 자세히 적어주세요. (최대 1000자)" rows="6" maxlength="1000"></textarea>
                    </div>
                    <p class="sg-helper" id="sg-report-count">0 / 1000</p>
                </div>

                <!-- 신고 안내 메시지 -->
                <div class="sg-notice">
                    <span style="font-weight:700">📍 신고 안내</span><br>
                    신고자의 신원은 철저히 보호되며, 담임선생님께만 보고됩니다.
                </div>
            </div>

            <!-- 제출 버튼 -->
            <div style="margin-top:32px;margin-bottom:32px">
                <button class="btn btn-primary" onclick="sgSubmit()" style="width:100%;height:48px;font-size:1rem;font-weight:700">제출</button>
            </div>
        </div>
    </div>`;
}

function sgToggleType(type) {
    sgSelectedType = type;
    const suggestionSection = document.getElementById('sg-section-suggestion');
    const reportSection = document.getElementById('sg-section-report');

    if (type === '건의') {
        suggestionSection.style.display = 'block';
        reportSection.style.display = 'none';
    } else if (type === '신고') {
        suggestionSection.style.display = 'none';
        reportSection.style.display = 'block';
    }

    // 텍스트 카운트 업데이트
    updateTextCounts();
}

function updateTextCounts() {
    const suggestionContent = document.getElementById('sg-suggestion-content');
    const reportReason = document.getElementById('sg-report-reason');
    const suggestionCount = document.getElementById('sg-suggestion-count');
    const reportCount = document.getElementById('sg-report-count');

    if (suggestionContent && suggestionCount) {
        suggestionContent.addEventListener('input', () => {
            suggestionCount.textContent = suggestionContent.value.length + ' / 1000';
        });
    }

    if (reportReason && reportCount) {
        reportReason.addEventListener('input', () => {
            reportCount.textContent = reportReason.value.length + ' / 1000';
        });
    }
}

function sgSubmit() {
    const studentId = document.getElementById('sg-student-id')?.value?.trim();
    const name = document.getElementById('sg-name')?.value?.trim();
    const type = sgSelectedType;

    // 기본 필드 검증
    if (!studentId) { showToast('학번을 입력해주세요.', 'error'); return; }
    if (!name) { showToast('이름을 입력해주세요.', 'error'); return; }
    if (!type) { showToast('건의 또는 신고를 선택해주세요.', 'error'); return; }

    let item = {
        id: Date.now(),
        type: type,
        studentId: studentId,
        name: name,
        createdAt: new Date().toISOString()
    };

    if (type === '건의') {
        const content = document.getElementById('sg-suggestion-content')?.value?.trim();
        if (!content) { showToast('건의할 내용을 입력해주세요.', 'error'); return; }
        if (content.length > 1000) { showToast('건의 내용은 1000자 이내여야 합니다.', 'error'); return; }

        const namePublic = document.querySelector('input[name="sg-name-public"]:checked')?.value === 'yes';

        item.content = content;
        item.namePublic = namePublic;
    } else if (type === '신고') {
        const targetName = document.getElementById('sg-report-target')?.value?.trim();
        const reason = document.getElementById('sg-report-reason')?.value?.trim();

        if (!targetName) { showToast('신고할 사람의 이름을 입력해주세요.', 'error'); return; }
        if (!reason) { showToast('신고 사유를 입력해주세요.', 'error'); return; }
        if (reason.length > 1000) { showToast('신고 사유는 1000자 이내여야 합니다.', 'error'); return; }

        item.targetName = targetName;
        item.reason = reason;
    }

    // DB에 저장 (건의와 신고를 분리해서 저장)
    if (type === '건의') {
        const suggestions = DB.get('suggestions', []);
        suggestions.unshift(item);
        DB.set('suggestions', suggestions);
    } else if (type === '신고') {
        const reports = DB.get('reports', []);
        reports.unshift(item);
        DB.set('reports', reports);
    }

    // 로그 기록
    if (type === '신고') {
        addLog('report_created', { studentId: studentId, targetName: item.targetName, reason: item.reason.substring(0, 100) });
    } else {
        addLog('suggestion_created', { studentId: studentId, content: item.content.substring(0, 100) });
    }

    // 피드백
    showToast(type === '건의' ? '건의사항이 접수되었습니다. 감사합니다!' : '신고가 접수되었습니다. 신원은 철저히 보호됩니다.', 'success');

    // 폼 초기화 후 이동
    setTimeout(() => navigate('links'), 1000);
}
