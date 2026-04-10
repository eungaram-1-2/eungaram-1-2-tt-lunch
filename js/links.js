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

        if (link.audio) {
            // 오디오 플레이어 모달
            return `<div class="link-card-v" style="cursor:pointer" onclick="openSchoolSongModal('${link.audio}','${link.title}')">${cardBody}</div>`;
        } else if (link.page) {
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

function openSchoolSongModal(src, title) {
    // 기존에 재생 중인 오디오 정리
    if (window._schoolSongAudio) {
        window._schoolSongAudio.pause();
        window._schoolSongAudio = null;
    }

    const bodyHtml = `
    <div id="schoolSongWrap" style="
        background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
        border-radius: 0 0 14px 14px;
        padding: 32px 24px 28px;
        position: relative;
        overflow: hidden;
        text-align: center;
        color: #fff;
        margin: -28px -28px -28px -28px;
    ">
        <!-- 배경 음표 장식 -->
        <div style="position:absolute;top:12px;right:16px;font-size:3.5rem;opacity:0.15;line-height:1;pointer-events:none">🎵</div>

        <!-- 음표 아이콘 -->
        <div style="font-size:3rem;margin-bottom:14px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2))">🎵</div>

        <!-- 제목 -->
        <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:6px;letter-spacing:-0.01em">은가람 중학교 교가</h3>
        <p style="font-size:0.86rem;opacity:0.8;margin-bottom:22px">우리 학교 교가를 감상해보세요</p>

        <!-- 플레이어 패널 -->
        <div style="
            background: rgba(255,255,255,0.18);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 14px;
            padding: 16px 18px;
        ">
            <!-- 컨트롤 행 -->
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
                <!-- 재생 버튼 -->
                <button id="ssp_play" onclick="sspTogglePlay()" style="
                    width:48px;height:48px;border-radius:50%;
                    background:#fff;border:none;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;
                    flex-shrink:0;
                    box-shadow:0 4px 12px rgba(0,0,0,0.18);
                    transition:transform .15s,box-shadow .15s;
                " onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
                    <svg id="ssp_icon" viewBox="0 0 24 24" width="20" height="20" fill="#4f46e5">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>

                <!-- 제목/상태 -->
                <div style="flex:1;text-align:left;min-width:0">
                    <div style="font-size:0.9rem;font-weight:700;color:#fff;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">은가람 중학교 교가</div>
                    <div id="ssp_status" style="font-size:0.72rem;opacity:0.75;color:#fff">재생 대기 중</div>
                </div>
            </div>

            <!-- 진행바 -->
            <div id="ssp_prog_wrap" onclick="sspSeek(event)" style="
                position:relative;height:5px;
                background:rgba(255,255,255,0.3);
                border-radius:3px;cursor:pointer;margin-bottom:8px;
            ">
                <div id="ssp_prog_bar" style="
                    height:100%;width:0%;
                    background:#fff;border-radius:3px;
                    transition:width .1s linear;pointer-events:none;
                "></div>
                <!-- 드래그 핸들 -->
                <div id="ssp_prog_thumb" style="
                    position:absolute;top:50%;left:0%;
                    width:13px;height:13px;
                    background:#fff;border-radius:50%;
                    transform:translate(-50%,-50%);
                    box-shadow:0 2px 6px rgba(0,0,0,0.25);
                    pointer-events:none;transition:left .1s linear;
                "></div>
                <input type="range" id="ssp_prog_input" min="0" max="100" value="0"
                    oninput="sspSeekByInput(this.value)"
                    style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0">
            </div>

            <!-- 시간 -->
            <div style="display:flex;justify-content:space-between;font-size:0.72rem;opacity:0.8;margin-bottom:12px">
                <span id="ssp_cur">0:00</span>
                <span id="ssp_dur">0:00</span>
            </div>

            <!-- 볼륨 -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
                <span style="font-size:0.85rem;opacity:0.8">🔈</span>
                <input type="range" id="ssp_vol" min="0" max="1" step="0.01" value="0.8"
                    oninput="sspSetVol(this.value)"
                    style="flex:1;height:4px;accent-color:#fff;cursor:pointer">
                <span style="font-size:0.85rem;opacity:0.8">🔊</span>
            </div>

            <!-- 배속 + 반복 행 -->
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
                <!-- 배속 -->
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span style="font-size:0.72rem;opacity:0.8;flex-shrink:0">배속</span>
                    ${[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => `
                    <button onclick="sspSetRate(${r},this)" data-rate="${r}" style="
                        background:${r===1 ? '#fff' : 'rgba(255,255,255,0.2)'};
                        color:${r===1 ? '#4f46e5' : '#fff'};
                        border:1px solid rgba(255,255,255,0.35);
                        border-radius:6px;padding:3px 8px;
                        font-size:0.72rem;font-weight:700;cursor:pointer;
                        transition:all .15s;font-family:inherit;
                    " id="ssp_rate_${String(r).replace('.','_')}">${r}x</button>`).join('')}
                </div>

                <!-- 무한 반복 -->
                <button id="ssp_loop_btn" onclick="sspToggleLoop()" style="
                    background:rgba(255,255,255,0.2);
                    border:1px solid rgba(255,255,255,0.35);
                    color:#fff;border-radius:6px;
                    padding:3px 12px;font-size:0.72rem;font-weight:700;
                    cursor:pointer;transition:all .15s;font-family:inherit;
                    display:flex;align-items:center;gap:5px;
                ">
                    <span id="ssp_loop_icon">🔁</span>
                    <span id="ssp_loop_label">반복 꺼짐</span>
                </button>
            </div>

            <!-- 가사 섹션 -->
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2)">
                <div style="font-size:0.95rem;font-weight:700;opacity:0.9;margin-bottom:14px">📝 교가 가사</div>
                <div style="display:flex;gap:24px">
                    <div style="flex:1">
                        <div style="font-size:0.9rem;font-weight:700;color:#fff;opacity:0.8;margin-bottom:10px">1절</div>
                        <div style="font-size:0.9rem;line-height:1.8;opacity:0.9">
                            <div>검단산 정기 담아</div>
                            <div>흐르는 은빛물결</div>
                            <div style="margin-top:6px">한강물 굽이 굽이</div>
                            <div>아름다운 미사강변에</div>
                            <div style="margin-top:6px">지혜로운 마음으로</div>
                            <div>우뚝 선 배움의 전당</div>
                            <div style="margin-top:6px">온누리를 밝혀주는</div>
                            <div>은가람중학교</div>
                        </div>
                    </div>
                    <div style="flex:1">
                        <div style="font-size:0.9rem;font-weight:700;color:#fff;opacity:0.8;margin-bottom:10px">2절</div>
                        <div style="font-size:0.9rem;line-height:1.8;opacity:0.9">
                            <div>소나무 푸른기상</div>
                            <div>라일락 진한 향기</div>
                            <div style="margin-top:6px">우리들 가슴속에</div>
                            <div>가득찬 배움의 열정</div>
                            <div style="margin-top:6px">사랑의 마음으로</div>
                            <div>꿈키울 배움의 전당</div>
                            <div style="margin-top:6px">찬란하게 빛밝히는</div>
                            <div>은가람중학교</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <audio id="ssp_audio" src="${src}" preload="metadata" style="display:none"></audio>
    </div>`;

    openModal(title, bodyHtml);

    // 오디오 초기화
    requestAnimationFrame(() => {
        const audio = document.getElementById('ssp_audio');
        if (!audio) return;
        window._schoolSongAudio = audio;
        audio.volume = 0.8;

        audio.addEventListener('timeupdate', sspOnTimeUpdate);
        audio.addEventListener('loadedmetadata', () => {
            document.getElementById('ssp_dur').textContent = sspFmtTime(audio.duration);
        });
        audio.addEventListener('ended', () => {
            if (!audio.loop) {
                sspSetPauseIcon();
                document.getElementById('ssp_status').textContent = '재생 완료';
            }
        });
        audio.addEventListener('error', () => {
            document.getElementById('ssp_status').textContent = '파일 로드 실패';
        });

        // 자동 재생
        audio.play().then(() => {
            sspSetPlayIcon();
            document.getElementById('ssp_status').textContent = '재생 중';
        }).catch(() => {});
    });
}

/* ── 교가 플레이어 헬퍼 함수 ── */
function sspFmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function sspOnTimeUpdate() {
    const audio = document.getElementById('ssp_audio');
    const cur   = document.getElementById('ssp_cur');
    const bar   = document.getElementById('ssp_prog_bar');
    const thumb = document.getElementById('ssp_prog_thumb');
    const inp   = document.getElementById('ssp_prog_input');
    if (!audio) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
    if (cur)   cur.textContent = sspFmtTime(audio.currentTime);
    if (bar)   bar.style.width = pct + '%';
    if (thumb) thumb.style.left = pct + '%';
    if (inp)   inp.value = pct;
}

function sspTogglePlay() {
    const audio = document.getElementById('ssp_audio');
    if (!audio) return;
    if (audio.paused) {
        audio.play().catch(() => {});
        sspSetPlayIcon();
        document.getElementById('ssp_status').textContent = '재생 중';
    } else {
        audio.pause();
        sspSetPauseIcon();
        document.getElementById('ssp_status').textContent = '일시정지';
    }
}

function sspSetPlayIcon() {
    const icon = document.getElementById('ssp_icon');
    if (icon) icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
}

function sspSetPauseIcon() {
    const icon = document.getElementById('ssp_icon');
    if (icon) icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
}

function sspSeek(e) {
    const audio = document.getElementById('ssp_audio');
    const wrap  = document.getElementById('ssp_prog_wrap');
    if (!audio || !audio.duration || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
}

function sspSeekByInput(v) {
    const audio = document.getElementById('ssp_audio');
    if (!audio || !audio.duration) return;
    audio.currentTime = (v / 100) * audio.duration;
}

function sspSetVol(v) {
    const audio = document.getElementById('ssp_audio');
    if (audio) audio.volume = parseFloat(v);
}

function sspSetRate(rate, btn) {
    const audio = document.getElementById('ssp_audio');
    if (audio) audio.playbackRate = rate;
    // 버튼 스타일 업데이트
    document.querySelectorAll('[data-rate]').forEach(b => {
        const active = parseFloat(b.dataset.rate) === rate;
        b.style.background = active ? '#fff' : 'rgba(255,255,255,0.2)';
        b.style.color       = active ? '#4f46e5' : '#fff';
    });
}

function sspToggleLoop() {
    const audio = document.getElementById('ssp_audio');
    if (!audio) return;
    audio.loop = !audio.loop;
    const btn   = document.getElementById('ssp_loop_btn');
    const label = document.getElementById('ssp_loop_label');
    if (audio.loop) {
        btn.style.background   = '#fff';
        btn.style.color        = '#4f46e5';
        label.textContent      = '반복 켜짐';
    } else {
        btn.style.background   = 'rgba(255,255,255,0.2)';
        btn.style.color        = '#fff';
        label.textContent      = '반복 꺼짐';
    }
}

// 모달 닫힐 때 오디오 정지
const _origCloseModal = closeModal;
closeModal = function() {
    const audio = document.getElementById('ssp_audio');
    if (audio) { audio.pause(); audio.removeEventListener('timeupdate', sspOnTimeUpdate); }
    if (window._schoolSongAudio) {
        window._schoolSongAudio.pause();
        window._schoolSongAudio = null;
    }
    _origCloseModal();
};
