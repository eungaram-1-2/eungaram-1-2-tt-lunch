// =============================================
// 반응(Emoji Reactions) — 공통 함수
// =============================================

const REACTIONS = [
    { key: '✓', label: '체크', color: '#10b981' },
    { key: '?', label: '물음표', color: '#f59e0b' },
    { key: '✗', label: '엑스', color: '#ef4444' }
];

function renderReactions(item, dbKey, itemId) {
    const user = currentUser();
    const reactions = item.reactions || { '✓': [], '?': [], '✗': [] };

    return `<div class="reaction-bar">` +
        REACTIONS.map(r => {
            const users = reactions[r.key] || [];
            const count = users.length;
            const isActive = user && users.includes(user.id);
            return `<button class="reaction-btn${isActive ? ' active' : ''}"
                style="--rc:${r.color}"
                onclick="toggleReaction('${dbKey}','${itemId}','${r.key}')"
                ${!user ? 'disabled title="로그인이 필요합니다"' : ''}>
                <span class="reaction-emoji">${r.key}</span>
                ${count > 0 ? `<span class="reaction-count">${count}</span>` : ''}
            </button>`;
        }).join('') +
    `</div>`;
}

function toggleReaction(dbKey, itemId, reactionKey) {
    if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }

    const user = currentUser();
    const items = DB.get(dbKey, []);
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;

    if (!items[idx].reactions) {
        items[idx].reactions = { '✓': [], '?': [], '✗': [] };
    }
    if (!items[idx].reactions[reactionKey]) {
        items[idx].reactions[reactionKey] = [];
    }

    const users = items[idx].reactions[reactionKey];
    const pos = users.indexOf(user.id);
    if (pos === -1) {
        users.push(user.id);
    } else {
        users.splice(pos, 1);
    }

    DB.set(dbKey, items);
}
