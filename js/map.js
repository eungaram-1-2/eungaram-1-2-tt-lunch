// =============================================
// 지도 페이지 — OpenStreetMap + Leaflet.js
// =============================================

// 은가람중학교 기본 좌표
const SCHOOL_LAT = 37.575669;
const SCHOOL_LON = 127.1767861;

// 모듈 레벨 상태 (페이지 이탈 시 정리용)
let _mapInstance       = null;
let _routeLayer        = null;
let _searchDebounceTimer = null;
let _startMarker       = null;
let _endMarker         = null;

// ── 렌더러 (즉시 반환, DOM 삽입용 스켈레톤) ──────────────────────────────
function renderMap() {
    return `
    <div class="page">
        <div class="page-header">
            <h2>🗺️ 지도</h2>
            <p style="font-size:0.88rem;color:var(--text-muted)">학교 위치 확인 및 길찾기</p>
        </div>

        <!-- 검색창 -->
        <div class="map-search-wrap">
            <div class="map-search-row">
                <input
                    id="mapSearchInput"
                    class="search-input"
                    type="text"
                    placeholder="장소 검색 (예: 은가람중학교, 하남시청…)"
                    autocomplete="off"
                    aria-label="장소 검색"
                    aria-autocomplete="list"
                    aria-controls="mapSearchResults"
                    aria-expanded="false"
                >
                <button class="btn btn-primary btn-sm" id="mapSearchBtn" aria-label="검색">
                    🔍
                </button>
            </div>
            <div id="mapSearchResults" class="map-search-results" role="listbox"></div>
        </div>

        <!-- 지도 영역 -->
        <div style="position:relative">
            <div id="map-container">
                <div class="map-loading-overlay" id="mapLoadingOverlay">
                    <span>🗺️</span> 지도 불러오는 중…
                </div>
            </div>
            <button class="map-locate-btn" id="mapLocateBtn" title="현재 위치로 이동" aria-label="현재 위치">
                📍
            </button>
        </div>

        <!-- 길찾기 패널 (접을 수 있음) -->
        <div class="map-directions-panel" id="mapDirectionsPanel">
            <div class="map-directions-header" id="mapDirectionsHeader" role="button" tabindex="0" aria-expanded="false">
                <span>🧭 길찾기</span>
                <span class="map-dir-chevron">▼</span>
            </div>
            <div class="map-directions-body" id="mapDirectionsBody">
                <div class="map-dir-inputs">
                    <div class="map-dir-input-row">
                        <span class="map-dir-dot start"></span>
                        <input id="mapDirStart" class="form-input" type="text" placeholder="출발지 (예: 서울역)" autocomplete="off">
                        <button class="btn btn-outline btn-sm" onclick="mapUseCurrentLocationAsStart()" title="현재 위치를 출발지로">📍</button>
                    </div>
                    <div class="map-dir-input-row">
                        <span class="map-dir-dot end"></span>
                        <input id="mapDirEnd" class="form-input" type="text" placeholder="도착지 (기본: 은가람중학교)" autocomplete="off" value="은가람중학교">
                    </div>
                </div>
                <div class="map-dir-actions">
                    <button class="btn btn-primary" onclick="mapGetDirections()">경로 탐색</button>
                    <button class="btn btn-outline" onclick="mapClearRoute()">초기화</button>
                </div>
                <div class="map-route-info" id="mapRouteInfo">
                    <span id="mapRouteDist">—</span>
                    <span id="mapRouteDuration">—</span>
                </div>
            </div>
        </div>

        <p style="text-align:center;font-size:0.72rem;color:var(--text-muted);margin-top:14px">
            지도 데이터 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style="color:var(--primary)">OpenStreetMap</a> 기여자
        </p>
    </div>`;
}

// ── 초기화 (setTimeout 후 호출) ──────────────────────────────────────────
function initMapPage() {
    // 이전 인스턴스 정리 (페이지 재방문 시 이중 초기화 방지)
    if (_mapInstance) {
        _mapInstance.remove();
        _mapInstance = null;
    }
    _routeLayer  = null;
    _startMarker = null;
    _endMarker   = null;

    const container = document.getElementById('map-container');
    if (!container) return;

    // Leaflet 로드 확인
    if (typeof L === 'undefined') {
        container.innerHTML = `<div class="map-loading-overlay">Leaflet 라이브러리를 불러올 수 없습니다.</div>`;
        return;
    }

    // 로딩 오버레이 제거
    const overlay = document.getElementById('mapLoadingOverlay');
    if (overlay) overlay.remove();

    // Leaflet 지도 초기화
    _mapInstance = L.map('map-container', {
        center: [SCHOOL_LAT, SCHOOL_LON],
        zoom: 16,
        zoomControl: true
    });

    // OpenStreetMap 타일 레이어
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(_mapInstance);

    // 학교 기본 마커
    const schoolIcon = L.divIcon({
        html: `<div style="
            background:var(--primary,#4f46e5);
            color:#fff;font-size:1.3rem;
            width:40px;height:40px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 12px rgba(79,70,229,0.4);
            border:2px solid #fff;
        "><span style="transform:rotate(45deg)">🏫</span></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: ''
    });

    L.marker([SCHOOL_LAT, SCHOOL_LON], { icon: schoolIcon })
        .addTo(_mapInstance)
        .bindPopup('<strong>은가람중학교</strong><br>미사강변한강로 9, 경기 하남시')
        .openPopup();

    // 현재 위치 버튼
    const locateBtn = document.getElementById('mapLocateBtn');
    if (locateBtn) {
        locateBtn.addEventListener('click', mapLocateUser);
    }

    // 검색 이벤트
    const searchInput = document.getElementById('mapSearchInput');
    const searchBtn   = document.getElementById('mapSearchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(_searchDebounceTimer);
            _searchDebounceTimer = setTimeout(() => {
                mapSearchPlace(searchInput.value.trim());
            }, 1000);
        });

        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                clearTimeout(_searchDebounceTimer);
                mapSearchPlace(searchInput.value.trim());
            }
            if (e.key === 'Escape') mapCloseSearchResults();
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            clearTimeout(_searchDebounceTimer);
            mapSearchPlace(document.getElementById('mapSearchInput')?.value.trim() || '');
        });
    }

    // 길찾기 패널 토글
    const dirHeader = document.getElementById('mapDirectionsHeader');
    if (dirHeader) {
        dirHeader.addEventListener('click', mapToggleDirectionsPanel);
        dirHeader.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mapToggleDirectionsPanel(); }
        });
    }

    // 지도 클릭 시 검색 결과 닫기
    _mapInstance.on('click', mapCloseSearchResults);

    // 지도 바깥 클릭 시 결과 닫기
    document.addEventListener('click', mapHandleOutsideClick, true);
}

// ── 현재 위치 이동 ──────────────────────────────────────────────────────
function mapLocateUser() {
    if (!navigator.geolocation) {
        alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
        return;
    }
    const btn = document.getElementById('mapLocateBtn');
    if (btn) btn.textContent = '⏳';

    navigator.geolocation.getCurrentPosition(
        pos => {
            if (!_mapInstance) return;
            const { latitude: lat, longitude: lon } = pos.coords;
            _mapInstance.setView([lat, lon], 16, { animate: true });

            const userIcon = L.divIcon({
                html: `<div style="
                    width:16px;height:16px;
                    background:#3b82f6;
                    border:3px solid #fff;
                    border-radius:50%;
                    box-shadow:0 0 0 6px rgba(59,130,246,0.25);
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
                className: ''
            });

            L.marker([lat, lon], { icon: userIcon })
                .addTo(_mapInstance)
                .bindPopup('현재 위치')
                .openPopup();

            if (btn) btn.textContent = '📍';
        },
        err => {
            if (btn) btn.textContent = '📍';
            const msgs = {
                1: '위치 접근이 거부되었습니다.',
                2: '위치를 가져올 수 없습니다.',
                3: '위치 요청 시간이 초과되었습니다.'
            };
            alert(msgs[err.code] || '위치를 가져오지 못했습니다.');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

// ── 현재 위치를 출발지 필드에 채우기 ───────────────────────────────────
function mapUseCurrentLocationAsStart() {
    if (!navigator.geolocation) {
        document.getElementById('mapDirStart').value = '';
        alert('위치 정보를 지원하지 않는 브라우저입니다.');
        return;
    }
    const startInput = document.getElementById('mapDirStart');
    if (startInput) startInput.value = '위치 가져오는 중…';

    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude: lat, longitude: lon } = pos.coords;
            if (startInput) {
                startInput.value = '현재 위치';
                startInput.dataset.lat = lat;
                startInput.dataset.lon = lon;
            }
        },
        err => {
            if (startInput) startInput.value = '';
            alert('현재 위치를 가져올 수 없습니다.');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

// ── Nominatim 장소 검색 (1초 디바운스 후 호출) ─────────────────────────
async function mapSearchPlace(query) {
    const resultsEl = document.getElementById('mapSearchResults');
    const searchInput = document.getElementById('mapSearchInput');
    if (!resultsEl || !query) {
        mapCloseSearchResults();
        return;
    }

    resultsEl.innerHTML = `<div class="map-search-result-item" style="color:var(--text-muted)">검색 중…</div>`;
    resultsEl.classList.add('active');
    if (searchInput) searchInput.setAttribute('aria-expanded', 'true');

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=kr&accept-language=ko`;
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'ko' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.length) {
            resultsEl.innerHTML = `<div class="map-search-result-item" style="color:var(--text-muted)">검색 결과가 없습니다.</div>`;
            return;
        }

        resultsEl.innerHTML = data.map((item, idx) => {
            const name = item.display_name.split(',').slice(0, 3).join(', ');
            return `<div class="map-search-result-item"
                role="option"
                tabindex="0"
                data-lat="${item.lat}"
                data-lon="${item.lon}"
                data-name="${escapeHtml(item.display_name)}"
                onclick="mapSelectSearchResult(${item.lat}, ${item.lon}, '${escapeHtml(name)}')"
                onkeydown="if(event.key==='Enter')mapSelectSearchResult(${item.lat},${item.lon},'${escapeHtml(name)}')"
            >${name}</div>`;
        }).join('');

    } catch (e) {
        resultsEl.innerHTML = `<div class="map-search-result-item" style="color:var(--danger)">검색 오류: ${e.message}</div>`;
    }
}

function mapSelectSearchResult(lat, lon, name) {
    if (!_mapInstance) return;
    _mapInstance.setView([lat, lon], 16, { animate: true });

    const pinIcon = L.divIcon({
        html: `<div style="font-size:1.6rem;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">📌</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: ''
    });

    L.marker([lat, lon], { icon: pinIcon })
        .addTo(_mapInstance)
        .bindPopup(`<strong>${name.split(',')[0]}</strong>`)
        .openPopup();

    const searchInput = document.getElementById('mapSearchInput');
    if (searchInput) {
        searchInput.value = name.split(',')[0];
    }
    mapCloseSearchResults();
}

function mapCloseSearchResults() {
    const resultsEl = document.getElementById('mapSearchResults');
    const searchInput = document.getElementById('mapSearchInput');
    if (resultsEl) { resultsEl.classList.remove('active'); resultsEl.innerHTML = ''; }
    if (searchInput) searchInput.setAttribute('aria-expanded', 'false');
}

function mapHandleOutsideClick(e) {
    const wrap = document.querySelector('.map-search-wrap');
    if (wrap && !wrap.contains(e.target)) mapCloseSearchResults();
    if (!document.getElementById('mapSearchInput')) {
        document.removeEventListener('click', mapHandleOutsideClick, true);
    }
}

// ── 길찾기 패널 토글 ────────────────────────────────────────────────────
function mapToggleDirectionsPanel() {
    const panel  = document.getElementById('mapDirectionsPanel');
    const header = document.getElementById('mapDirectionsHeader');
    if (!panel) return;
    const isOpen = panel.classList.toggle('open');
    if (header) header.setAttribute('aria-expanded', isOpen);
}

// ── OSRM 길찾기 ─────────────────────────────────────────────────────────
async function mapGetDirections() {
    // 이전 경로를 먼저 제거
    mapClearRoute();

    const startInput = document.getElementById('mapDirStart');
    const endInput   = document.getElementById('mapDirEnd');

    if (!startInput?.value || !endInput?.value) {
        alert('출발지와 도착지를 모두 입력해주세요.');
        return;
    }

    const routeInfoEl = document.getElementById('mapRouteInfo');
    if (routeInfoEl) { routeInfoEl.classList.remove('active'); }

    let startLat, startLon;

    if (startInput.dataset.lat && startInput.dataset.lon) {
        startLat = parseFloat(startInput.dataset.lat);
        startLon = parseFloat(startInput.dataset.lon);
    } else {
        const startCoords = await mapGeocode(startInput.value);
        if (!startCoords) { alert(`출발지 "${startInput.value}"를 찾을 수 없습니다.`); return; }
        startLat = startCoords.lat;
        startLon = startCoords.lon;
    }

    let endLat, endLon;
    const endVal = endInput.value.trim();
    if (endVal === '은가람중학교' || !endVal) {
        endLat = SCHOOL_LAT; endLon = SCHOOL_LON;
    } else {
        const endCoords = await mapGeocode(endVal);
        if (!endCoords) { alert(`도착지 "${endVal}"를 찾을 수 없습니다.`); return; }
        endLat = endCoords.lat; endLon = endCoords.lon;
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;

    try {
        const res = await fetch(osrmUrl);
        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
        const data = await res.json();

        if (!data.routes?.length) throw new Error('경로를 찾을 수 없습니다.');

        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

        _routeLayer = L.polyline(coords, {
            color: '#4f46e5',
            weight: 5,
            opacity: 0.85,
            lineJoin: 'round'
        }).addTo(_mapInstance);

        _mapInstance.fitBounds(_routeLayer.getBounds(), { padding: [40, 40] });

        const startIcon = L.divIcon({
            html: `<div style="width:14px;height:14px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(16,185,129,0.5)"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7], className: ''
        });
        const endIcon = L.divIcon({
            html: `<div style="width:14px;height:14px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(239,68,68,0.5)"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7], className: ''
        });

        _startMarker = L.marker([startLat, startLon], { icon: startIcon })
            .addTo(_mapInstance).bindPopup('출발지');
        _endMarker = L.marker([endLat, endLon], { icon: endIcon })
            .addTo(_mapInstance).bindPopup('도착지');

        const distKm   = (route.distance / 1000).toFixed(1);
        const durationMin = Math.ceil(route.duration / 60);

        if (routeInfoEl) {
            document.getElementById('mapRouteDist').textContent     = `🛣️ ${distKm} km`;
            document.getElementById('mapRouteDuration').textContent = `🚗 약 ${durationMin}분`;
            routeInfoEl.classList.add('active');
        }

    } catch (e) {
        alert(`길찾기 오류: ${e.message}`);
    }
}

async function mapGeocode(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=kr&accept-language=ko`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'ko' } });
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function mapClearRoute() {
    if (_mapInstance) {
        if (_routeLayer)  { _mapInstance.removeLayer(_routeLayer);  _routeLayer  = null; }
        if (_startMarker) { _mapInstance.removeLayer(_startMarker); _startMarker = null; }
        if (_endMarker)   { _mapInstance.removeLayer(_endMarker);   _endMarker   = null; }
    }
    const routeInfoEl = document.getElementById('mapRouteInfo');
    if (routeInfoEl) routeInfoEl.classList.remove('active');
}
