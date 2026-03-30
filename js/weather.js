// =============================================
// 날씨 페이지 — 하남시 (네이버 날씨)
// =============================================

const WEATHER_CITY = '하남시';
const NAVER_REGION_CODE = '4100000000'; // 경기도 하남시

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

function getTodayItems(skyStatus, ptyStatus) {
    const items = [];

    // 강수: 1(비), 2(비/눈), 3(눈), 4(소나기)
    if (['1', '2', '3', '4'].includes(ptyStatus)) {
        items.push('☂️ 우산');
    }

    if (['2', '3'].includes(ptyStatus)) {
        items.push('🧣 방한용품');
    }

    if (items.length === 0) {
        items.push('특별히 준비할 것 없음');
    }

    return items;
}

function getTempColor(temp) {
    if (temp < 0)  return '#60a5fa';
    if (temp < 10) return '#93c5fd';
    if (temp < 20) return '#6ee7b7';
    if (temp < 28) return '#fcd34d';
    return '#f97316';
}

function getSkyIcon(sky) {
    // 하늘 상태: 1(맑음), 3(구름많음), 4(흐림)
    const icons = {
        '1': '☀️',
        '3': '⛅',
        '4': '☁️'
    };
    return icons[sky] || '🌤️';
}

function getPtyText(pty) {
    // 강수 상태: 0(없음), 1(비), 2(비/눈), 3(눈), 4(소나기)
    const texts = {
        '0': '맑음',
        '1': '비',
        '2': '비/눈',
        '3': '눈',
        '4': '소나기'
    };
    return texts[pty] || '정보 없음';
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
        // 네이버 날씨 API (allorigins 프록시)
        const fetchWeatherFromNaver = async () => {
            try {
                const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://weather.naver.com/api/json/summary?regionCode=${NAVER_REGION_CODE}`)}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                // 네이버 API 응답 구조
                const current = data.weather?.current || {};
                const today = data.weather?.today?.weather || {};
                const forecast = data.weather?.forecast || [];

                return {
                    current: {
                        temp_c: current.temp || 0,
                        description: current.weatherType || '정보 없음',
                        humidity: current.humidity || 0,
                        wind_speed: current.windSpeed || 0,
                        sky: current.sky || '4',
                        pty: current.pty || '0'
                    },
                    today: {
                        maxtemp_c: today.maxTemp || 0,
                        mintemp_c: today.minTemp || 0,
                        text: today.text || '정보 없음'
                    },
                    forecasts: forecast.slice(0, 7).map(day => ({
                        date: day.date || '',
                        maxtemp_c: day.maxTemp || 0,
                        mintemp_c: day.minTemp || 0,
                        text: day.text || '정보 없음'
                    }))
                };
            } catch (e) {
                console.error(`[날씨 조회 실패]`, e);
                return null;
            }
        };

        let mainWeather = await fetchWeatherFromNaver();

        // API 실패 시 폴백
        if (!mainWeather) {
            mainWeather = {
                current: {
                    temp_c: 15,
                    description: '정보 없음',
                    humidity: 50,
                    wind_speed: 5,
                    sky: '4',
                    pty: '0'
                },
                today: {
                    maxtemp_c: 20,
                    mintemp_c: 10,
                    text: '정보 없음'
                },
                forecasts: []
            };
        }
        console.log('[날씨] 하남시 데이터:', mainWeather);

        // 현재 날씨
        const c = mainWeather.current;
        const temp = c.temp_c;
        const humid = c.humidity;
        const wind = c.wind_speed;
        const desc = getPtyText(c.pty);
        const icon = getSkyIcon(c.sky);
        const tempCol = getTempColor(temp);

        // 옷차림 추천
        const clothesList = getOutfitAdvice(temp);
        const todayItemsList = getTodayItems(c.sky, c.pty);

        // 7일 예보
        const forecastCards = (mainWeather.forecasts || []).slice(0, 7).map((day, i) => {
            const isToday = i === 0;
            return `
            <div class="weather-day-card${isToday ? ' today' : ''}">
                <div class="wdc-date">${isToday ? '오늘' : fmtDay(day.date)}</div>
                <div class="wdc-icon">🌤️</div>
                <div class="wdc-desc">${day.text || '정보 없음'}</div>
                <div class="wdc-temp">
                    <span class="wdc-max" style="color:#f97316">${day.maxtemp_c}°</span>
                    <span class="wdc-min" style="color:#60a5fa">${day.mintemp_c}°</span>
                </div>
            </div>`;
        }).join('');

        const clothesHtml = clothesList.map(c => `<span class="advice-chip advice-clothes">${c}</span>`).join('');
        const itemsHtml = todayItemsList.map(i => `<span class="advice-chip advice-item">${i}</span>`).join('');

        const now = new Date();
        const updatedAt = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')} 기준`;

        app.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h2>🌤️ 날씨 — ${WEATHER_CITY}</h2>
                <p style="font-size:0.82rem;color:var(--text-muted)">${updatedAt}</p>
            </div>

            <p style="text-align:center;font-size:0.75rem;color:#6366f1;margin-bottom:16px;font-weight:600;padding:8px;background:rgba(99,102,241,0.1);border-radius:8px">
                ℹ️ 네이버 날씨 데이터입니다.
            </p>

            <div class="weather-current-card" data-weather-current>
                <div class="wcc-left">
                    <div class="wcc-icon">${icon}</div>
                    <div class="wcc-temp" style="color:${tempCol}">${temp}°C</div>
                    <div class="wcc-label">${desc}</div>
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

            ${forecastCards ? `
            <div class="section-card" style="margin-top:20px">
                <h3 style="font-size:1rem;font-weight:800;margin-bottom:16px">📅 7일 예보</h3>
                <div class="weather-forecast-row">${forecastCards}</div>
            </div>
            ` : ''}

            <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:20px">
                자동 갱신됩니다.
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

    // 30분마다 날씨 데이터 갱신
    if (window._weatherUpdateInterval) clearInterval(window._weatherUpdateInterval);
    window._weatherUpdateInterval = setInterval(() => {
        console.log('[날씨] 30분마다 자동 갱신 중...');
        updateWeatherDisplay();
    }, 30 * 60 * 1000); // 30분
}

// 날씨 디스플레이 업데이트 (현재 온도)
async function updateWeatherDisplay() {
    try {
        const fetchWeatherFromNaver = async () => {
            try {
                const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://weather.naver.com/api/json/summary?regionCode=${NAVER_REGION_CODE}`)}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                const current = data.weather?.current || {};
                return {
                    temp_c: current.temp || 0,
                    description: current.weatherType || '정보 없음',
                    humidity: current.humidity || 0,
                    wind_speed: current.windSpeed || 0,
                    sky: current.sky || '4',
                    pty: current.pty || '0'
                };
            } catch (e) {
                console.error(`[날씨 조회 실패]`, e);
                return null;
            }
        };

        let currentWeather = await fetchWeatherFromNaver();
        if (!currentWeather) {
            currentWeather = {
                temp_c: 15,
                description: '정보 없음',
                humidity: 50,
                wind_speed: 5,
                sky: '4',
                pty: '0'
            };
        }

        // 현재 온도 카드 업데이트
        const temp = currentWeather.temp_c;
        const humid = currentWeather.humidity;
        const wind = currentWeather.wind_speed;
        const desc = getPtyText(currentWeather.pty);
        const icon = getSkyIcon(currentWeather.sky);
        const tempCol = getTempColor(temp);

        const weatherCurrentCard = document.querySelector('[data-weather-current]');
        if (weatherCurrentCard) {
            weatherCurrentCard.innerHTML = `
                <div class="wcc-left">
                    <div class="wcc-icon">${icon}</div>
                    <div class="wcc-temp" style="color:${tempCol}">${temp}°C</div>
                    <div class="wcc-label">${desc}</div>
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
