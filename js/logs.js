// =============================================
// 관리자 로그 조회
// =============================================
function renderLogs() {
    if (!isAdmin()) { navigate('home'); return ''; }

    const logs = getLogs();
    const pad = n => String(n).padStart(2, '0');

    function formatAction(log) {
        switch (log.action) {
            case 'post_write':
                return `📝 ${log.postType === 'notices' ? '공지사항' : '게시판'} 작성: "${escapeHtml(log.title)}"`;
            case 'post_delete':
                return `🗑️ ${log.postType === 'notices' ? '공지사항' : '게시판'} 삭제: "${escapeHtml(log.title)}"`;
            case 'ban_user':
                return `🚫 ${escapeHtml(log.targetNick)}(${escapeHtml(log.targetName)}) 정지`;
            case 'unban_user':
                return `✅ ${escapeHtml(log.targetNick)}(${escapeHtml(log.targetName)}) 정지 해제`;
            case 'timeout_user':
                return `⏳ ${escapeHtml(log.targetNick)}(${escapeHtml(log.targetName)}) 타임아웃 (${escapeHtml(log.duration)})`;
            case 'clear_timeout':
                return `🔓 ${escapeHtml(log.targetNick)}(${escapeHtml(log.targetName)}) 타임아웃 해제`;
            default:
                return escapeHtml(log.action);
        }
    }

    function formatDate(ts) {
        const d = new Date(ts);
        return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    const rows = logs.map((log, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td style="font-family:monospace;font-size:0.8rem">${formatDate(log.timestamp)}</td>
            <td>${formatAction(log)}</td>
            <td style="font-family:monospace;font-size:0.8rem">${escapeHtml(log.userName)}</td>
        </tr>
    `).join('');

    const emptyMsg = logs.length === 0
        ? '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">📭 기록이 없습니다.</td></tr>'
        : '';

    return `
    <div class="page">
        <div class="page-header">
            <h2>📋 관리 활동 로그</h2>
            <p>공지, 정지, 타임아웃 등 모든 관리 활동을 기록합니다</p>
        </div>
        <div class="card card-body">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
                <span style="font-size:0.85rem;color:var(--text-muted)">총 <strong>${logs.length}</strong>개 기록</span>
                <button class="btn btn-outline btn-sm" onclick="clearAllLogs()">🗑️ 모든 로그 삭제</button>
            </div>
            <div style="overflow-x:auto">
                <table class="logs-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>시간</th>
                            <th>활동</th>
                            <th>담당자</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        ${emptyMsg}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function clearAllLogs() {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    if (!confirm('모든 로그를 삭제하시겠습니까? (복구 불가)')) return;
    DB.set('admin_logs', []);
    showToast('모든 로그가 삭제되었습니다.', 'info');
    navigate('logs');
}
