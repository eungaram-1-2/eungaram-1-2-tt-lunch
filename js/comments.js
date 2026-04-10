// =============================================
// 댓글
// =============================================
function addComment(type, postId) {
    if (!RateLimit.check('comment')) {
        showToast('댓글을 너무 자주 작성하고 있습니다. 잠시 후 다시 시도하세요.', 'warning');
        return;
    }
    const input = document.getElementById('commentInput');
    const cv = Security.validateComment(input.value);
    if (!cv.ok) { if (cv.msg) showToast(cv.msg, 'warning'); return; }

    const user = currentUser();
    if (!user) { showToast('로그인이 필요합니다.', 'error'); return; }
    if (isBanned()) { showToast('정지된 계정은 댓글을 작성할 수 없습니다.', 'error'); return; }

    const comments = DB.get(`comments_${type}_${postId}`);
    const comment = {
        id: Date.now().toString(),
        text: cv.value,
        author: user.nickname,
        authorRole: user.role,
        createdAt: Date.now()
    };
    comments.push(comment);
    DB.set(`comments_${type}_${postId}`, comments);
    if (type === 'board') {
        const post = DB.get('board').find(p => p.id === postId);
        addBoardLog('comment_create', { postId: postId, postTitle: post?.title || '', commentId: comment.id });
    }
    input.value = '';
    navigate(type === 'notices' ? 'notice-detail' : 'board-detail', { id: postId });
}

function deleteComment(type, postId, commentId) {
    const user = currentUser();
    if (!user) { showToast('로그인이 필요합니다.', 'error'); return; }
    const comments = DB.get(`comments_${type}_${postId}`);
    const comment = comments.find(c => c.id === commentId);
    if (!isAdmin() && !(comment && comment.authorId === user.id)) {
        showToast('권한이 없습니다.', 'error'); return;
    }
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    DB.set(`comments_${type}_${postId}`, comments.filter(c => c.id !== commentId));
    if (type === 'board') {
        const post = DB.get('board').find(p => p.id === postId);
        addBoardLog('comment_delete', { postId: postId, postTitle: post?.title || '', commentId: commentId });
    }
    showToast('댓글이 삭제되었습니다.', 'info');
    navigate(type === 'notices' ? 'notice-detail' : 'board-detail', { id: postId });
}

// 댓글 편집
function showEditCommentModal(type, postId, commentId) {
    const comments = DB.get(`comments_${type}_${postId}`);
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    openModal('댓글 수정', `
        <textarea class="form-textarea" id="editCommentText" maxlength="500" rows="4">${escapeHtml(comment.text)}</textarea>
        <div style="display:flex;gap:10px;margin-top:14px">
            <button class="btn btn-outline" style="flex:1" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" style="flex:2" onclick="submitEditComment('${type}','${postId}','${commentId}')">수정</button>
        </div>
    `);
}

function submitEditComment(type, postId, commentId) {
    const user = currentUser();
    if (!user) { showToast('로그인이 필요합니다.', 'error'); return; }

    const text = document.getElementById('editCommentText').value.trim();
    const cv = Security.validateComment(text);
    if (!cv.ok) { showToast(cv.msg || '댓글 형식이 올바르지 않습니다.', 'warning'); return; }

    const comments = DB.get(`comments_${type}_${postId}`);
    const idx = comments.findIndex(c => c.id === commentId);
    if (idx === -1) return;

    if (!isAdmin() && comments[idx].authorId !== user.id) {
        showToast('권한이 없습니다.', 'error'); return;
    }

    comments[idx].text = cv.value;
    comments[idx].editedAt = Date.now();
    DB.set(`comments_${type}_${postId}`, comments);

    closeModal();
    if (type === 'board') {
        const post = DB.get('board').find(p => p.id === postId);
        addBoardLog('comment_edit', { postId: postId, postTitle: post?.title || '', commentId: commentId });
    }
    showToast('댓글이 수정되었습니다.', 'success');
    navigate(type === 'notices' ? 'notice-detail' : 'board-detail', { id: postId });
}
