// =============================================
// 바로가기
// =============================================
function renderLinks() {
    const cards = QUICK_LINKS.map(link => {
        const cardBody = `
            <div class="link-card-v-top" style="background:linear-gradient(135deg,${link.color}22 0%,${link.color}44 100%)">
                <span style="font-size:2.2rem;filter:drop-shadow(0 2px 6px ${link.color}55)">${link.icon}</span>
            </div>
            <div class="link-card-v-body">
                <h3>${link.title}</h3>
                <p>${link.desc}</p>
                <span style="display:inline-block;margin-top:10px;font-size:0.75rem;font-weight:700;color:${link.color};letter-spacing:0.04em">바로가기 →</span>
            </div>`;

        if (link.page) {
            // 내부 링크 (채팅 등)
            const onclick = !isLoggedIn() ? `navigate('login')` : `navigate('${link.page}')`;
            return `<div class="link-card-v" style="cursor:pointer" onclick="${onclick}">${cardBody}</div>`;
        } else {
            // 외부 링크
            return `<a class="link-card-v" href="${link.url}" target="_blank" rel="noopener noreferrer">${cardBody}</a>`;
        }
    }).join('');

    return `
    <div class="page">
        <div class="page-header">
            <h2>🔗 바로가기</h2>
            <p style="font-size:0.88rem;color:var(--text-muted)">자주 사용하는 학교 관련 링크 모음</p>
        </div>
        <div class="links-grid-v">${cards}</div>
    </div>`;
}
