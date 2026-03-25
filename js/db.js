// =============================================
// 데이터 관리 (localStorage)
// =============================================
const DB = {
    get(key, def = []) {
        try { return JSON.parse(localStorage.getItem(key)) || def; }
        catch { return def; }
    },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
    remove(key)   { localStorage.removeItem(key); }
};

function currentUser() { return DB.get('currentUser', null); }
function isAdmin()     { const u = currentUser(); return u && u.role === 'admin'; }
function isLoggedIn()  { return !!currentUser(); }
function isBanned(userId) {
    const bans = DB.get('bans');
    const id = userId !== undefined ? userId : (currentUser() && currentUser().id);
    return !!id && bans.includes(id);
}

// =============================================
// 타임아웃 (임시 제한)
// =============================================
function getTimeoutInfo(userId) {
    const id = userId !== undefined ? userId : (currentUser() && currentUser().id);
    if (!id) return null;
    const timeouts = DB.get('timeouts', {});
    const t = timeouts[id];
    if (!t) return null;
    if (Date.now() >= t.until) {           // 만료 → 자동 정리
        delete timeouts[id];
        DB.set('timeouts', timeouts);
        return null;
    }
    return t;
}

function isTimedOut(userId) {
    return !!getTimeoutInfo(userId);
}

function setUserTimeout(userId, ms) {
    const timeouts = DB.get('timeouts', {});
    timeouts[userId] = { until: Date.now() + ms, setAt: Date.now() };
    DB.set('timeouts', timeouts);
}

function clearUserTimeout(userId) {
    const timeouts = DB.get('timeouts', {});
    delete timeouts[userId];
    DB.set('timeouts', timeouts);
}

// =============================================
// 관리자 로그
// =============================================
function addLog(action, details) {
    const user = currentUser();
    if (!user) return;
    const logs = DB.get('admin_logs', []);
    logs.unshift({
        timestamp: Date.now(),
        action,
        userId: user.id,
        userName: user.username,
        userNick: user.nickname,
        ...details
    });
    // 최근 1000개만 유지
    DB.set('admin_logs', logs.slice(0, 1000));
}

function getLogs() {
    return DB.get('admin_logs', []);
}

// =============================================
// 게시판 활동 로그
// =============================================
function addBoardLog(action, details) {
    const user = currentUser();
    if (!user) return;
    const logs = DB.get('board_logs', []);
    logs.unshift({
        timestamp: Date.now(),
        action,
        userId: user.id,
        userName: user.username,
        userNick: user.nickname,
        ...details
    });
    DB.set('board_logs', logs.slice(0, 2000));
}

function getBoardLogs() {
    return DB.get('board_logs', []);
}

// =============================================
// 세션 추적 (온라인 상태 + IP)
// =============================================
const SESSION_ONLINE_MS = 3 * 60 * 1000; // fallback: 3분 이내 = 접속중

// 관리자 화면에서 Firebase 리스너가 갱신하는 캐시
let _sessionCache = {};

/* ── localStorage fallback 헬퍼 ── */
function _lsSessionGet(userId) {
    return DB.get('sessions', {})[userId] || null;
}
function _lsSessionWrite(userId, patch) {
    const sessions = DB.get('sessions', {});
    sessions[userId] = Object.assign(sessions[userId] || {}, patch);
    DB.set('sessions', sessions);
}

/* ── 공개 API ── */

// 로그인 시 IP 조회 후 저장
async function sessionFetchIP(userId) {
    try {
        const res  = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        const ip   = data.ip;
        if (fbReady()) {
            _fbDB.ref(`sessions/${userId}`).update({ ip });
        } else {
            _lsSessionWrite(userId, { ip });
        }
    } catch { /* 무시 */ }
}

// Firebase presence 연결 (로그인 시 1회 호출)
function sessionConnect(userId) {
    if (!fbReady()) {
        // localStorage fallback: heartbeat
        _lsSessionWrite(userId, { online: true, lastSeen: Date.now(), connectedAt: Date.now() });
        return;
    }
    const presRef  = _fbDB.ref(`sessions/${userId}`);
    const connRef  = _fbDB.ref('.info/connected');

    connRef.on('value', snap => {
        if (!snap.val()) return;
        // 탭 닫힘/네트워크 끊김 → 자동 오프라인 처리
        presRef.onDisconnect().update({
            online:   false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        presRef.update({
            online:   true,
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            connectedAt: Date.now()
        });
    });
}

// 로그아웃 시 호출
function sessionDisconnect(userId) {
    if (fbReady()) {
        _fbDB.ref(`sessions/${userId}`).update({
            online:   false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        _fbDB.ref('.info/connected').off();
    } else {
        _lsSessionWrite(userId, { online: false, lastSeen: Date.now() });
    }
}

// localStorage fallback용 heartbeat
function sessionWriteHeartbeat() {
    if (fbReady()) return; // Firebase 사용 시 불필요
    const user = currentUser();
    if (!user) return;
    _lsSessionWrite(user.id, { online: true, lastSeen: Date.now() });
}

// 온라인 여부 (관리자 화면에서 사용)
function sessionIsOnline(userId) {
    if (fbReady()) {
        return !!_sessionCache[userId]?.online;
    }
    const s = _lsSessionGet(userId);
    return !!(s?.online && s?.lastSeen && (Date.now() - s.lastSeen < SESSION_ONLINE_MS));
}

// 세션 전체 데이터
function sessionGet(userId) {
    if (fbReady()) return _sessionCache[userId] || null;
    return _lsSessionGet(userId);
}

// 관리자 화면에서 실시간 리스너 등록 (Firebase) / 폴링 (localStorage)
function sessionListenAll(onChange) {
    if (fbReady()) {
        _fbDB.ref('sessions').on('value', snap => {
            _sessionCache = snap.val() || {};
            onChange(_sessionCache);
        });
        return () => _fbDB.ref('sessions').off();
    }
    // fallback: 5초 폴링
    const timer = setInterval(() => {
        onChange(DB.get('sessions', {}));
    }, 5000);
    return () => clearInterval(timer);
}

function sessionStopListenAll() {
    if (fbReady()) _fbDB.ref('sessions').off();
}
