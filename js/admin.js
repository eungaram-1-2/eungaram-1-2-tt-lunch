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
    const _canSeeIP = currentUser()?.username === 'testdev';

    return users.map(u => {
        const banned  = bans.includes(u.id);
        const timeout = getTimeoutInfo(u.id);
        const online  = sessionIsOnline(u.id);
        const sess    = sessionGet(u.id);
        const ip      = _canSeeIP ? (sess?.ip || '—') : null;
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

        const banBtn = banned
            ? `<button class="adm-btn adm-btn-safe" onclick="unbanUser('${escapeHtml(u.id)}')">해제</button>`
            : `<button class="adm-btn adm-btn-danger" onclick="banUser('${escapeHtml(u.id)}')">정지</button>`;
        const toBtn = timeout
            ? `<button class="adm-btn adm-btn-safe" onclick="clearTimeoutUser('${escapeHtml(u.id)}')">TO 해제</button>`
            : `<button class="adm-btn adm-btn-warn" onclick="showTimeoutModal('${escapeHtml(u.id)}')">⏳</button>`;

        const rowBg = online ? 'adm-row-online' : banned ? 'adm-row-banned' : '';

        return `
        <tr class="adm-row ${rowBg}">
            <td><span class="adm-username">${escapeHtml(u.username)}</span></td>
            <td><span class="adm-nickname">${escapeHtml(u.nickname)}</span></td>
            <td>${accountBadge}</td>
            <td>${onlineBadge}</td>
            <td class="duration-cell adm-duration" data-ts="${connectedAt}">${duration}</td>
            ${ip !== null ? `<td class="ip-cell adm-ip">${escapeHtml(ip)}</td>` : ''}
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
                            ${currentUser()?.username === 'testdev' ? '<th>IP</th>' : ''}
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody id="adminTbody">${_buildAdminRows()}</tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function banUser(userId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const account = ACCOUNTS.find(a => a.id === userId);
    if (!account) return;
    if (account.role === 'admin') { showToast('관리자는 정지할 수 없습니다.', 'error'); return; }
    if (!confirm(`${account.nickname}을(를) 정지하시겠습니까?`)) return;
    const bans = DB.get('bans');
    if (!bans.includes(userId)) { bans.push(userId); DB.set('bans', bans); }
    addLog('ban_user', { targetId: userId, targetName: account.username, targetNick: account.nickname });
    showToast(`${account.nickname}이(가) 정지되었습니다.`, 'info');
    navigate('admin');
}

function unbanUser(userId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const account = ACCOUNTS.find(a => a.id === userId);
    const name = account ? account.nickname : userId;
    if (!confirm(`${name}의 정지를 해제하시겠습니까?`)) return;
    DB.set('bans', DB.get('bans').filter(id => id !== userId));
    addLog('unban_user', { targetId: userId, targetName: account?.username || userId, targetNick: name });
    showToast(`${name}의 정지가 해제되었습니다.`, 'success');
    navigate('admin');
}

// ── 타임아웃 ──────────────────────────────────
function showTimeoutModal(userId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const account = ACCOUNTS.find(a => a.id === userId);
    if (!account) return;

    openModal(`⏳ 타임아웃 설정 — ${escapeHtml(account.nickname)}`, `
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px">
            지정한 시간이 지나면 자동으로 해제됩니다.
        </p>
        <div class="timeout-picker">
            <div class="timeout-picker-unit">
                <input type="number" id="toDays"  class="timeout-input" min="0" max="365" value="0" oninput="this.value=Math.max(0,parseInt(this.value)||0)">
                <label>일</label>
            </div>
            <div class="timeout-picker-sep">:</div>
            <div class="timeout-picker-unit">
                <input type="number" id="toHours" class="timeout-input" min="0" max="23"  value="0" oninput="this.value=Math.min(23,Math.max(0,parseInt(this.value)||0))">
                <label>시간</label>
            </div>
            <div class="timeout-picker-sep">:</div>
            <div class="timeout-picker-unit">
                <input type="number" id="toMins"  class="timeout-input" min="0" max="59"  value="0" oninput="this.value=Math.min(59,Math.max(0,parseInt(this.value)||0))">
                <label>분</label>
            </div>
            <div class="timeout-picker-sep">:</div>
            <div class="timeout-picker-unit">
                <input type="number" id="toSecs"  class="timeout-input" min="0" max="59"  value="0" oninput="this.value=Math.min(59,Math.max(0,parseInt(this.value)||0))">
                <label>초</label>
            </div>
        </div>
        <div id="timeoutPreview" style="text-align:center;font-size:0.82rem;color:var(--primary);min-height:1.4em;margin:14px 0 4px"></div>
        <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-outline" style="flex:1" onclick="closeModal()">취소</button>
            <button class="btn btn-timeout" style="flex:2" onclick="applyTimeoutUser('${escapeHtml(userId)}')">타임아웃 적용</button>
        </div>
        <script>
            (function() {
                function updatePreview() {
                    const d = parseInt(document.getElementById('toDays').value)||0;
                    const h = parseInt(document.getElementById('toHours').value)||0;
                    const m = parseInt(document.getElementById('toMins').value)||0;
                    const s = parseInt(document.getElementById('toSecs').value)||0;
                    const ms = (d*86400+h*3600+m*60+s)*1000;
                    const el = document.getElementById('timeoutPreview');
                    if (!el) return;
                    if (ms <= 0) { el.textContent = ''; return; }
                    const until = new Date(Date.now()+ms);
                    const pad = n => String(n).padStart(2,'0');
                    const days = ['일','월','화','수','목','금','토'];
                    el.textContent = '해제 시각: '+until.getFullYear()+'.'+pad(until.getMonth()+1)+'.'+pad(until.getDate())+' ('+days[until.getDay()]+') '+pad(until.getHours())+':'+pad(until.getMinutes())+':'+pad(until.getSeconds());
                }
                ['toDays','toHours','toMins','toSecs'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.addEventListener('input', updatePreview);
                });
            })();
        <\/script>
    `);
}

function applyTimeoutUser(userId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const d  = parseInt(document.getElementById('toDays').value)  || 0;
    const h  = parseInt(document.getElementById('toHours').value) || 0;
    const m  = parseInt(document.getElementById('toMins').value)  || 0;
    const s  = parseInt(document.getElementById('toSecs').value)  || 0;
    const ms = (d * 86400 + h * 3600 + m * 60 + s) * 1000;

    if (ms <= 0) { showToast('시간을 1초 이상 설정해주세요.', 'warning'); return; }

    const account = ACCOUNTS.find(a => a.id === userId);
    const name    = account ? account.nickname : userId;

    setUserTimeout(userId, ms);
    const pad = n => String(n).padStart(2,'0');
    const durationStr = `${d}일 ${pad(h)}:${pad(m)}:${pad(s)}`;
    addLog('timeout_user', { targetId: userId, targetName: account?.username || userId, targetNick: name, duration: durationStr, durationMs: ms });
    closeModal();
    showToast(`${name}에게 타임아웃이 적용되었습니다.`, 'info');
    navigate('admin');
}

function clearTimeoutUser(userId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const account = ACCOUNTS.find(a => a.id === userId);
    const name    = account ? account.nickname : userId;
    if (!confirm(`${name}의 타임아웃을 해제하시겠습니까?`)) return;
    clearUserTimeout(userId);
    addLog('clear_timeout', { targetId: userId, targetName: account?.username || userId, targetNick: name });
    showToast(`${name}의 타임아웃이 해제되었습니다.`, 'success');
    navigate('admin');
}
