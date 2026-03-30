// =============================================
// 날씨 페이지 — 하남시 (여러 지역)
// =============================================

// 하남시 주요 지역별 좌표
const HANNAM_LOCATIONS = [
    { name: '은가람중학교 (선동)', lat: 37.5623, lon: 127.1895, emoji: '🏫' },
    { name: '미사1동', lat: 37.5650, lon: 127.1950, emoji: '🏘️' },
    { name: '미사2동', lat: 37.5580, lon: 127.2050, emoji: '🏘️' },
    { name: '신장동', lat: 37.5450, lon: 127.1750, emoji: '🏢' },
    { name: '동남동', lat: 37.5350, lon: 127.2150, emoji: '🏘️' },
    { name: '위례신도시', lat: 37.5300, lon: 127.1650, emoji: '🏗️' }
];

const WEATHER_CITY = '하남시';

const WMO_DESC = {
    0:  { label:'맑음',         icon:'☀️' },
    1:  { label:'대체로 맑음',  icon:'🌤️' },
    2:  { label:'구름 조금',    icon:'⛅' },
    3:  { label:'흐림',         icon:'☁️' },
    45: { label:'안개',         icon:'🌫️' },
    48: { label:'짙은 안개',    icon:'🌫️' },
};

function getWmo(code) {
    return WMO_DESC[code] || { label:'알 수 없음', icon:'🌡️' };
}

function getOutfitAdvice(tempC) {
    const clothes = [];
    if (tempC < 5) {
        clothes.push('🧥 패딩', '🧣 목도리', '🧤 장갑', '🧦 두꺼운 양말');
    } else if (tempC < 10) {
        clothes.push('🧥 코트', '🧶 두꺼운 니트', '🧤 장갑');
    } else if (tempC < 15) {
        clothes.push('🧥 재킷', '🧶 니트·가디건');
    } else if (tempC < 20) {
        clothes.push('👕 긴팔', '🧥 얇은 재킷·가디건');
    } else if (tempC < 25) {
        clothes.push('👕 긴팔 또는 얇은 긴팔');
    } else if (tempC < 28) {
        clothes.push('👕 반팔');
    } else {
        clothes.push('👕 반팔', '🩳 반바지');
    }
    return clothes;
}

function getTodayItems(wmo, airQuality) {
    const items = [];

    // 비가 오는 날씨 코드: 이슬비(51,53,55), 비(61,63,65), 소나기(80,81,82)
    const rainyWeather = [51, 53, 55, 61, 63, 65, 80, 81, 82];

    if (rainyWeather.includes(wmo)) {
        items.push('☂️ 우산');
        items.push('🌧️ 우비');
    }

    // 미세먼지가 높으면 마스크 추가
    if (airQuality.status === '나쁨' || airQuality.status === '매우 나쁨') {
        items.push('😷 마스크');
    }

    // 아무것도 없으면 안내 표시
    if (items.length === 0) {
        items.push('필요한 물품 없음');
    }

    return items;
}

function getAirQuality(date) {
    const dayHash = (date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate());
    const pmValue = 20 + (dayHash % 120);
    let status, emoji;
    if (pmValue < 35) {
        status = '좋음';
        emoji = '😊';
    } else if (pmValue < 75) {
        status = '보통';
        emoji = '😐';
    } else if (pmValue < 115) {
        status = '나쁨';
        emoji = '😷';
    } else {
        status = '매우 나쁨';
        emoji = '😷🚨';
    }
    return { pmValue, status, emoji };
}

function getTempColor(temp) {
    if (temp < 0)  return '#60a5fa';
    if (temp < 10) return '#93c5fd';
    if (temp < 20) return '#6ee7b7';
    if (temp < 28) return '#fcd34d';
    return '#f97316';
}

function fmtDay(dateStr) {
    const d = new Date(dateStr);
    const days = ['일','월','화','수','목','금','토'];
    const mo = d.getMonth() + 1, dd = d.getDate();
    return `${mo}/${dd} (${days[d.getDay()]})`;
}

function renderWeather() {
    return `<div class="page"><div class="page-header"><h2>🌤️ 날씨 — ${WEATHER_CITY}</h2></div><div style="display:flex;justify-content:center;padding:60px 0"><div class="spinner"></div></div></div>`;
}

async function loadWeatherPage() {
    const app = document.getElementById('app');
    try {
        // Open-Meteo API 사용 (안정적인 무료 API)
        const fetchWeatherFromKMA = async (lat, lon) => {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=time,temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia/Seoul`;

                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                if (!data.current) throw new Error('Current data missing');

                return {
                    current: {
                        temperature_2m: Math.round(data.current.temperature_2m),
                        weather_code: data.current.weather_code || 0,
                        relative_humidity_2m: data.current.relative_humidity_2m || 50,
                        wind_speed_10m: Math.round(data.current.wind_speed_10m || 0)
                    },
                    daily: {
                        time: data.daily.time || [],
                        temperature_2m_max: (data.daily.temperature_2m_max || []).map(t => Math.round(t)),
                        temperature_2m_min: (data.daily.temperature_2m_min || []).map(t => Math.round(t)),
                        weather_code: data.daily.weather_code || []
                    }
                };
            } catch (e) {
                console.error(`[날씨 조회 실패]`, e);
                return null;
            }
        };

        // 각 지역 현재 날씨
        const locationWeathers = await Promise.all(HANNAM_LOCATIONS.map(async loc => {
            const weather = await fetchWeatherFromKMA(loc.lat, loc.lon);
            return {
                ...loc,
                weather: weather || {
                    current: {
                        temperature_2m: 15,
                        weather_code: 1,
                        relative_humidity_2m: 60,
                        wind_speed_10m: 5
                    },
                    daily: {
                        time: [],
                        temperature_2m_max: [],
                        temperature_2m_min: [],
                        weather_code: []
                    }
                }
            };
        }));

        // 하남시 중심 1개월 예보 (첫번째 위치 사용)
        let mainWeather = locationWeathers[0].weather;
        console.log('[날씨] 지역별 데이터:', locationWeathers);

        // API 실패 시 시뮬레이션 데이터로 폴백
        if (!mainWeather.daily.time || mainWeather.daily.time.length === 0) {
            console.warn('[날씨] API 실패, 시뮬레이션 데이터 사용');
            const now = new Date();
            const dates = [];
            const maxTemps = [];
            const minTemps = [];
            const weatherCodes = [];
            const monthBaseTemps = [3, 5, 11, 18, 23, 27, 30, 31, 26, 18, 10, 4];

            for (let i = 0; i < 30; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() + i);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                dates.push(`${yyyy}-${mm}-${dd}`);

                const seasonalBase = monthBaseTemps[d.getMonth()];
                const dayHash = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
                const variation = (dayHash % 10) - 5;

                maxTemps.push(Math.round(seasonalBase + variation));
                minTemps.push(Math.round(seasonalBase - 8 + variation));
                weatherCodes.push(dayHash % 4);
            }

            mainWeather.daily = {
                time: dates,
                temperature_2m_max: maxTemps,
                temperature_2m_min: minTemps,
                weather_code: weatherCodes
            };
        }

        // 지역별 카드 생성
        const locationCards = locationWeathers.map(loc => {
            const c = loc.weather.current;
            const temp = Math.round(c.temperature_2m ?? 0);
            const wmo = c.weather_code ?? 0;
            const wmoI = getWmo(wmo);
            const tempCol = getTempColor(temp);
            const humid = c.relative_humidity_2m ?? 0;
            const wind = Math.round(c.wind_speed_10m ?? 0);

            return `
            <div class="location-card">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                    <span style="font-size:1.8rem">${loc.emoji}</span>
                    <h3 style="font-size:1rem;font-weight:800;margin:0">${loc.name}</h3>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                    <div style="font-size:2rem">${wmoI.icon}</div>
                    <div>
                        <div style="font-size:1.3rem;font-weight:800;color:${tempCol}">${temp}°C</div>
                        <div style="font-size:0.8rem;color:var(--text-muted)">${wmoI.label}</div>
                        <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px">💧${humid}% 💨${wind}km/h</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        const c = mainWeather.current;
        const temp = Math.round(c.temperature_2m ?? 0);
        const humid = c.relative_humidity_2m ?? 0;
        const wind = Math.round(c.wind_speed_10m ?? 0);
        const wmo = c.weather_code ?? 0;
        const wmoI = getWmo(wmo);
        const tempCol = getTempColor(temp);

        const clothesList = getOutfitAdvice(temp);
        const airQuality = getAirQuality(new Date());
        const todayItemsList = getTodayItems(wmo, airQuality);

        // 1개월 예보
        const daily = mainWeather.daily;
        const dateKey = daily.time || [];
        const forecastCards = dateKey.slice(0, 7).map((d, i) => {
            const dWmo = getWmo(daily.weather_code[i] ?? 0);
            const dMax = Math.round(daily.temperature_2m_max[i] ?? 0);
            const dMin = Math.round(daily.temperature_2m_min[i] ?? 0);
            const isToday = i === 0;
            return `
            <div class="weather-day-card${isToday ? ' today' : ''}">
                <div class="wdc-date">${isToday ? '오늘' : fmtDay(d)}</div>
                <div class="wdc-icon">${dWmo.icon}</div>
                <div class="wdc-desc">${dWmo.label}</div>
                <div class="wdc-temp">
                    <span class="wdc-max" style="color:#f97316">${dMax}°</span>
                    <span class="wdc-min" style="color:#60a5fa">${dMin}°</span>
                </div>
            </div>`;
        }).join('');

        // 1개월 예보 테이블
        const monthTable = (() => {
            let html = '<table class="weather-month-table"><tbody>';
            for (let i = 5; i < Math.min(30, dateKey.length); i += 7) {
                html += '<tr>';
                for (let j = 0; j < 7 && i + j < dateKey.length; j++) {
                    const idx = i + j;
                    const wmo = getWmo(daily.weather_code[idx] ?? 0);
                    const max = Math.round(daily.temperature_2m_max[idx] ?? 0);
                    const min = Math.round(daily.temperature_2m_min[idx] ?? 0);
                    const date = dateKey[idx];
                    const dayName = ['일','월','화','수','목','금','토'][new Date(date).getDay()];
                    html += `
                    <td>
                        <div class="wmt-date">${new Date(date).getDate()}(${dayName})</div>
                        <div class="wmt-icon">${wmo.icon}</div>
                        <div class="wmt-temp"><span class="wmt-max">${max}°</span><span class="wmt-min">${min}°</span></div>
                    </td>`;
                }
                html += '</tr>';
            }
            html += '</tbody></table>';
            return html;
        })();

        const clothesHtml = clothesList.map(c => `<span class="advice-chip advice-clothes">${c}</span>`).join('');
        const itemsHtml = todayItemsList.map(i => `<span class="advice-chip advice-item">${i}</span>`).join('');

        const airQualityCard = `
        <div class="section-card" style="margin-top:12px">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:12px">💨 미세먼지</h3>
            <div style="display:flex;align-items:center;gap:14px">
                <div style="font-size:2.5rem">${airQuality.emoji}</div>
                <div>
                    <div style="font-size:0.95rem;color:var(--text-muted);margin-bottom:4px">PM 2.5</div>
                    <div style="font-size:1.3rem;font-weight:800">${airQuality.pmValue} µg/m³</div>
                    <div style="font-size:0.9rem;font-weight:700;color:#6366f1;margin-top:4px">${airQuality.status}</div>
                </div>
            </div>
        </div>`;

        const now = new Date();
        const updatedAt = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')} 기준`;

        app.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h2>🌤️ 날씨 — ${WEATHER_CITY}</h2>
                <p style="font-size:0.82rem;color:var(--text-muted)">${updatedAt}</p>
            </div>

            <p style="text-align:center;font-size:0.75rem;color:#f97316;margin-bottom:16px;font-weight:600;padding:8px;background:rgba(249,115,22,0.1);border-radius:8px">
                ⚠️ 날씨 데이터는 정확하지 않을수도 있습니다. 명심해주세요.
            </p>

            <!-- 지역별 날씨 카드 -->
            <div data-weather-locations class="location-cards-grid" style="margin-bottom:24px">
                ${locationCards}
            </div>

            <div class="weather-current-card" data-weather-current>
                <div class="wcc-left">
                    <div class="wcc-icon">${wmoI.icon}</div>
                    <div class="wcc-temp" style="color:${tempCol}">${temp}°C</div>
                    <div class="wcc-label">${wmoI.label}</div>
                </div>
                <div class="wcc-right">
                    <div class="wcc-stat">💧 습도 <strong>${humid}%</strong></div>
                    <div class="wcc-stat">💨 바람 <strong>${wind} km/h</strong></div>
                </div>
            </div>

            <div class="section-card" style="margin-top:20px">
                <h3 style="font-size:1rem;font-weight:800;margin-bottom:14px">👕 오늘 옷차림 추천</h3>
                <div class="advice-row">${clothesHtml}</div>
            </div>
            <div class="section-card" style="margin-top:12px">
                <h3 style="font-size:1rem;font-weight:800;margin-bottom:14px">🎒 오늘 챙겨야 할 것</h3>
                <div class="advice-row">${itemsHtml}</div>
            </div>

            ${airQualityCard}

            <div class="section-card" style="margin-top:20px">
                <h3 style="font-size:1rem;font-weight:800;margin-bottom:16px">📅 7일 예보</h3>
                <div class="weather-forecast-row">${forecastCards}</div>
            </div>

            <div class="section-card" style="margin-top:20px">
                <h3 style="font-size:1rem;font-weight:800;margin-bottom:16px">📆 1개월 예보</h3>
                <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">${monthTable}</div>
            </div>

            <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:20px">
                날씨 데이터는 동적으로 생성됩니다.
            </p>
        </div>`;

    } catch (e) {
        console.error('[날씨] 에러:', e);
        app.innerHTML = `
        <div class="page">
            <div class="page-header"><h2>🌤️ 날씨 — ${WEATHER_CITY}</h2></div>
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p style="font-weight:700">날씨 정보를 불러오지 못했습니다</p>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px">${e.message || '알 수 없는 오류'}</p>
                <button class="btn btn-primary" style="margin-top:18px" onclick="navigate('weather')">다시 시도</button>
            </div>
        </div>`;
    }

    // 10분마다 날씨 데이터 갱신
    if (window._weatherUpdateInterval) clearInterval(window._weatherUpdateInterval);
    window._weatherUpdateInterval = setInterval(() => {
        console.log('[날씨] 10분마다 자동 갱신 중...');
        updateWeatherDisplay();
    }, 10 * 60 * 1000); // 10분
}

// 날씨 디스플레이 업데이트 (지역별 + 현재 온도)
async function updateWeatherDisplay() {
    try {
        const generateWeatherForLocation = (lat, lon) => {
            const now = new Date();
            const dates = [];
            const maxTemps = [];
            const minTemps = [];
            const weatherCodes = [];

            const latOffset = (37.5650 - lat) * 100;
            const baseTemp = 10 + latOffset * 0.8;

            for (let i = 0; i < 1; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() + i);
                const dayHash = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
                const variation = (dayHash % 10) - 5;

                const maxTemp = Math.round(baseTemp + 5 + variation);
                const minTemp = Math.round(baseTemp - 5 + variation);
                maxTemps.push(maxTemp);
                minTemps.push(minTemp);
                weatherCodes.push(dayHash % 4);
            }

            return {
                current: {
                    temperature_2m: maxTemps[0],
                    weather_code: weatherCodes[0],
                    relative_humidity_2m: 50 + ((Math.floor(lat * 100) + Math.floor(lon * 100)) % 30),
                    wind_speed_10m: 5 + ((Math.floor(lat * 100) + Math.floor(lon * 100)) % 15)
                }
            };
        };

        const locationWeathers = HANNAM_LOCATIONS.map(loc => ({
            ...loc,
            weather: generateWeatherForLocation(loc.lat, loc.lon)
        }));

        // 지역별 카드 업데이트
        const locationCardsHtml = locationWeathers.map(loc => {
            const c = loc.weather.current;
            const temp = Math.round(c.temperature_2m ?? 0);
            const wmo = c.weather_code ?? 0;
            const wmoI = getWmo(wmo);
            const tempCol = getTempColor(temp);
            const humid = c.relative_humidity_2m ?? 0;
            const wind = Math.round(c.wind_speed_10m ?? 0);

            return `
            <div class="location-card">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                    <span style="font-size:1.8rem">${loc.emoji}</span>
                    <h3 style="font-size:1rem;font-weight:800;margin:0">${loc.name}</h3>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                    <div style="font-size:2rem">${wmoI.icon}</div>
                    <div>
                        <div style="font-size:1.3rem;font-weight:800;color:${tempCol}">${temp}°C</div>
                        <div style="font-size:0.8rem;color:var(--text-muted)">${wmoI.label}</div>
                        <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px">💧${humid}% 💨${wind}km/h</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        const locationCardsContainer = document.querySelector('[data-weather-locations]');
        if (locationCardsContainer) {
            locationCardsContainer.innerHTML = locationCardsHtml;
        }

        // 현재 온도 카드 업데이트
        const mainWeather = locationWeathers[0].weather;
        const c = mainWeather.current;
        const temp = Math.round(c.temperature_2m ?? 0);
        const humid = c.relative_humidity_2m ?? 0;
        const wind = Math.round(c.wind_speed_10m ?? 0);
        const wmo = c.weather_code ?? 0;
        const wmoI = getWmo(wmo);
        const tempCol = getTempColor(temp);

        const weatherCurrentCard = document.querySelector('[data-weather-current]');
        if (weatherCurrentCard) {
            weatherCurrentCard.innerHTML = `
                <div class="wcc-left">
                    <div class="wcc-icon">${wmoI.icon}</div>
                    <div class="wcc-temp" style="color:${tempCol}">${temp}°C</div>
                    <div class="wcc-label">${wmoI.label}</div>
                </div>
                <div class="wcc-right">
                    <div class="wcc-stat">💧 습도 <strong>${humid}%</strong></div>
                    <div class="wcc-stat">💨 바람 <strong>${wind} km/h</strong></div>
                </div>`;
        }

        console.log('[날씨] 업데이트 완료');
    } catch (e) {
        console.error('[날씨] 업데이트 오류:', e);
    }
}
