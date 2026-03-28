// =============================================
// 데이터 내보내기 / 불러오기
// =============================================
function exportData() {
    const data = {
        exported: new Date().toISOString(),
        notices: DB.get('notices'),
        board: DB.get('board'),
        votes: DB.get('votes'),
        ddays: DB.get('ddays'),
        comments_notices: {},
        comments_board: {}
    };

    // 모든 comments 데이터 포함
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
        if (key.startsWith('comments_notices_')) {
            const postId = key.replace('comments_notices_', '');
            data.comments_notices[postId] = DB.get(key);
        } else if (key.startsWith('comments_board_')) {
            const postId = key.replace('comments_board_', '');
            data.comments_board[postId] = DB.get(key);
        }
    });

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eungaram-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ 데이터 다운로드 완료!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);

                if (data.notices) DB.set('notices', data.notices);
                if (data.board) DB.set('board', data.board);
                if (data.votes) DB.set('votes', data.votes);
                if (data.ddays) DB.set('ddays', data.ddays);

                if (data.comments_notices) {
                    Object.entries(data.comments_notices).forEach(([postId, comments]) => {
                        DB.set(`comments_notices_${postId}`, comments);
                    });
                }
                if (data.comments_board) {
                    Object.entries(data.comments_board).forEach(([postId, comments]) => {
                        DB.set(`comments_board_${postId}`, comments);
                    });
                }

                showToast(`✅ 데이터 불러오기 완료! (공지 ${data.notices?.length || 0}개)`, 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                showToast('❌ 파일 형식이 잘못되었습니다.', 'error');
                console.error('Import error:', err);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// =============================================
// 관리자 메뉴
// =============================================
let _adminUnlisten = null;

function _formatLastSeen(ts) {
    if (!ts) return '기록 없음';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 10)   return '방금 전';
    if (diff < 60)   return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400)return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}

function _fmtTimeoutRemain(until) {
    const ms = until - Date.now();
    if (ms <= 0) return '만료';
    const s  = Math.floor(ms / 1000);
    const dd = Math.floor(s / 86400);
    const hh = Math.floor((s % 86400) / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const pad = n => String(n).padStart(2, '0');
    if (dd > 0) return `${dd}일 ${pad(hh)}:${pad(mm)} 후 해제`;
    if (hh > 0) return `${pad(hh)}:${pad(mm)}:${pad(s % 60)} 후 해제`;
    return `${pad(mm)}:${pad(s % 60)} 후 해제`;
}

function _formatDuration(ms) {
    if (!ms || ms < 0) return '—';
    const s = Math.floor(ms / 1000);
    if (s < 60) return '방금';
    const mm = Math.floor(s / 60);
    if (mm < 60) return `${mm}분`;
    const hh = Math.floor(mm / 60);
    const m = mm % 60;
    if (hh < 24) return `${hh}시간 ${m}분`;
    const dd = Math.floor(hh / 24);
    const h = hh % 24;
    return `${dd}일 ${h}시간`;
}

function _buildAdminRows() {
    const bans  = DB.get('bans');
    const users = ACCOUNTS.filter(a => a.role !== 'admin');
    return users.map(u => {
        const banned  = bans.includes(u.id);
        const timeout = getTimeoutInfo(u.id);
        const online  = sessionIsOnline(u.id);
        const sess    = sessionGet(u.id);
        const lastSeen = sess?.lastSeen || 0;
        const connectedAt = sess?.connectedAt || 0;
        const duration = online && connectedAt ? _formatDuration(Date.now() - connectedAt) : '—';

        let accountBadge;
        if (banned) {
            accountBadge = `<span class="adm-badge adm-badge-banned">🚫 정지됨</span>`;
        } else if (timeout) {
            accountBadge = `<span class="adm-badge adm-badge-timeout" title="해제: ${new Date(timeout.until).toLocaleString('ko-KR')}">⏳ ${_fmtTimeoutRemain(timeout.until)}</span>`;
        } else {
            accountBadge = `<span class="adm-badge adm-badge-active">✓ 활성</span>`;
        }

        const onlineBadge = online
            ? `<span class="adm-badge adm-badge-online"><span class="adm-dot"></span>접속중</span>`
            : `<span class="adm-badge adm-badge-offline">${lastSeen ? _formatLastSeen(lastSeen) : '미접속'}</span>`;

        // const banBtn = banned
        //     ? `<button class="adm-btn adm-btn-safe" onclick="unbanUser('${escapeHtml(u.id)}')">해제</button>`
        //     : `<button class="adm-btn adm-btn-danger" onclick="banUser('${escapeHtml(u.id)}')">정지</button>`;
        const banBtn = ''; // 정지 기능 비활성화
        // const toBtn = timeout
        //     ? `<button class="adm-btn adm-btn-safe" onclick="clearTimeoutUser('${escapeHtml(u.id)}')">TO 해제</button>`
        //     : `<button class="adm-btn adm-btn-warn" onclick="showTimeoutModal('${escapeHtml(u.id)}')">⏳</button>`;
        const toBtn = ''; // 타임아웃 기능 비활성화

        const rowBg = online ? 'adm-row-online' : banned ? 'adm-row-banned' : '';

        return `
        <tr class="adm-row ${rowBg}">
            <td><span class="adm-username">${escapeHtml(u.username)}</span></td>
            <td><span class="adm-nickname">${escapeHtml(u.nickname)}</span></td>
            <td>${accountBadge}</td>
            <td>${onlineBadge}</td>
            <td class="duration-cell adm-duration" data-ts="${connectedAt}">${duration}</td>
            <td><div class="adm-actions">${banBtn}${toBtn}</div></td>
        </tr>`;
    }).join('');
}

function _buildAdminMemberRows() {
    const admins = ACCOUNTS.filter(a => a.role === 'admin');
    return admins.map(u => {
        const online  = sessionIsOnline(u.id);
        const sess    = sessionGet(u.id);
        const lastSeen = sess?.lastSeen || 0;
        const connectedAt = sess?.connectedAt || 0;
        const duration = online && connectedAt ? _formatDuration(Date.now() - connectedAt) : '—';

        const onlineBadge = online
            ? `<span class="adm-badge adm-badge-online"><span class="adm-dot"></span>접속중</span>`
            : `<span class="adm-badge adm-badge-offline">${lastSeen ? _formatLastSeen(lastSeen) : '미접속'}</span>`;

        return `
        <tr class="adm-row ${online ? 'adm-row-online' : ''}">
            <td><span class="adm-username">${escapeHtml(u.username)}</span></td>
            <td><span class="adm-nickname">${escapeHtml(u.nickname)}</span></td>
            <td>${onlineBadge}</td>
            <td class="duration-cell adm-duration" data-ts="${connectedAt}">${duration}</td>
        </tr>`;
    }).join('');
}

function _updateAdminStats() {
    const bans       = DB.get('bans');
    const users      = ACCOUNTS.filter(a => a.role !== 'admin');
    const onlineCount= users.filter(u => sessionIsOnline(u.id)).length;
    const bannedCount= users.filter(u => bans.includes(u.id)).length;

    const el = document.getElementById('adminOnlineCount');
    if (el) el.innerHTML =
        `전체 <strong>${users.length}</strong>명 &nbsp;·&nbsp; ` +
        `<span style="color:var(--success)">접속중 <strong>${onlineCount}</strong>명</span> &nbsp;·&nbsp; ` +
        `정지 <strong>${bannedCount}</strong>명`;
}

function renderAdmin() {
    if (!isAdmin()) { navigate('home'); return ''; }

    // 이전 리스너 정리
    if (_adminUnlisten) { _adminUnlisten(); _adminUnlisten = null; }

    const bans       = DB.get('bans');
    const users      = ACCOUNTS.filter(a => a.role !== 'admin');
    const bannedCount= users.filter(u => bans.includes(u.id)).length;
    const onlineCount= users.filter(u => sessionIsOnline(u.id)).length;
    const postsCount = DB.get('board', []).length;
    const noticesCount = DB.get('notices', []).length;

    const fbLabel = fbReady()
        ? `<span class="firebase-badge">🔴 실시간</span>`
        : `<span class="firebase-badge firebase-badge-off">localStorage</span>`;

    setTimeout(() => {
        // 실시간 리스너 등록 (Firebase or 폴링)
        _adminUnlisten = sessionListenAll(() => {
            const tbody = document.getElementById('adminTbody');
            const mtbody = document.getElementById('adminMemberTbody');
            if (!tbody && !mtbody) { if (_adminUnlisten) { _adminUnlisten(); _adminUnlisten = null; } return; }
            if (tbody) tbody.innerHTML = _buildAdminRows();
            if (mtbody) mtbody.innerHTML = _buildAdminMemberRows();
            _updateAdminStats();
        });

        // 체류 시간 갱신 (30초마다)
        if (window._dashInterval) clearInterval(window._dashInterval);
        window._dashInterval = setInterval(() => {
            const cells = document.querySelectorAll('.duration-cell[data-ts]');
            cells.forEach(cell => {
                const ts = parseInt(cell.dataset.ts);
                if (ts > 0) {
                    cell.textContent = _formatDuration(Date.now() - ts);
                }
            });
        }, 30000);
    }, 0);

    return `
    <div class="page adm-page">

        <!-- 헤더 -->
        <div class="adm-hero">
            <div class="adm-hero-left">
                <div class="adm-hero-icon">⚙️</div>
                <div>
                    <h2 class="adm-hero-title">관리자 대시보드</h2>
                    <p class="adm-hero-sub">은가람 중학교 1학년 2반 &nbsp;·&nbsp; ${fbLabel}</p>
                </div>
            </div>
            <div class="adm-hero-actions">
                <button class="btn btn-outline btn-sm" onclick="navigate('logs')">📋 활동 로그</button>
                <button class="btn btn-outline btn-sm" onclick="navigate('boardlog')">📋 게시판 로그</button>
                <button class="btn btn-outline btn-sm" onclick="exportData()">📥 데이터 다운로드</button>
                <button class="btn btn-outline btn-sm" onclick="importData()">📤 데이터 업로드</button>
            </div>
        </div>

        <!-- 통계 카드 -->
        <div class="adm-stats">
            <div class="adm-stat-card" style="--c:#4f46e5">
                <div class="adm-stat-icon">👥</div>
                <div class="adm-stat-body">
                    <div class="adm-stat-num">${users.length}</div>
                    <div class="adm-stat-label">전체 학생</div>
                </div>
            </div>
            <div class="adm-stat-card" style="--c:#10b981">
                <div class="adm-stat-icon">🟢</div>
                <div class="adm-stat-body">
                    <div class="adm-stat-num" style="color:#10b981">${onlineCount}</div>
                    <div class="adm-stat-label">현재 접속중</div>
                </div>
            </div>
            <div class="adm-stat-card" style="--c:#f59e0b">
                <div class="adm-stat-icon">📢</div>
                <div class="adm-stat-body">
                    <div class="adm-stat-num">${noticesCount}</div>
                    <div class="adm-stat-label">공지사항</div>
                </div>
            </div>
            <div class="adm-stat-card" style="--c:#06b6d4">
                <div class="adm-stat-icon">💬</div>
                <div class="adm-stat-body">
                    <div class="adm-stat-num">${postsCount}</div>
                    <div class="adm-stat-label">게시글</div>
                </div>
            </div>
            <div class="adm-stat-card" style="--c:#ef4444">
                <div class="adm-stat-icon">🚫</div>
                <div class="adm-stat-body">
                    <div class="adm-stat-num" style="color:#ef4444">${bannedCount}</div>
                    <div class="adm-stat-label">정지 계정</div>
                </div>
            </div>
        </div>

        <!-- 긴급 공지 -->
        <div class="adm-panel">
            <div class="adm-panel-header">
                <span class="adm-panel-title">🚨 긴급 공지</span>
            </div>
            ${_renderEmergencyNoticeAdmin()}
        </div>

        <!-- 관리자 현황 -->
        <div class="adm-panel">
            <div class="adm-panel-header">
                <span class="adm-panel-title">⚡ 관리자 현황</span>
            </div>
            <div class="adm-table-wrap">
                <table class="adm-table">
                    <thead>
                        <tr>
                            <th>아이디</th>
                            <th>닉네임</th>
                            <th>접속 상태</th>
                            <th>체류 시간</th>
                        </tr>
                    </thead>
                    <tbody id="adminMemberTbody">${_buildAdminMemberRows()}</tbody>
                </table>
            </div>
        </div>

        <!-- 멤버 관리 -->
        <div class="adm-panel">
            <div class="adm-panel-header">
                <span class="adm-panel-title">👥 멤버 관리</span>
                <span class="adm-panel-meta" id="adminOnlineCount">
                    전체 <strong>${users.length}</strong>명 &nbsp;·&nbsp;
                    <span style="color:var(--success)">접속중 <strong>${onlineCount}</strong>명</span> &nbsp;·&nbsp;
                    정지 <strong>${bannedCount}</strong>명
                </span>
            </div>
            <div class="adm-table-wrap">
                <table class="adm-table">
                    <thead>
                        <tr>
                            <th>아이디</th>
                            <th>닉네임</th>
                            <th>계정 상태</th>
                            <th>접속 상태</th>
                            <th>체류 시간</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody id="adminTbody">${_buildAdminRows()}</tbody>
                </table>
            </div>
        </div>

        <!-- 비밀번호 조회 -->
        <div class="adm-panel" id="pwViewPanel">
            <div class="adm-panel-header">
                <span class="adm-panel-title">🔑 비밀번호 조회</span>
            </div>
            <div id="pwViewContent">
                <div style="padding:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                    <input type="password" id="pwViewMaster" class="form-input" placeholder="마스터 비밀번호 입력" maxlength="50"
                        style="max-width:260px" onkeydown="if(event.key==='Enter')unlockPwView()">
                    <button class="btn btn-primary" onclick="unlockPwView()">🔓 확인</button>
                    <span style="font-size:0.8rem;color:var(--text-muted)">모든 계정의 비밀번호를 조회합니다</span>
                </div>
            </div>
        </div>
    </div>`;
}

// [정지 기능 비활성화]
// function banUser(userId) {
//     if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
//     const account = ACCOUNTS.find(a => a.id === userId);
//     if (!account) return;
//     if (account.role === 'admin') { showToast('관리자는 정지할 수 없습니다.', 'error'); return; }
//     if (!confirm(`${account.nickname}을(를) 정지하시겠습니까?`)) return;
//     const bans = DB.get('bans');
//     if (!bans.includes(userId)) { bans.push(userId); DB.set('bans', bans); }
//     addLog('ban_user', { targetId: userId, targetName: account.username, targetNick: account.nickname });
//     showToast(`${account.nickname}이(가) 정지되었습니다.`, 'info');
//     navigate('admin');
// }

// function unbanUser(userId) {
//     if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
//     const account = ACCOUNTS.find(a => a.id === userId);
//     const name = account ? account.nickname : userId;
//     if (!confirm(`${name}의 정지를 해제하시겠습니까?`)) return;
//     DB.set('bans', DB.get('bans').filter(id => id !== userId));
//     addLog('unban_user', { targetId: userId, targetName: account?.username || userId, targetNick: name });
//     showToast(`${name}의 정지가 해제되었습니다.`, 'success');
//     navigate('admin');
// }

// [타임아웃 기능 비활성화]
// function showTimeoutModal(userId) {
//     if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
//     const account = ACCOUNTS.find(a => a.id === userId);
//     if (!account) return;
//     openModal(`⏳ 타임아웃 설정 — ${escapeHtml(account.nickname)}`, `...`);
// }

// function applyTimeoutUser(userId) {
//     if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
//     const d  = parseInt(document.getElementById('toDays').value)  || 0;
//     const h  = parseInt(document.getElementById('toHours').value) || 0;
//     const m  = parseInt(document.getElementById('toMins').value)  || 0;
//     const s  = parseInt(document.getElementById('toSecs').value)  || 0;
//     const ms = (d * 86400 + h * 3600 + m * 60 + s) * 1000;
//     if (ms <= 0) { showToast('시간을 1초 이상 설정해주세요.', 'warning'); return; }
//     const account = ACCOUNTS.find(a => a.id === userId);
//     const name    = account ? account.nickname : userId;
//     setUserTimeout(userId, ms);
//     addLog('timeout_user', { ... });
//     closeModal();
//     showToast(`${name}에게 타임아웃이 적용되었습니다.`, 'info');
//     navigate('admin');
// }

// function clearTimeoutUser(userId) {
//     if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
//     const account = ACCOUNTS.find(a => a.id === userId);
//     const name    = account ? account.nickname : userId;
//     if (!confirm(`${name}의 타임아웃을 해제하시겠습니까?`)) return;
//     clearUserTimeout(userId);
//     addLog('clear_timeout', { ... });
//     showToast(`${name}의 타임아웃이 해제되었습니다.`, 'success');
//     navigate('admin');
// }

// ── 비밀번호 조회 ──────────────────────────────
const PW_VIEW_MASTER = '1234';

function unlockPwView() {
    if (!isAdmin()) return;
    const input = document.getElementById('pwViewMaster');
    if (!input) return;
    if (input.value !== PW_VIEW_MASTER) {
        showToast('마스터 비밀번호가 틀렸습니다.', 'error');
        input.value = '';
        input.focus();
        return;
    }

    const pwOverrides = DB.get('pw_overrides', {});
    const allAccounts = [...ACCOUNTS].sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return 1;
        if (a.role !== 'admin' && b.role === 'admin') return -1;
        return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    });

    const rows = allAccounts.map(a => {
        const basePw    = String(a.password);
        const overridePw = pwOverrides[a.id];
        const isChanged  = overridePw !== undefined;
        const displayPw  = isChanged ? overridePw : basePw;
        const roleBadge  = a.role === 'admin'
            ? `<span class="adm-badge adm-badge-active" style="background:rgba(139,92,246,0.12);color:#7c3aed">관리자</span>`
            : `<span class="adm-badge" style="background:var(--primary-bg);color:var(--primary)">학생</span>`;
        const changedBadge = isChanged
            ? `<span style="font-size:0.68rem;color:#f59e0b;margin-left:6px">변경됨</span>` : '';
        return `
        <tr>
            <td><span class="adm-username">${escapeHtml(a.username)}</span></td>
            <td>${escapeHtml(a.nickname)}</td>
            <td>${roleBadge}</td>
            <td>
                <span style="font-family:monospace;font-size:0.88rem;background:var(--primary-bg);padding:2px 8px;border-radius:4px">${escapeHtml(displayPw)}</span>
                ${changedBadge}
            </td>
            <td>
                ${isChanged
                    ? `<button class="adm-btn adm-btn-danger" onclick="resetPwOverride('${escapeHtml(a.id)}')">초기화</button>`
                    : '<span style="font-size:0.75rem;color:var(--text-muted)">기본값</span>'}
            </td>
        </tr>`;
    }).join('');

    const content = document.getElementById('pwViewContent');
    if (!content) return;
    content.innerHTML = `
        <div style="padding:0 0 12px">
            <div style="padding:8px 20px 4px;font-size:0.8rem;color:var(--text-muted)">
                변경된 비밀번호는 <strong style="color:#f59e0b">변경됨</strong> 표시. 초기화 버튼으로 기본값으로 되돌릴 수 있습니다.
            </div>
            <div class="adm-table-wrap">
                <table class="adm-table" id="pwViewTable">
                    <thead><tr><th>아이디</th><th>닉네임</th><th>권한</th><th>비밀번호</th><th>관리</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div style="padding:12px 20px">
                <button class="btn btn-ghost btn-sm" onclick="lockPwView()">🔒 잠금</button>
            </div>
        </div>`;
}

function lockPwView() {
    const content = document.getElementById('pwViewContent');
    if (!content) return;
    content.innerHTML = `
        <div style="padding:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <input type="password" id="pwViewMaster" class="form-input" placeholder="마스터 비밀번호 입력" maxlength="50"
                style="max-width:260px" onkeydown="if(event.key==='Enter')unlockPwView()">
            <button class="btn btn-primary" onclick="unlockPwView()">🔓 확인</button>
            <span style="font-size:0.8rem;color:var(--text-muted)">모든 계정의 비밀번호를 조회합니다</span>
        </div>`;
}

function resetPwOverride(userId) {
    if (!isAdmin()) return;
    const account = ACCOUNTS.find(a => a.id === userId);
    const name = account ? account.nickname : userId;
    if (!confirm(`${name}의 비밀번호를 기본값으로 초기화할까요?`)) return;
    const pwOverrides = DB.get('pw_overrides', {});
    delete pwOverrides[userId];
    DB.set('pw_overrides', pwOverrides);
    showToast(`${name}의 비밀번호가 초기화되었습니다.`, 'success');
    // 테이블만 다시 그리기
    unlockPwView();
}

// =============================================
// 긴급 공지
// =============================================
function _renderEmergencyNoticeAdmin() {
    const notice = DB.get('emergency_notice', null);
    if (!notice || !notice.text) {
        return `
        <div style="padding:20px">
            <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:14px">현재 등록된 긴급 공지가 없습니다.</p>
            <button class="btn btn-primary btn-sm" onclick="showEmergencyNoticeModal(false)">🚨 긴급 공지 만들기</button>
        </div>`;
    }
    const created = new Date(notice.createdAt).toLocaleString('ko-KR');
    const updated = notice.updatedAt !== notice.createdAt
        ? ` &nbsp;·&nbsp; 수정: ${new Date(notice.updatedAt).toLocaleString('ko-KR')}` : '';
    return `
    <div style="padding:20px">
        <div class="emergency-admin-preview">
            <span style="font-size:1.1rem;flex-shrink:0">🚨</span>
            <span>${escapeHtml(notice.text)}</span>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="adm-btn adm-btn-warn" onclick="showEmergencyNoticeModal(true)">✏️ 수정</button>
            <button class="adm-btn adm-btn-danger" onclick="deleteEmergencyNotice()">🗑️ 삭제</button>
        </div>
        <p style="font-size:0.73rem;color:var(--text-muted);margin-top:8px">작성: ${created}${updated}</p>
    </div>`;
}

function showEmergencyNoticeModal(isEdit) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const notice = DB.get('emergency_notice', null);
    const currentText = isEdit && notice ? notice.text : '';
    openModal(`🚨 긴급 공지 ${isEdit ? '수정' : '만들기'}`, `
        <div style="margin-bottom:14px">
            <label style="font-size:0.84rem;color:var(--text-muted);display:block;margin-bottom:6px">공지 내용 <span style="color:#dc2626">*</span></label>
            <textarea id="emergencyNoticeText" class="form-input" rows="3" maxlength="200"
                placeholder="긴급 공지 내용을 입력하세요..."
                style="resize:vertical;width:100%">${escapeHtml(currentText)}</textarea>
            <div style="font-size:0.73rem;color:var(--text-muted);text-align:right;margin-top:4px">
                <span id="emergencyCharCount">${currentText.length}</span>/200
            </div>
        </div>
        <div style="display:flex;gap:10px">
            <button class="btn btn-outline" style="flex:1" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" style="flex:2" onclick="saveEmergencyNotice(${!!isEdit})">
                💾 ${isEdit ? '수정 완료' : '긴급 공지 등록'}
            </button>
        </div>
        <script>
            (function() {
                const ta = document.getElementById('emergencyNoticeText');
                const cnt = document.getElementById('emergencyCharCount');
                if (ta && cnt) ta.addEventListener('input', () => { cnt.textContent = ta.value.length; });
                if (ta) ta.focus();
            })();
        <\/script>
    `);
}

function saveEmergencyNotice(isEdit) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const ta = document.getElementById('emergencyNoticeText');
    if (!ta) return;
    const text = ta.value.trim();
    if (!text) { showToast('공지 내용을 입력해주세요.', 'warning'); ta.focus(); return; }

    const existing = DB.get('emergency_notice', null);
    const now = Date.now();
    DB.set('emergency_notice', {
        text,
        createdAt: isEdit && existing ? existing.createdAt : now,
        updatedAt: now
    });
    closeModal();
    updateEmergencyBanner();
    showToast(isEdit ? '✅ 긴급 공지가 수정되었습니다.' : '✅ 긴급 공지가 등록되었습니다.', 'success');
    navigate('admin');
}

function deleteEmergencyNotice() {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    if (!confirm('긴급 공지를 삭제하시겠습니까?')) return;
    DB.set('emergency_notice', null);
    updateEmergencyBanner();
    showToast('✅ 긴급 공지가 삭제되었습니다.', 'success');
    navigate('admin');
}

// =============================================
// 긴급 공지 배너 렌더
// =============================================
function updateEmergencyBanner() {
    const banner = document.getElementById('emergencyBanner');
    const textEl = document.getElementById('emergencyBannerText');
    if (!banner || !textEl) return;

    const notice = DB.get('emergency_notice', null);
    if (notice && notice.text) {
        textEl.textContent = notice.text;
        banner.style.display = '';
        // 배너 높이만큼 콘텐츠 밀어내기
        requestAnimationFrame(() => {
            const h = banner.offsetHeight;
            document.documentElement.style.setProperty('--emergency-h', h + 'px');
        });
    } else {
        banner.style.display = 'none';
        document.documentElement.style.setProperty('--emergency-h', '0px');
    }
}
