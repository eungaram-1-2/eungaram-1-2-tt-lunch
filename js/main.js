// =============================================
// 초기화
// =============================================
function updateClock() {
    const el = document.getElementById('navClock');
    if (!el) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const days = ['일','월','화','수','목','금','토'];
    el.textContent = `${now.getFullYear()}.${pad(now.getMonth()+1)}.${pad(now.getDate())} (${days[now.getDay()]}) ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(getTheme());
    updateClock();
    setInterval(updateClock, 1000);

    render();

    // 세션 연결 (새로고침 후에도 온라인 유지)
    if (isLoggedIn()) {
        const u = currentUser();
        sessionConnect(u.id);
        sessionFetchIP(u.id);
    }
    // localStorage fallback heartbeat
    setInterval(() => { if (isLoggedIn()) sessionWriteHeartbeat(); }, 30000);

    // Self-XSS 경고
    console.warn('%c⚠ 경고!', 'color:red;font-size:2rem;font-weight:bold');
    console.warn('이 콘솔에 코드를 붙여넣지 마세요. 계정이 탈취될 수 있습니다.');
});
