// =============================================
// 날씨 페이지 — 하남시 (wttr.in API - 기상청 기반)
// =============================================

const WEATHER_CITY = '하남시';

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

function getTodayItems(desc) {
    const items = [];
    const descLower = (desc || '').toLowerCase();

    if (descLower.includes('rain') || descLower.includes('drizzle') || descLower.includes('비')) {
        items.push('☂️ 우산');
        items.push('🌧️ 우비');
    }

    if (descLower.includes('snow') || descLower.includes('눈')) {
        items.push('⛄ 방한용품');
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

function getWeatherIcon(desc) {
    const d = (desc || '').toLowerCase();
    if (d.includes('sunny') || d.includes('clear')) return '☀️';
    if (d.includes('rain')) return '🌧️';
    if (d.includes('cloud')) return '☁️';
    if (d.includes('snow')) return '❄️';
    if (d.includes('storm') || d.includes('thunder')) return '⛈️';
    if (d.includes('fog') || d.includes('mist')) return '🌫️';
    if (d.includes('partly')) return '⛅';
    return '🌤️';
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
        // wttr.in API 사용 (기상청 기반, CORS 지원)
        const fetchWeatherFromAPI = async () => {
            try {
                const url = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://wttr.in/Hanam?format=j1')}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                const current = data.current_condition[0];
                const today = data.weather[0];
                const forecasts = data.weather.slice(0, 7);

                return {
                    current: {
                        temp_c: Math.round(current.temp_C),
                        description: current.weatherDesc[0]?.value || '정보 없음',
                        humidity: current.humidity || 0,
                        wind_speed: Math.round(current.windspeedKmph || 0)
                    },
                    forecasts: forecasts.map(day => ({
                        date: day.date,
                        maxtemp_c: Math.round(day.maxtempC),
                        mintemp_c: Math.round(day.mintempC),
                        description: day.hourly?.[0]?.weatherDesc?.[0]?.value || '정보 없음'
                    }))
                };
            } catch (e) {
                console.error(`[날씨 조회 실패]`, e);
                return null;
            }
        };

        let mainWeather = await fetchWeatherFromAPI();

        // API 실패 시 폴백
        if (!mainWeather) {
            mainWeather = {
                current: {
                    temp_c: 15,
                    description: '정보 없음',
                    humidity: 50,
                    wind_speed: 5
                },
                forecasts: [
                    { date: new Date().toISOString().split('T')[0], maxtemp_c: 20, mintemp_c: 10, description: '정보 없음' },
                    { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], maxtemp_c: 18, mintemp_c: 12, description: '정보 없음' }
                ]
            };
        }
        console.log('[날씨] 하남시 데이터:', mainWeather);

        // 현재 날씨
        const c = mainWeather.current;
        const temp = c.temp_c;
        const humid = c.humidity;
        const wind = c.wind_speed;
        const desc = c.description;
        const icon = getWeatherIcon(desc);
        const tempCol = getTempColor(temp);

        // 옷차림 추천
        const clothesList = getOutfitAdvice(temp);
        const todayItemsList = getTodayItems(desc);

        // 7일 예보
        const forecastCards = mainWeather.forecasts.slice(0, 7).map((day, i) => {
            const isToday = i === 0;
            const icon = getWeatherIcon(day.description);
            return `
            <div class="weather-day-card${isToday ? ' today' : ''}">
                <div class="wdc-date">${isToday ? '오늘' : fmtDay(day.date)}</div>
                <div class="wdc-icon">${icon}</div>
                <div class="wdc-desc">${day.description}</div>
                <div class="wdc-temp">
                    <span class="wdc-max" style="color:#f97316">${day.maxtemp_c}°</span>
                    <span class="wdc-min" style="color:#60a5fa">${day.mintemp_c}°</span>
                </div>
            </div>`;
        }).join('');

        // 1주일 이후 테이블
        const monthTable = (() => {
            let html = '<table class="weather-month-table"><tbody>';
            const forecasts = mainWeather.forecasts;

            for (let i = 7; i < forecasts.length; i += 7) {
                html += '<tr>';
                for (let j = 0; j < 7 && i + j < forecasts.length; j++) {
                    const idx = i + j;
                    const day = forecasts[idx];
                    const icon = getWeatherIcon(day.description);
                    const date = new Date(day.date);
                    const dayName = ['일','월','화','수','목','금','토'][date.getDay()];
                    html += `
                    <td>
                        <div class="wmt-date">${date.getDate()}(${dayName})</div>
                        <div class="wmt-icon">${icon}</div>
                        <div class="wmt-temp"><span class="wmt-max">${day.maxtemp_c}°</span><span class="wmt-min">${day.mintemp_c}°</span></div>
                    </td>`;
                }
                html += '</tr>';
            }
            html += '</tbody></table>';
            return html;
        })();

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
                ℹ️ 기상청 기반 날씨 정보입니다.
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

            <div class="section-card" style="margin-top:20px">
                <h3 style="font-size:1rem;font-weight:800;margin-bottom:16px">📅 7일 예보</h3>
                <div class="weather-forecast-row">${forecastCards}</div>
            </div>

            ${mainWeather.forecasts.length > 7 ? `
            <div class="section-card" style="margin-top:20px">
                <h3 style="font-size:1rem;font-weight:800;margin-bottom:16px">📆 향후 날씨</h3>
                <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">${monthTable}</div>
            </div>
            ` : ''}

            <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:20px">
                매 시간 자동 갱신됩니다.
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

    // 1시간마다 날씨 데이터 갱신
    if (window._weatherUpdateInterval) clearInterval(window._weatherUpdateInterval);
    window._weatherUpdateInterval = setInterval(() => {
        console.log('[날씨] 1시간마다 자동 갱신 중...');
        updateWeatherDisplay();
    }, 60 * 60 * 1000); // 1시간
}

// 날씨 디스플레이 업데이트 (현재 온도)
async function updateWeatherDisplay() {
    try {
        const fetchWeatherFromAPI = async () => {
            try {
                const url = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://wttr.in/Hanam?format=j1')}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                const current = data.current_condition[0];
                return {
                    temp_c: Math.round(current.temp_C),
                    description: current.weatherDesc[0]?.value || '정보 없음',
                    humidity: current.humidity || 0,
                    wind_speed: Math.round(current.windspeedKmph || 0)
                };
            } catch (e) {
                console.error(`[날씨 조회 실패]`, e);
                return null;
            }
        };

        let currentWeather = await fetchWeatherFromAPI();
        if (!currentWeather) {
            currentWeather = {
                temp_c: 15,
                description: '정보 없음',
                humidity: 50,
                wind_speed: 5
            };
        }

        // 현재 온도 카드 업데이트
        const temp = currentWeather.temp_c;
        const humid = currentWeather.humidity;
        const wind = currentWeather.wind_speed;
        const desc = currentWeather.description;
        const icon = getWeatherIcon(desc);
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
