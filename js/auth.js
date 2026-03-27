// =============================================
// 인증 (로그인 / 로그아웃)
// =============================================
function login() {
    if (!RateLimit.check('login')) {
        const wait = Math.ceil(RateLimit.waitTime('login') / 1000);
        showToast(`너무 많은 로그인 시도입니다. ${wait}초 후에 다시 시도하세요.`, 'error');
        return;
    }

    const id = document.getElementById('loginId').value.trim().slice(0, Security.MAX_INPUT);
    const pw = document.getElementById('loginPw').value.trim().slice(0, Security.MAX_INPUT);

    if (!id || !pw) {
        showToast('아이디와 비밀번호를 입력해주세요.', 'warning');
        return;
    }

    const pwOverrides = DB.get('pw_overrides', {});
    const account = ACCOUNTS.find(a => {
        if (a.username !== id) return false;
        const override = pwOverrides[a.id];
        return override !== undefined ? override === pw : String(a.password) === String(pw);
    });

    if (!account) {
        const rem = RateLimit.remaining('login');
        showToast(`아이디 또는 비밀번호가 올바르지 않습니다. (${rem}회 남음)`, 'error');
        return;
    }

    DB.set('currentUser', {
        id: account.id,
        username: account.username,
        nickname: account.nickname,
        role: account.role
    });
    sessionConnect(account.id);
    showToast(`${account.nickname}님, 환영합니다!`, 'success');
    navigate('home');
}

function logout() {
    const user = currentUser();
    if (user) sessionDisconnect(user.id);
    DB.remove('currentUser');
    showToast('로그아웃되었습니다.', 'info');
    navigate('home');
}

function renderChangePassword() {
    if (!isLoggedIn()) return renderLoginRequiredPage ? renderLoginRequiredPage() : '';
    const user = currentUser();
    return `
    <div class="page auth-container">
        <div class="auth-card">
            <div class="auth-logo"><img src="assets/logo.svg" alt="로고"></div>
            <h2>🔑 비밀번호 변경</h2>
            <p class="auth-sub">${escapeHtml(user.nickname)}님의 비밀번호를 변경합니다</p>
            <div class="form-group">
                <label>현재 비밀번호</label>
                <input type="password" class="form-input" id="cpCurrent" placeholder="현재 비밀번호" maxlength="50"
                    onkeydown="if(event.key==='Enter')document.getElementById('cpNew').focus()">
            </div>
            <div class="form-group">
                <label>새 비밀번호</label>
                <input type="password" class="form-input" id="cpNew" placeholder="새 비밀번호 (4자 이상)" maxlength="50"
                    onkeydown="if(event.key==='Enter')document.getElementById('cpConfirm').focus()">
            </div>
            <div class="form-group">
                <label>새 비밀번호 확인</label>
                <input type="password" class="form-input" id="cpConfirm" placeholder="새 비밀번호를 다시 입력하세요" maxlength="50"
                    onkeydown="if(event.key==='Enter')changePassword()">
            </div>
            <button class="btn btn-primary" style="width:100%;padding:14px;font-size:0.95rem" onclick="changePassword()">비밀번호 변경</button>
            <button class="btn btn-ghost" style="width:100%;margin-top:10px" onclick="navigate('home')">취소</button>
        </div>
    </div>`;
}

function changePassword() {
    const user = currentUser();
    if (!user) { showToast('로그인이 필요합니다.', 'error'); return; }

    const current  = document.getElementById('cpCurrent').value;
    const newPw    = document.getElementById('cpNew').value;
    const confirm  = document.getElementById('cpConfirm').value;

    if (!current || !newPw || !confirm) {
        showToast('모든 항목을 입력해주세요.', 'warning'); return;
    }
    if (newPw.length < 4) {
        showToast('새 비밀번호는 4자 이상이어야 합니다.', 'warning'); return;
    }
    if (newPw !== confirm) {
        showToast('새 비밀번호가 일치하지 않습니다.', 'error'); return;
    }

    // 현재 비밀번호 검증
    const pwOverrides = DB.get('pw_overrides', {});
    const storedPw = pwOverrides[user.id] !== undefined
        ? pwOverrides[user.id]
        : String(ACCOUNTS.find(a => a.id === user.id)?.password ?? '');

    if (current !== storedPw) {
        showToast('현재 비밀번호가 올바르지 않습니다.', 'error'); return;
    }
    if (newPw === storedPw) {
        showToast('새 비밀번호가 현재 비밀번호와 같습니다.', 'warning'); return;
    }

    pwOverrides[user.id] = newPw;
    DB.set('pw_overrides', pwOverrides);
    showToast('비밀번호가 변경되었습니다.', 'success');
    navigate('home');
}

function renderLogin() {
    const rem = RateLimit.remaining('login');
    const lockMsg = rem <= 0
        ? `<p style="color:var(--danger);font-size:0.82rem;text-align:center;margin-bottom:16px;font-weight:600">⚠ 로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도하세요.</p>`
        : '';

    return `
    <div class="page auth-container">
        <div class="auth-card">
            <div class="auth-logo"><img src="assets/logo.svg" alt="로고"></div>
            <h2>로그인</h2>
            <p class="auth-sub">은가람 중학교 1학년 2반에 오신 것을 환영합니다</p>
            ${lockMsg}
            <div class="form-group">
                <label>아이디 (학번)</label>
                <input type="text" class="form-input" id="loginId" placeholder="학번 또는 아이디를 입력하세요" maxlength="50" autocomplete="username"
                    onkeydown="if(event.key==='Enter')document.getElementById('loginPw').focus()">
            </div>
            <div class="form-group">
                <label>비밀번호</label>
                <input type="password" class="form-input" id="loginPw" placeholder="비밀번호를 입력하세요" maxlength="50" autocomplete="current-password"
                    onkeydown="if(event.key==='Enter')login()">
            </div>
            <button class="btn btn-primary" style="width:100%;padding:14px;font-size:0.95rem" onclick="login()" ${rem <= 0 ? 'disabled' : ''}>로그인</button>
            <p style="text-align:center;margin-top:18px;font-size:0.8rem;color:var(--text-muted)">
                계정 관련 문의는 담임선생님께 연락하세요.
            </p>
        </div>
    </div>`;
}
