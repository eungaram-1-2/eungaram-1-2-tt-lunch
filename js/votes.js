// =============================================
// 투표
// =============================================
function renderVotes() {
    const votes = DB.get('votes').sort((a, b) => b.createdAt - a.createdAt);
    const createBtn = isAdmin()
        ? `<button class="btn btn-primary" onclick="navigate('vote-create')">✏️ 투표 만들기</button>` : '';

    let content = '';
    if (votes.length === 0) {
        content = `<div class="empty-state"><div class="empty-icon">🗳️</div><p>등록된 투표가 없습니다.</p></div>`;
    } else {
        content = votes.map(v => {
            const total  = v.options.reduce((s, o) => s + o.votes, 0);
            const sc     = v.active ? 'active' : 'closed';
            const st     = v.active ? '● 진행중' : '● 마감';
            const attach = v.attachment ? ' 📎' : '';
            return `
            <div class="vote-card" onclick="navigate('vote-detail',{id:'${v.id}'})">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px">
                    <h3>${escapeHtml(v.title)}${attach}</h3>
                    <span class="vote-status ${sc}">${st}</span>
                </div>
                <div class="vote-meta">${escapeHtml(v.author)} · ${formatDate(v.createdAt)} · ${total}명 참여 · 👁 ${v.viewers ? v.viewers.length : 0}</div>
                ${v.options.map(o => {
                    const pct = total > 0 ? Math.round(o.votes / total * 100) : 0;
                    return `<div style="margin-bottom:8px">
                        <div class="vote-bar-label"><span>${escapeHtml(o.text)}</span><span>${pct}%</span></div>
                        <div class="vote-bar"><div class="vote-bar-fill" style="width:${pct}%"></div></div>
                    </div>`;
                }).join('')}
            </div>`;
        }).join('');
    }

    return `
    <div class="page">
        <div class="page-header"><h2>🗳️ 투표</h2>${createBtn}</div>
        ${content}
    </div>`;
}

function renderVoteDetail() {
    const votes = DB.get('votes');
    const vote  = votes.find(v => v.id === pageParams.id);
    if (!vote) return `<div class="page"><div class="empty-state"><div class="empty-icon">😕</div><p>투표를 찾을 수 없습니다.</p></div></div>`;

    const user       = currentUser();

    // 조회수 기록 (로그인된 계정 기준, 중복 X)
    if (user) {
        if (!vote.viewers) vote.viewers = [];
        if (!vote.viewers.includes(user.id)) {
            vote.viewers.push(user.id);
            DB.set('votes', votes);
        }
    }

    const hasVoted   = user && vote.voters && vote.voters.includes(user.id);
    const total      = vote.options.reduce((s, o) => s + o.votes, 0);
    const showResults = hasVoted || !vote.active;

    let attachHtml = '';
    if (vote.attachment) {
        attachHtml = `<div class="attachment-box" style="margin-top:18px">📎 첨부파일: <a href="${vote.attachment}" download="${escapeHtml(vote.attachmentName)}">${escapeHtml(vote.attachmentName)}</a></div>`;
    }

    let optionsHtml = '';
    if (showResults) {
        optionsHtml = vote.options.map(o => {
            const pct = total > 0 ? Math.round(o.votes / total * 100) : 0;
            return `<div style="margin-bottom:12px">
                <div class="vote-bar-label"><span style="font-weight:600">${escapeHtml(o.text)}</span><span>${pct}% (${o.votes}표)</span></div>
                <div class="vote-bar" style="height:12px"><div class="vote-bar-fill" style="width:${pct}%;height:12px"></div></div>
            </div>`;
        }).join('');
        if (hasVoted) optionsHtml += `<p style="color:var(--success);font-size:0.86rem;margin-top:10px;font-weight:600">✓ 투표 완료</p>`;
    } else if (vote.active && user && !hasVoted) {
        optionsHtml = vote.options.map((o, i) => `
            <label class="vote-option" onclick="this.querySelector('input').checked=true;document.querySelectorAll('.vote-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')">
                <input type="radio" name="voteOption" value="${i}">
                <span style="font-weight:500">${escapeHtml(o.text)}</span>
            </label>`).join('');
        optionsHtml += `<button class="btn btn-primary" style="margin-top:14px;width:100%;padding:14px" onclick="castVote('${vote.id}')">투표하기</button>`;
    } else if (!user) {
        optionsHtml = `<p style="color:var(--text-muted);text-align:center;padding:20px">투표하려면 로그인하세요.</p>`;
    }

    const sc = vote.active ? 'active' : 'closed';
    const st = vote.active ? '● 진행중' : '● 마감';

    let adminActions = '';
    if (isAdmin()) {
        const editBtn = canEdit(vote.createdAt) && vote.voters.length === 0
            ? `<button class="btn btn-outline btn-sm" onclick="openVoteEditModal('${vote.id}')">수정</button>`
            : '';
        adminActions = `<div style="display:flex;gap:8px;margin-top:18px;padding-top:18px;border-top:1px solid var(--border-light)">
            ${editBtn}
            ${vote.active ? `<button class="btn btn-outline btn-sm" onclick="closeVote('${vote.id}')">🔒 투표 마감</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteVote('${vote.id}')">삭제</button>
        </div>`;
    }

    return `
    <div class="page">
        <div class="card card-body">
            <button class="btn btn-ghost btn-sm" onclick="navigate('votes')" style="margin-bottom:18px">← 목록으로</button>
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
                <h2 style="font-size:1.3rem;font-weight:800">${escapeHtml(vote.title)}</h2>
                <span class="vote-status ${sc}">${st}</span>
            </div>
            <div class="vote-meta">${escapeHtml(vote.author)} · ${formatDate(vote.createdAt)} · 👁 ${vote.viewers ? vote.viewers.length : 0}명</div>
            ${vote.description ? `<p style="margin:18px 0;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap">${escapeHtml(vote.description)}</p>` : ''}
            ${attachHtml}
            <div style="margin-top:22px">${optionsHtml}</div>
            <div class="vote-total">${total}명 참여</div>
            ${adminActions}
        </div>
    </div>`;
}

function renderVoteCreate() {
    return `
    <div class="page">
        <div class="page-header">
            <h2>🗳️ 투표 만들기</h2>
            <button class="btn btn-ghost btn-sm" onclick="navigate('votes')">← 돌아가기</button>
        </div>
        <div class="card card-body">
            <div class="form-group">
                <label>투표 제목</label>
                <input type="text" class="form-input" id="voteTitle" placeholder="투표 제목을 입력하세요" maxlength="${Security.MAX_TITLE}">
            </div>
            <div class="form-group">
                <label>설명 (선택)</label>
                <textarea class="form-textarea" id="voteDesc" placeholder="투표에 대한 설명을 입력하세요" rows="3" maxlength="${Security.MAX_CONTENT}"></textarea>
            </div>
            <div class="form-group">
                <label>투표 항목</label>
                <div id="voteOptions">
                    <div style="display:flex;gap:8px;margin-bottom:8px">
                        <input type="text" class="form-input vote-opt-input" placeholder="항목 1" maxlength="${Security.MAX_TITLE}">
                        <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()" style="color:var(--danger)">✕</button>
                    </div>
                    <div style="display:flex;gap:8px;margin-bottom:8px">
                        <input type="text" class="form-input vote-opt-input" placeholder="항목 2" maxlength="${Security.MAX_TITLE}">
                        <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()" style="color:var(--danger)">✕</button>
                    </div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="addVoteOption()" style="color:var(--primary)">+ 항목 추가</button>
            </div>
            <div class="form-group">
                <label>📎 파일 첨부 <span style="color:var(--text-muted);font-weight:400;font-size:0.78rem">(최대 100MB)</span></label>
                <input type="file" class="form-input" id="voteFile" style="padding:10px">
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
                <button class="btn btn-ghost" onclick="navigate('votes')">취소</button>
                <button class="btn btn-primary" onclick="submitVote()">투표 생성</button>
            </div>
        </div>
    </div>`;
}

function addVoteOption() {
    const container = document.getElementById('voteOptions');
    if (container.children.length >= 20) {
        showToast('투표 항목은 최대 20개까지 가능합니다.', 'warning');
        return;
    }
    const n   = container.children.length + 1;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
    div.innerHTML = `
        <input type="text" class="form-input vote-opt-input" placeholder="항목 ${n}" maxlength="${Security.MAX_TITLE}">
        <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()" style="color:var(--danger)">✕</button>`;
    container.appendChild(div);
    div.querySelector('input').focus();
}

function submitVote() {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    if (!RateLimit.check('post')) {
        showToast('너무 자주 요청하고 있습니다. 잠시 후 다시 시도하세요.', 'warning');
        return;
    }
    const titleV = Security.validateTitle(document.getElementById('voteTitle').value);
    if (!titleV.ok) { showToast(titleV.msg, 'warning'); return; }

    const desc      = Security.sanitize(document.getElementById('voteDesc').value);
    const optInputs = document.querySelectorAll('.vote-opt-input');
    const fileInput = document.getElementById('voteFile');
    const user      = currentUser();

    const options = [];
    optInputs.forEach(input => {
        const val = input.value.trim().slice(0, Security.MAX_TITLE);
        if (val) options.push({ text: val, votes: 0 });
    });
    if (options.length < 2) { showToast('최소 2개의 항목이 필요합니다.', 'warning'); return; }

    if (fileInput && fileInput.files.length > 0) {
        const fileV = Security.validateFile(fileInput.files[0]);
        if (!fileV.ok) { showToast(fileV.msg, 'error'); return; }
    }

    const vote = {
        id: Date.now().toString(),
        title: titleV.value, description: desc, options,
        voters: [],
        author: user.nickname, authorId: user.id,
        createdAt: Date.now(), active: true,
        attachment: null, attachmentName: null
    };

    if (fileInput && fileInput.files.length > 0) {
        const file   = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            vote.attachment = e.target.result;
            vote.attachmentName = file.name;
            saveVote(vote);
        };
        reader.readAsDataURL(file);
    } else {
        saveVote(vote);
    }
}

function saveVote(vote) {
    const votes = DB.get('votes');
    votes.push(vote);
    DB.set('votes', votes);
    showToast('투표가 생성되었습니다!', 'success');
    navigate('votes');
}

function castVote(voteId) {
    if (!isLoggedIn()) { showToast('로그인이 필요합니다.', 'error'); return; }
    if (isBanned()) { showToast('정지된 계정은 투표할 수 없습니다.', 'error'); return; }
    if (isTimedOut()) { showToast('타임아웃 상태에서는 투표할 수 없습니다.', 'error'); return; }
    if (!RateLimit.check('vote')) {
        showToast('너무 자주 요청하고 있습니다.', 'warning');
        return;
    }
    const selected = document.querySelector('input[name="voteOption"]:checked');
    if (!selected) { showToast('항목을 선택해주세요.', 'warning'); return; }

    const user  = currentUser();
    const votes = DB.get('votes');
    const vote  = votes.find(v => v.id === voteId);
    if (!vote || !vote.active) { showToast('투표가 마감되었습니다.', 'error'); return; }
    if (vote.voters.includes(user.id)) { showToast('이미 투표하셨습니다.', 'warning'); return; }

    vote.options[parseInt(selected.value)].votes++;
    vote.voters.push(user.id);
    DB.set('votes', votes);
    showToast('투표가 완료되었습니다!', 'success');
    navigate('vote-detail', { id: voteId });
}

function closeVote(voteId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    if (!confirm('투표를 마감하시겠습니까?')) return;
    const votes = DB.get('votes');
    const vote  = votes.find(v => v.id === voteId);
    if (vote) { vote.active = false; DB.set('votes', votes); }
    showToast('투표가 마감되었습니다.', 'info');
    navigate('vote-detail', { id: voteId });
}

function deleteVote(voteId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    if (!confirm('투표를 삭제하시겠습니까?')) return;
    DB.set('votes', DB.get('votes').filter(v => v.id !== voteId));
    showToast('투표가 삭제되었습니다.', 'info');
    navigate('votes');
}

function openVoteEditModal(voteId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const votes = DB.get('votes');
    const vote = votes.find(v => v.id === voteId);
    if (!vote) return;
    if (!canEdit(vote.createdAt)) {
        showToast('생성 후 24시간이 지난 투표는 수정할 수 없습니다.', 'warning');
        return;
    }
    openModal('투표 수정', `
        <div class="form-group">
            <label>투표 제목</label>
            <input type="text" class="form-input" id="editVoteTitle" maxlength="${Security.MAX_TITLE}" value="${escapeHtml(vote.title)}">
        </div>
        <div class="form-group">
            <label>설명 (선택)</label>
            <textarea class="form-textarea" id="editVoteDesc" rows="3" maxlength="${Security.MAX_CONTENT}">${escapeHtml(vote.description || '')}</textarea>
        </div>
        <div style="display:flex;gap:10px">
            <button class="btn btn-outline" style="flex:1" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" style="flex:2" onclick="submitVoteEdit('${voteId}')">수정 완료</button>
        </div>
    `);
}

function submitVoteEdit(voteId) {
    if (!isAdmin()) { showToast('권한이 없습니다.', 'error'); return; }
    const titleV = Security.validateTitle(document.getElementById('editVoteTitle').value);
    if (!titleV.ok) { showToast(titleV.msg, 'warning'); return; }
    const desc = Security.sanitize(document.getElementById('editVoteDesc').value);
    const votes = DB.get('votes');
    const idx = votes.findIndex(v => v.id === voteId);
    if (idx === -1) return;
    if (!canEdit(votes[idx].createdAt)) {
        showToast('생성 후 24시간이 지난 투표는 수정할 수 없습니다.', 'warning');
        return;
    }
    votes[idx].title = titleV.value;
    votes[idx].description = desc;
    votes[idx].editedAt = Date.now();
    DB.set('votes', votes);
    closeModal();
    showToast('투표가 수정되었습니다.', 'success');
    navigate('vote-detail', { id: voteId });
}
