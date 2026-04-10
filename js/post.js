// =============================================
// 게시글 상세 / 작성 / 수정 / 삭제
// =============================================
function renderPostDetail(type) {
    const posts = DB.get(type);
    const post  = posts.find(p => p.id === pageParams.id);
    if (!post) return `<div class="page"><div class="empty-state"><div class="empty-icon">😕</div><p>게시글을 찾을 수 없습니다.</p></div></div>`;

    const comments = DB.get(`comments_${type}_${post.id}`);
    const listPage = type === 'notices' ? 'notices' : 'board';
    const user     = currentUser();

    // 조회수 기록 (로그인된 계정 기준, 중복 X)
    if (user) {
        if (!post.viewers) post.viewers = [];
        if (!post.viewers.includes(user.id)) {
            post.viewers.push(user.id);
            DB.set(type, posts);
        }
    }

    // 카테고리 배지 (공지사항)
    let categoryBadgeHtml = '';
    if (type === 'notices' && post.category) {
        const cat = NOTICE_CATEGORIES.find(c => c.id === post.category);
        if (cat) {
            categoryBadgeHtml = `<span class="cat-badge" style="background:${cat.color};margin-bottom:10px;display:inline-block">${cat.icon} ${cat.label}</span>`;
        }
    }

    let actions = `<button class="btn btn-ghost btn-sm" onclick="navigate('${listPage}')">← 목록으로</button>`;
    if (isAdmin()) {
        const pinText = post.pinned ? '📌 고정 해제' : '📌 상단 고정';
        const editBtn = (type === 'notices' || canEdit(post.createdAt))
            ? `<button class="btn btn-outline btn-sm" onclick="showEditPostModal('${type}','${post.id}')">수정</button>`
            : '';
        actions += `
            ${editBtn}
            <button class="btn btn-outline btn-sm" onclick="togglePin('${type}','${post.id}')">${pinText}</button>
            <button class="btn btn-danger btn-sm" onclick="deletePost('${type}','${post.id}')">삭제</button>`;
    } else if (user && post.authorId === user.id && type === 'board') {
        const editBtn = canEdit(post.createdAt)
            ? `<button class="btn btn-outline btn-sm" onclick="showEditPostModal('${type}','${post.id}')">수정</button>`
            : '';
        actions += `
            ${editBtn}
            <button class="btn btn-danger btn-sm" onclick="deletePost('${type}','${post.id}')">삭제</button>`;
    }

    let attachHtml = '';
    if (post.attachment) {
        attachHtml = `<div class="attachment-box">📎 첨부파일: <a href="${post.attachment}" download="${escapeHtml(post.attachmentName)}">${escapeHtml(post.attachmentName)}</a></div>`;
    }

    const commentsHtml = comments.map(c => {
        const isOwnComment = user && user.id === (c.authorId || c.author) && type === 'board';
        let actions = '';
        if (isAdmin() || isOwnComment) {
            if (isOwnComment) {
                actions = `<button class="btn btn-ghost btn-sm" style="padding:1px 5px;font-size:0.68rem;color:var(--primary)" onclick="event.stopPropagation();showEditCommentModal('${type}','${post.id}','${c.id}')">수정</button>`;
            }
            actions += `<button class="btn btn-ghost btn-sm" style="padding:1px 5px;font-size:0.68rem;color:var(--danger)" onclick="event.stopPropagation();deleteComment('${type}','${post.id}','${c.id}')">삭제</button>`;
        }
        return `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(c.author)}${c.authorRole === 'admin' ? ' <span class="user-badge badge-admin" style="font-size:0.6rem;padding:2px 6px">관리자</span>' : ''}</span>
                <span class="comment-date">${formatDate(c.createdAt)}${c.editedAt ? ' (수정됨)' : ''}${actions ? ` ${actions}` : ''}</span>
            </div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
        </div>`;
    }).join('');

    const commentForm = !isLoggedIn()
        ? '<p style="color:var(--text-muted);font-size:0.83rem;margin-top:14px;text-align:center">댓글을 작성하려면 로그인하세요.</p>'
        : isBanned()
        ? '<p style="color:var(--danger);font-size:0.83rem;margin-top:14px;text-align:center;font-weight:600">⛔ 정지된 계정은 댓글을 작성할 수 없습니다.</p>'
        : `<div class="comment-form">
            <input type="text" id="commentInput" placeholder="댓글을 입력하세요..." maxlength="500"
                onkeydown="if(event.key==='Enter')addComment('${type}','${post.id}')">
            <button class="btn btn-primary btn-sm" onclick="addComment('${type}','${post.id}')">등록</button>
           </div>`;

    return `
    <div class="page">
        <div class="card">
            <div class="post-detail">
                <div class="post-detail-header">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
                        ${post.pinned ? '<span class="pin-badge">📌 고정됨</span>' : ''}
                        ${categoryBadgeHtml}
                    </div>
                    <h2>${escapeHtml(post.title)}</h2>
                    <div class="post-detail-meta">
                        <span>✍️ ${escapeHtml(post.author)}</span>
                        <span>📅 ${formatDate(post.createdAt)}</span>
                        <span>👁 ${post.viewers ? post.viewers.length : 0}명</span>
                    </div>
                </div>
                <div class="post-detail-content">${escapeHtml(post.content)}</div>
                ${attachHtml}
                ${renderReactions(post, type, post.id)}
                <div class="post-detail-actions">${actions}</div>
                <div class="comments-section">
                    <h4>💬 댓글 ${comments.length}개</h4>
                    ${commentsHtml}
                    ${commentForm}
                </div>
            </div>
        </div>
    </div>`;
}

function renderPostWrite(type) {
    const title    = type === 'notices' ? '공지사항 작성' : '게시글 작성';
    const icon     = type === 'notices' ? '📢' : '💬';
    const backPage = type === 'notices' ? 'notices' : 'board';
    const pinOption = isAdmin() ? `
        <div class="form-group">
            <div class="form-check">
                <input type="checkbox" id="postPinned">
                <label for="postPinned">📌 상단에 고정</label>
            </div>
        </div>` : '';

    // 카테고리 선택 (공지사항 필수)
    const categorySelect = type === 'notices' ? `
        <div class="form-group">
            <label>카테고리 <span style="color:var(--danger);font-weight:600">*</span> <span style="color:var(--text-muted);font-weight:400;font-size:0.78rem">(필수)</span></label>
            <div class="cat-select-grid" id="postCategoryGrid">
                ${NOTICE_CATEGORIES.filter(c => c.id !== 'all').map(cat => `
                <button type="button" class="cat-select-btn" data-cat="${cat.id}"
                    style="--cat-color:${cat.color}"
                    onclick="selectPostCategory('${cat.id}')">
                    <span class="cat-select-icon">${cat.icon}</span>
                    <span class="cat-select-label">${cat.label}</span>
                </button>`).join('')}
            </div>
            <input type="hidden" id="postCategory">
        </div>` : '';

    return `
    <div class="page">
        <div class="page-header">
            <h2>${icon} ${title}</h2>
            <button class="btn btn-ghost btn-sm" onclick="navigate('${backPage}')">← 돌아가기</button>
        </div>
        <div class="card card-body">
            ${categorySelect}
            <div class="form-group">
                <label>제목 <span style="color:var(--text-muted);font-weight:400;font-size:0.78rem">(최대 ${Security.MAX_TITLE}자)</span></label>
                <input type="text" class="form-input" id="postTitle" placeholder="제목을 입력하세요" maxlength="${Security.MAX_TITLE}">
            </div>
            <div class="form-group">
                <label>내용 <span style="color:var(--text-muted);font-weight:400;font-size:0.78rem">(최대 ${Security.MAX_CONTENT}자)</span></label>
                <textarea class="form-textarea" id="postContent" placeholder="내용을 입력하세요" rows="10" maxlength="${Security.MAX_CONTENT}"></textarea>
            </div>
            <div class="form-group">
                <label>📎 파일 첨부 <span style="color:var(--text-muted);font-weight:400;font-size:0.78rem">(최대 100MB)</span></label>
                <input type="file" class="form-input" id="postFile" style="padding:10px">
            </div>
            ${pinOption}
            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
                <button class="btn btn-ghost" onclick="navigate('${backPage}')">취소</button>
                <button class="btn btn-primary" onclick="submitPost('${type}')">등록하기</button>
            </div>
        </div>
    </div>`;
}

function selectPostCategory(catId) {
    document.getElementById('postCategory').value = catId;
    document.querySelectorAll('.cat-select-btn').forEach(btn => {
        const isSelected = btn.dataset.cat === catId;
        btn.classList.toggle('cat-select-active', isSelected);
    });
}

function submitPost(type) {
    if (!RateLimit.check('post')) {
        showToast('게시글을 너무 자주 작성하고 있습니다. 잠시 후 다시 시도하세요.', 'warning');
        return;
    }

    // 공지사항 카테고리 필수 검증
    let category = null;
    if (type === 'notices') {
        const catEl = document.getElementById('postCategory');
        category = catEl ? catEl.value : '';
        if (!category) {
            showToast('카테고리를 선택해주세요.', 'warning');
            document.getElementById('postCategoryGrid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
    }

    const titleV   = Security.validateTitle(document.getElementById('postTitle').value);
    if (!titleV.ok) { showToast(titleV.msg, 'warning'); return; }

    const contentV = Security.validateContent(document.getElementById('postContent').value);
    if (!contentV.ok) { showToast(contentV.msg, 'warning'); return; }

    const pinEl    = document.getElementById('postPinned');
    const fileInput = document.getElementById('postFile');
    const user     = currentUser();
    if (!user) { showToast('로그인이 필요합니다.', 'error'); return; }

    if (fileInput && fileInput.files.length > 0) {
        const fileV = Security.validateFile(fileInput.files[0]);
        if (!fileV.ok) { showToast(fileV.msg, 'error'); return; }
    }

    const post = {
        id: Date.now().toString(),
        title: titleV.value,
        content: contentV.value,
        author: user.nickname,
        authorId: user.id,
        createdAt: Date.now(),
        pinned: pinEl ? pinEl.checked : false,
        category: category,
        attachment: null,
        attachmentName: null
    };

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            post.attachment = e.target.result;
            post.attachmentName = file.name;
            savePost(type, post);
        };
        reader.readAsDataURL(file);
    } else {
        savePost(type, post);
    }
}

function savePost(type, post) {
    const posts = DB.get(type);
    console.log(`[savePost] type=${type}, 기존 글 수=${posts.length}, 새 글=${post.title}`);
    posts.push(post);
    console.log(`[savePost] push 후 글 수=${posts.length}`);
    DB.set(type, posts);
    const verify = DB.get(type);
    console.log(`[savePost] 저장 후 확인: ${verify.length}개 글`);
    DB.set(`comments_${type}_${post.id}`, []);
    addLog('post_write', { postType: type, postId: post.id, title: post.title });
    if (type === 'board') {
        addBoardLog('post_create', { postId: post.id, title: post.title });
    }
    showToast('게시글이 등록되었습니다!', 'success');
    navigate(type === 'notices' ? 'notices' : 'board');
}

function deletePost(type, id) {
    const user = currentUser();
    if (!user) { showToast('로그인이 필요합니다.', 'error'); return; }
    const posts = DB.get(type);
    const post = posts.find(p => p.id === id);
    if (!isAdmin() && !(post && post.authorId === user.id && type === 'board')) {
        showToast('권한이 없습니다.', 'error'); return;
    }
    if (!confirm('정말 삭제하시겠습니까?')) return;
    DB.set(type, posts.filter(p => p.id !== id));
    DB.remove(`comments_${type}_${id}`);
    addLog('post_delete', { postType: type, postId: id, title: post?.title || '(제목 없음)' });
    if (type === 'board') {
        addBoardLog('post_delete', { postId: id, title: post?.title || '(제목 없음)' });
    }
    showToast('게시글이 삭제되었습니다.', 'info');
    navigate(type === 'notices' ? 'notices' : 'board');
}

// 게시글 편집
function showEditPostModal(type, postId) {
    const posts = DB.get(type);
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (type !== 'notices' && !canEdit(post.createdAt)) {
        showToast('작성 후 24시간이 지난 게시글은 수정할 수 없습니다.', 'warning');
        return;
    }

    openModal('게시글 수정', `
        <div class="form-group">
            <label>제목</label>
            <input type="text" class="form-input" id="editPostTitle" maxlength="${Security.MAX_TITLE}" value="${escapeHtml(post.title)}">
        </div>
        <div class="form-group">
            <label>내용</label>
            <textarea class="form-textarea" id="editPostContent" maxlength="${Security.MAX_CONTENT}" rows="8">${escapeHtml(post.content)}</textarea>
        </div>
        <div style="display:flex;gap:10px">
            <button class="btn btn-outline" style="flex:1" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" style="flex:2" onclick="submitEditPost('${type}','${postId}')">수정 완료</button>
        </div>
    `);
}

function submitEditPost(type, postId) {
    const user = currentUser();
    if (!user) { showToast('로그인이 필요합니다.', 'error'); return; }

    const posts = DB.get(type);
    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) return;

    if (!isAdmin() && posts[idx].authorId !== user.id) {
        showToast('권한이 없습니다.', 'error'); return;
    }

    const titleV = Security.validateTitle(document.getElementById('editPostTitle').value);
    if (!titleV.ok) { showToast(titleV.msg, 'warning'); return; }

    const contentV = Security.validateContent(document.getElementById('editPostContent').value);
    if (!contentV.ok) { showToast(contentV.msg, 'warning'); return; }

    const oldTitle = posts[idx].title;

    posts[idx].title = titleV.value;
    posts[idx].content = contentV.value;
    posts[idx].editedAt = Date.now();
    DB.set(type, posts);

    closeModal();
    if (type === 'board') {
        addBoardLog('post_edit', { postId: postId, title: titleV.value, oldTitle: oldTitle });
    }
    showToast('게시글이 수정되었습니다.', 'success');
    const detailPage = type === 'notices' ? 'notice-detail' : 'board-detail';
    navigate(detailPage, { id: postId });
}

function togglePin(type, id) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const posts = DB.get(type);
    const post  = posts.find(p => p.id === id);
    if (post) {
        post.pinned = !post.pinned;
        DB.set(type, posts);
        showToast(post.pinned ? '게시글이 상단에 고정되었습니다.' : '고정이 해제되었습니다.', 'info');
        navigate(type === 'notices' ? 'notice-detail' : 'board-detail', { id });
    }
}
