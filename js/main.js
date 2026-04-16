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

    // 메뉴 초기 상태 보장 + 이벤트 직접 연결
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (navMenu) navMenu.classList.remove('active');
    if (hamburger) {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.addEventListener('click', toggleMenu);
    }

    // 즉시 localStorage 데이터로 렌더 (Firebase를 기다리지 않음)
    render();

    // Firebase 백그라운드 동기화 (업데이트가 오면 자동 re-render)
    startFirebaseSync();

    // 채팅 내역 자정 초기화 (렌더 후 지연 실행)
    setTimeout(() => cleanChatMessages(), 0);

    // 방문자 카운터 (Firebase 연결 후 실행)
    setTimeout(() => trackVisit(), 1500);

    // Self-XSS 경고
    console.warn('%c⚠ 경고!', 'color:red;font-size:2rem;font-weight:bold');
    console.warn('이 콘솔에 코드를 붙여넣지 마세요. 계정이 탈취될 수 있습니다.');
});
