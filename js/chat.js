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

        let actionBtns = '';
        if (isAdmin()) {
            actionBtns = `<button class="btn btn-ghost btn-sm" style="color:var(--danger);padding:2px 6px;font-size:0.7rem" onclick="deleteChatMessage('${m.id}')">삭제</button>`;
        } else if (isOwn) {
            actionBtns = `
                <button class="btn btn-ghost btn-sm" style="color:var(--primary);padding:2px 6px;font-size:0.7rem" onclick="editChatMessage('${m.id}')">수정</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger);padding:2px 6px;font-size:0.7rem" onclick="deleteChatMessage('${m.id}')">삭제</button>`;
        }

        const editedBadge = m.editedAt ? '<span style="font-size:0.65rem;color:var(--text-muted)"> (수정됨)</span>' : '';

        return `
        <div class="chat-msg ${isOwn ? 'chat-msg-mine' : 'chat-msg-other'}">
            <div class="chat-msg-header">
                <span class="chat-msg-author">${escapeHtml(m.author)} ${adminBadge}</span>
                <span class="chat-msg-time">${formatDate(m.createdAt)}${editedBadge}${actionBtns ? ` ${actionBtns}` : ''}</span>
            </div>
            <div class="chat-msg-text">${escapeHtml(m.text)}</div>
            ${isOwn ? renderReactions(m, 'chat', m.id) : ''}
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
    // 비로그인 또는 밴/타임아웃은 채팅 접근 불가
    if (!isLoggedIn()) {
        return `
        <div class="page">
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <p style="font-weight:700;font-size:1rem">로그인이 필요합니다.</p>
                <p style="font-size:0.85rem;margin-top:8px;color:var(--text-muted)">채팅을 이용하려면 로그인하세요.</p>
                <button class="btn btn-primary" style="margin-top:18px" onclick="navigate('login')">로그인하기</button>
            </div>
        </div>`;
    }
    if (isBanned() || isTimedOut()) {
        return `
        <div class="page">
            <div class="empty-state">
                <div class="empty-icon">🚫</div>
                <p style="color:var(--danger);font-weight:700;font-size:1rem">접근할 수 없습니다.</p>
                <p style="font-size:0.85rem;margin-top:8px;color:var(--text-muted)">정지되었거나 제한된 계정입니다.</p>
            </div>
        </div>`;
    }

    cleanChatMessages();
    initChatListener();
    const user = currentUser();
    const msgs = DB.get('chat', []);

    const chatForm = `
    <div class="chat-input-area">
        <input type="text" id="chatInput" class="form-input" placeholder="메시지를 입력하세요..." maxlength="500"
            onkeydown="if(event.key==='Enter')sendChatMessage()">
        <button class="btn btn-primary btn-sm" onclick="sendChatMessage()" style="white-space:nowrap;margin-left:8px">전송</button>
    </div>`;

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

function editChatMessage(id) {
    const user = currentUser();
    if (!user) return;

    const msgs = DB.get('chat', []);
    const msg = msgs.find(m => m.id === id);
    if (!msg) return;

    if (!isAdmin() && msg.authorId !== user.id) {
        showToast('자신의 메시지만 수정할 수 있습니다.', 'error');
        return;
    }

    openModal('메시지 수정', `
        <div class="form-group">
            <label>메시지</label>
            <textarea class="form-textarea" id="editChatText" maxlength="500" rows="4">${escapeHtml(msg.text)}</textarea>
        </div>
        <div style="display:flex;gap:10px">
            <button class="btn btn-outline" style="flex:1" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" style="flex:2" onclick="submitEditChatMessage('${id}')">수정 완료</button>
        </div>
    `);
}

function submitEditChatMessage(id) {
    const user = currentUser();
    if (!user) return;

    const titleV = Security.sanitize(document.getElementById('editChatText').value.trim().slice(0, 500));
    if (!titleV) { showToast('메시지를 입력해주세요.', 'warning'); return; }

    const msgs = DB.get('chat', []);
    const idx = msgs.findIndex(m => m.id === id);
    if (idx === -1) return;

    if (!isAdmin() && msgs[idx].authorId !== user.id) {
        showToast('자신의 메시지만 수정할 수 있습니다.', 'error');
        return;
    }

    msgs[idx].text = titleV;
    msgs[idx].editedAt = Date.now();
    DB.set('chat', msgs);
    closeModal();
    showToast('메시지가 수정되었습니다.', 'success');
}

function deleteChatMessage(id) {
    const user = currentUser();
    if (!user) return;

    const msgs = DB.get('chat', []);
    const msg = msgs.find(m => m.id === id);
    if (!msg) return;

    if (!isAdmin() && msg.authorId !== user.id) {
        showToast('자신의 메시지만 삭제할 수 있습니다.', 'error');
        return;
    }

    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;
    DB.set('chat', msgs.filter(m => m.id !== id));
    addLog('chat_delete', { messageId: id, text: msg?.text || '(내용 없음)' });
    showToast('메시지가 삭제되었습니다.', 'info');
}
