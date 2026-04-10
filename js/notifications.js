// =============================================
// 브라우저 알림 (Web Notifications API)
// =============================================

const _NOTIF_LS = {
    lastNoticeTime: 'notif_lastNoticeTime',
    lastBoardTime:  'notif_lastBoardTime',
    dismissed:      'notif_dismissed',  // 알림 거부 시 다시 묻지 않음
};

function notifSupported() { return 'Notification' in window; }
function notifGranted()   { return notifSupported() && Notification.permission === 'granted'; }
function notifDenied()    { return notifSupported() && Notification.permission === 'denied'; }

// 알림 권한 요청 (로그인 후 1회)
async function requestNotifPermission() {
    if (!notifSupported()) return false;
    if (notifGranted()) return true;
    if (notifDenied()) return false;
    if (localStorage.getItem(_NOTIF_LS.dismissed)) return false;

    const result = await Notification.requestPermission();
    if (result !== 'granted') {
        localStorage.setItem(_NOTIF_LS.dismissed, '1');
    }
    return result === 'granted';
}

function _showBrowserNotif(title, body, page, params) {
    if (!notifGranted()) return;
    try {
        const notif = new Notification(title, {
            body,
            icon: location.origin + '/assets/logo.svg',
        });
        notif.onclick = () => {
            window.focus();
            navigate(page, params || {});
            notif.close();
        };
        setTimeout(() => notif.close(), 8000);
    } catch(e) {}
}

// Firebase 리스너 — 새 공지/게시글 감지
let _notifListening = false;
function initNotifications() {
    if (!notifGranted() || !fbReady() || _notifListening) return;
    _notifListening = true;

    // 현재 최신 시각을 기준으로 초기화 (기존 글은 알림 안 띄움)
    const now = Date.now();
    if (!localStorage.getItem(_NOTIF_LS.lastNoticeTime)) {
        localStorage.setItem(_NOTIF_LS.lastNoticeTime, now.toString());
    }
    if (!localStorage.getItem(_NOTIF_LS.lastBoardTime)) {
        localStorage.setItem(_NOTIF_LS.lastBoardTime, now.toString());
    }

    // 공지사항 리스너
    let noticeSkipFirst = true;
    _fbDB.ref('data/notices').on('value', snap => {
        if (noticeSkipFirst) { noticeSkipFirst = false; return; }
        _handleNewItems(snap.val(), _NOTIF_LS.lastNoticeTime,
            '📢 새 공지사항', 'notice-detail');
    });

    // 자유게시판 리스너
    let boardSkipFirst = true;
    _fbDB.ref('data/board').on('value', snap => {
        if (boardSkipFirst) { boardSkipFirst = false; return; }
        _handleNewItems(snap.val(), _NOTIF_LS.lastBoardTime,
            '💬 새 게시글', 'board-detail');
    });
}

function _handleNewItems(jsonStr, lastTimeKey, prefix, detailPage) {
    if (!jsonStr) return;
    let items;
    try { items = JSON.parse(jsonStr); } catch { return; }
    if (!Array.isArray(items) || items.length === 0) return;

    const lastTime = parseInt(localStorage.getItem(lastTimeKey) || '0');
    const me = currentUser();
    // 내가 작성한 글은 알림 제외
    const newItems = items.filter(item =>
        item.createdAt > lastTime && (!me || item.authorId !== me.id)
    );

    if (newItems.length > 0) {
        const maxTime = Math.max(...items.map(i => i.createdAt));
        localStorage.setItem(lastTimeKey, maxTime.toString());

        const newest = newItems.sort((a, b) => b.createdAt - a.createdAt)[0];
        _showBrowserNotif(
            prefix,
            newest.title + (newest.author ? ` — ${newest.author}` : ''),
            detailPage,
            { id: newest.id }
        );
    }
}

// 알림 활성화 여부 토글 (설정용)
function notifEnabled() {
    return notifGranted();
}
