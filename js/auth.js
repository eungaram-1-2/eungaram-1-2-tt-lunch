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

    const account = ACCOUNTS.find(a => a.username === id && String(a.password) === String(pw));

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
    sessionFetchIP(account.id);
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
