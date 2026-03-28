// =============================================
// 공지사항 / 자유게시판 목록
// =============================================
const NOTICE_CATEGORIES = [
    { id: 'all',    label: '전체',       icon: '📋', color: '#64748b' },
    { id: 'notice', label: '공지',       icon: '📢', color: '#7c3aed' },
    { id: 'school', label: '학사',       icon: '📚', color: '#3b82f6' },
    { id: 'exam',   label: '시험',       icon: '📝', color: '#ef4444' },
    { id: 'letter', label: '가정통신문', icon: '📄', color: '#f59e0b' },
    { id: 'event',  label: '행사',       icon: '🎉', color: '#22c55e' },
    { id: 'etc',    label: '기타',       icon: '💡', color: '#94a3b8' },
];

let searchQueries = { notices: '', board: '' };
let selectedNoticeCategory = 'all';

function renderNotices() {
    return renderPostList('notices', '📢 공지사항', isAdmin());
}

function renderBoard() {
    return renderPostList('board', '💬 자유게시판', isLoggedIn());
}

function setNoticeCategory(cat) {
    selectedNoticeCategory = cat;
    render();
}

function renderPostList(type, title, canWrite) {
    const posts = DB.get(type);
    const query = searchQueries[type] || '';

    // 카테고리 필터 탭 (공지사항 전용)
    let categoryFilterHtml = '';
    if (type === 'notices') {
        const tabs = NOTICE_CATEGORIES.map(cat => {
            const count = cat.id === 'all'
                ? posts.length
                : posts.filter(p => p.category === cat.id).length;
            const isActive = selectedNoticeCategory === cat.id;
            const activeStyle = isActive
                ? `background:${cat.color};border-color:${cat.color};color:#fff;`
                : `border-color:${cat.color};color:${cat.color};`;
            return `<button class="cat-tab${isActive ? ' cat-tab-active' : ''}"
                style="${activeStyle}"
                onclick="setNoticeCategory('${cat.id}')">
                ${cat.icon} ${cat.label}<span class="cat-count">${count}</span>
            </button>`;
        }).join('');
        categoryFilterHtml = `<div class="cat-tabs">${tabs}</div>`;
    }

    let filtered = query
        ? posts.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
        : posts;

    if (type === 'notices' && selectedNoticeCategory !== 'all') {
        filtered = filtered.filter(p => p.category === selectedNoticeCategory);
    }

    const pinned = filtered.filter(p => p.pinned).sort((a, b) => b.createdAt - a.createdAt);
    const normal = filtered.filter(p => !p.pinned).sort((a, b) => b.createdAt - a.createdAt);
    const sorted = [...pinned, ...normal];

    const writePage  = type === 'notices' ? 'notice-write' : 'board-write';
    const detailPage = type === 'notices' ? 'notice-detail' : 'board-detail';
    const writeBtn   = canWrite
        ? `<button class="btn btn-primary" onclick="navigate('${writePage}')">✏️ ${type === 'notices' ? '공지 작성' : '글 작성'}</button>`
        : '';

    let listHtml = '';
    if (sorted.length === 0) {
        const emptyIcon = type === 'notices' ? '📢' : '💬';
        const emptyText = query
            ? `"${escapeHtml(query)}" 검색 결과가 없습니다.`
            : (type === 'notices' && selectedNoticeCategory !== 'all'
                ? '이 카테고리에 게시글이 없습니다.'
                : '등록된 게시글이 없습니다.');
        listHtml = `<div class="empty-state"><div class="empty-icon">${emptyIcon}</div><p>${emptyText}</p></div>`;
    } else if (type === 'notices') {
        // 카드형 UI (공지사항)
        listHtml = '<div class="notice-card-list">' + sorted.map(p => {
            const comments = DB.get(`comments_${type}_${p.id}`);
            const cat = NOTICE_CATEGORIES.find(c => c.id === p.category);
            const catBadge = cat
                ? `<span class="cat-badge" style="background:${cat.color}">${cat.icon} ${cat.label}</span>`
                : `<span class="cat-badge" style="background:#94a3b8">💡 기타</span>`;
            const pinBadge = p.pinned ? '<span class="pin-badge">📌 고정</span>' : '';
            const attachIcon = p.attachment ? ' <span class="notice-attach-icon">📎</span>' : '';
            const commentBadge = comments.length > 0
                ? `<span class="notice-comment-count">💬 ${comments.length}</span>`
                : '';
            const preview = p.content
                ? p.content.replace(/\n/g, ' ').slice(0, 80) + (p.content.length > 80 ? '…' : '')
                : '';
            return `
            <div class="notice-card${p.pinned ? ' notice-card-pinned' : ''}" onclick="navigate('${detailPage}', {id:'${p.id}'})">
                <div class="notice-card-badges">${pinBadge}${catBadge}</div>
                <div class="notice-card-title">${escapeHtml(p.title)}${attachIcon}</div>
                ${preview ? `<div class="notice-card-preview">${escapeHtml(preview)}</div>` : ''}
                <div class="notice-card-meta">
                    <span>✍️ ${escapeHtml(p.author)}</span>
                    <span>📅 ${formatDate(p.createdAt)}</span>
                    <span>👁 ${p.viewers ? p.viewers.length : 0}</span>
                    ${commentBadge}
                </div>
            </div>`;
        }).join('') + '</div>';
    } else {
        // 기존 리스트형 UI (자유게시판)
        listHtml = '<ul class="post-list">' + sorted.map(p => {
            const comments     = DB.get(`comments_${type}_${p.id}`);
            const commentBadge = comments.length > 0 ? `<span class="comment-count">[${comments.length}]</span>` : '';
            const attach       = p.attachment ? ' 📎' : '';
            return `
            <li class="post-item ${p.pinned ? 'post-pinned' : ''}" onclick="navigate('${detailPage}', {id:'${p.id}'})">
                ${p.pinned ? '<span class="pin-badge">📌 고정</span>' : ''}
                <span class="post-title">${escapeHtml(p.title)}${commentBadge}${attach}</span>
                <span class="post-meta">${escapeHtml(p.author)} · ${formatDate(p.createdAt)} · 👁 ${p.viewers ? p.viewers.length : 0}</span>
            </li>`;
        }).join('') + '</ul>';
    }

    return `
    <div class="page">
        <div class="page-header">
            <h2>${title}</h2>
            ${writeBtn}
        </div>
        <div class="search-box">
            <input type="text" class="search-input" placeholder="${type === 'notices' ? '공지사항 검색...' : '게시글 제목으로 검색...'}" value="${escapeHtml(query)}" maxlength="100"
                oninput="handleSearch('${type}', this.value)"
                onkeydown="if(event.key==='Escape'){this.value='';handleSearch('${type}','')}">
        </div>
        ${categoryFilterHtml}
        <div class="card${type === 'notices' ? ' notice-list-card' : ''}">${listHtml}</div>
    </div>`;
}

function handleSearch(type, query) {
    searchQueries[type] = query;
    clearTimeout(handleSearch._timer);
    handleSearch._timer = setTimeout(() => render(), 200);
}
