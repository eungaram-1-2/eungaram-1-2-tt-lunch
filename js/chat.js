// =============================================
// 실시간 채팅
// =============================================

function cleanChatMessages() {
    // 자정(00:00) 이전 메시지 정리
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const msgs = DB.get('chat', []);
    const todayMsgs = msgs.filter(m => m.createdAt >= todayMs);
    if (todayMsgs.length !== msgs.length) {
        DB.set('chat', todayMsgs);
    }
}

let _chatListening = false;
function initChatListener() {
    if (!fbReady() || _chatListening) return;
    _chatListening = true;
    _fbDB.ref('data/chat').on('value', snap => {
        const val = snap.val();
        if (val === null) {
            localStorage.setItem('chat', '[]');
        } else {
            try { localStorage.setItem('chat', val); } catch(e) {}
        }
        // 현재 채팅 페이지가 표시 중이면 메시지 목록만 새로고침
        if (currentPage === 'chat') {
            _refreshChatMessages();
        }
    });
}

function _renderMessages(msgs) {
    const user = currentUser();
    return msgs.map(m => {
        const isOwn = user && user.id === m.authorId;
        const adminBadge = m.authorRole === 'admin' ? '<span class="user-badge badge-admin">관리자</span>' : '';
        const deleteBtn = isAdmin()
            ? `<button class="btn btn-ghost btn-sm" style="color:var(--danger);padding:2px 6px;font-size:0.7rem" onclick="deleteChatMessage('${m.id}')">삭제</button>`
            : '';
        return `
        <div class="chat-msg ${isOwn ? 'chat-msg-mine' : 'chat-msg-other'}">
            <div class="chat-msg-header">
                <span class="chat-msg-author">${escapeHtml(m.author)} ${adminBadge}</span>
                <span class="chat-msg-time">${formatDate(m.createdAt)}${deleteBtn ? ` ${deleteBtn}` : ''}</span>
            </div>
            <div class="chat-msg-text">${escapeHtml(m.text)}</div>
        </div>`;
    }).join('');
}

function _refreshChatMessages() {
    const msgs = DB.get('chat', []);
    const container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = _renderMessages(msgs);
    // 스크롤이 이미 맨 아래 근처이면 자동 스크롤
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 100) {
        container.scrollTop = container.scrollHeight;
    }
}

function renderChat() {
    cleanChatMessages();
    initChatListener();
    const user = currentUser();
    const msgs = DB.get('chat', []);

    let chatForm = '';
    if (!isLoggedIn()) {
        chatForm = `<div style="padding:20px;text-align:center;color:var(--text-muted)">채팅을 하려면 로그인하세요.</div>`;
    } else if (isBanned()) {
        chatForm = `<div style="padding:20px;text-align:center;color:var(--danger);font-weight:600">⛔ 정지된 계정은 채팅할 수 없습니다.</div>`;
    } else {
        chatForm = `
        <div class="chat-input-area">
            <input type="text" id="chatInput" class="form-input" placeholder="메시지를 입력하세요..." maxlength="500"
                onkeydown="if(event.key==='Enter')sendChatMessage()">
            <button class="btn btn-primary btn-sm" onclick="sendChatMessage()" style="white-space:nowrap;margin-left:8px">전송</button>
        </div>`;
    }

    return `
    <div class="page">
        <div class="page-header">
            <h2>💬 채팅</h2>
            <p style="font-size:0.88rem;color:var(--text-muted)">학급 공개 채팅 (매일 자정에 초기화됩니다)</p>
        </div>
        <div class="card" style="display:flex;flex-direction:column;height:70vh;padding:0">
            <div id="chatMessages" class="chat-messages" style="flex:1;overflow-y:auto;padding:16px;border-bottom:1px solid var(--border-light)">
                ${_renderMessages(msgs)}
            </div>
            ${chatForm}
        </div>
    </div>`;
}

function sendChatMessage() {
    if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }
    if (isBanned()) { showToast('정지된 계정은 채팅할 수 없습니다.', 'error'); return; }
    if (isTimedOut()) { showToast('타임아웃 상태에서는 채팅할 수 없습니다.', 'error'); return; }
    if (!RateLimit.check('chat')) {
        showToast('너무 빠르게 전송하고 있습니다.', 'warning');
        return;
    }

    const input = document.getElementById('chatInput');
    if (!input) return;

    const text = Security.sanitize(input.value.trim().slice(0, 500));
    if (!text) return;

    const user = currentUser();
    const msg = {
        id: Date.now().toString(),
        text: text,
        author: user.nickname,
        authorId: user.id,
        authorRole: user.role,
        createdAt: Date.now()
    };

    const msgs = DB.get('chat', []);
    msgs.push(msg);
    DB.set('chat', msgs);
    addLog('chat_message', { text: text });
    input.value = '';
    input.focus();
}

function deleteChatMessage(id) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;
    const msgs = DB.get('chat', []);
    const msg = msgs.find(m => m.id === id);
    DB.set('chat', msgs.filter(m => m.id !== id));
    addLog('chat_delete', { messageId: id, text: msg?.text || '(내용 없음)' });
    showToast('메시지가 삭제되었습니다.', 'info');
}
