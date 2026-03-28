// =============================================
// 공통 유틸리티
// =============================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000)    return '방금 전';
    if (diff < 3600000)  return Math.floor(diff / 60000) + '분 전';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '시간 전';
    if (diff < 172800000) return '어제';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y === now.getFullYear() ? `${m}.${day}` : `${y}.${m}.${day}`;
}

function showToast(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const colors = { success:'#10b981', error:'#ef4444', info:'#7c3aed', warning:'#f59e0b' };
    const icons  = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="font-weight:700;font-size:1.05rem">${icons[type]}</span> ${escapeHtml(message)}`;
    Object.assign(toast.style, {
        position:'fixed', bottom:'24px', left:'50%',
        transform:'translateX(-50%) translateY(20px)',
        background: colors[type], color:'white',
        padding:'12px 24px', borderRadius:'12px',
        fontSize:'0.88rem', fontWeight:'600', zIndex:'9999', opacity:'0',
        boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
        display:'flex', alignItems:'center', gap:'8px',
        transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        fontFamily:"'Noto Sans KR', sans-serif",
        maxWidth:'calc(100vw - 32px)'
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function canEdit(createdAt) {
    return (Date.now() - createdAt) < 24 * 60 * 60 * 1000;
}

// =============================================
// 공지사항 뱃지 관리
// =============================================
function updateNoticeBadge() {
    const notices = DB.get('notices');
    if (!notices || notices.length === 0) {
        document.getElementById('noticeBadge').textContent = '';
        return;
    }

    // 마지막 조회 시간 이후의 공지사항 개수 계산
    const lastViewTime = parseInt(localStorage.getItem('lastNoticeViewTime') || '0', 10);
    const newNotices = notices.filter(n => n.createdAt > lastViewTime);

    const badge = document.getElementById('noticeBadge');
    const count = newNotices.length;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-flex';
    } else {
        badge.textContent = '';
        badge.style.display = 'none';
    }
}

function clearNoticeBadge() {
    const badge = document.getElementById('noticeBadge');
    badge.textContent = '';
    badge.style.display = 'none';
}
