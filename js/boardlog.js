// =============================================
// 게시판 활동 로그 조회 (관리자 전용)
// =============================================
function renderBoardLog() {
    if (!isAdmin()) { navigate('home'); return ''; }

    const logs = getBoardLogs();
    const pad = n => String(n).padStart(2, '0');

    function formatAction(log) {
        switch (log.action) {
            case 'post_create':
                return `✍️ 글 작성: "${log.title}"`;
            case 'post_edit':
                return `✏️ 글 수정: "${log.title}"`;
            case 'post_delete':
                return `🗑️ 글 삭제: "${log.title}"`;
            case 'comment_create':
                return `💬 댓글 달기: "${log.postTitle}"`;
            case 'comment_edit':
                return `💬 댓글 수정: "${log.postTitle}"`;
            case 'comment_delete':
                return `🗑️ 댓글 삭제: "${log.postTitle}"`;
            default:
                return log.action;
        }
    }

    function formatDate(ts) {
        const d = new Date(ts);
        return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    // 모든 사용자의 활동을 보여줌
    const rows = logs.map((log, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td style="font-family:monospace;font-size:0.8rem">${formatDate(log.timestamp)}</td>
            <td style="font-weight:600;color:var(--primary)">${escapeHtml(log.userNick)}</td>
            <td>${formatAction(log)}</td>
            <td>
                ${log.postId ? `<button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:0.7rem" onclick="navigate('board-detail',{id:'${log.postId}'})">보기</button>` : ''}
            </td>
        </tr>
    `).join('');

    const emptyMsg = logs.length === 0
        ? '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">📭 기록이 없습니다.</td></tr>'
        : '';

    // 전체 통계
    const stats = {
        post_create: logs.filter(l => l.action === 'post_create').length,
        post_edit: logs.filter(l => l.action === 'post_edit').length,
        post_delete: logs.filter(l => l.action === 'post_delete').length,
        comment_create: logs.filter(l => l.action === 'comment_create').length,
        comment_edit: logs.filter(l => l.action === 'comment_edit').length,
        comment_delete: logs.filter(l => l.action === 'comment_delete').length
    };

    return `
    <div class="page">
        <div class="page-header">
            <h2>📋 게시판 활동 로그</h2>
            <p>모든 사용자의 게시판 활동을 확인하세요</p>
        </div>
        <div class="card card-body">
            <div class="boardlog-stats">
                <div class="stat-item">
                    <span class="stat-label">글 작성</span>
                    <span class="stat-count">${stats.post_create}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">글 수정</span>
                    <span class="stat-count">${stats.post_edit}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">글 삭제</span>
                    <span class="stat-count">${stats.post_delete}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">댓글</span>
                    <span class="stat-count">${stats.comment_create}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">댓글 수정</span>
                    <span class="stat-count">${stats.comment_edit}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">댓글 삭제</span>
                    <span class="stat-count">${stats.comment_delete}</span>
                </div>
            </div>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border)">
                <span style="font-size:0.85rem;color:var(--text-muted)">총 <strong>${logs.length}</strong>개 기록</span>
            </div>
            <div style="overflow-x:auto;margin-top:16px">
                <table class="boardlog-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>시간</th>
                            <th>사용자</th>
                            <th>활동</th>
                            <th></th>
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
