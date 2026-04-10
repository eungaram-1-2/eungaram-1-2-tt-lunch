#!/usr/bin/env node
// =============================================
// 급식 자동 크롤링 스크립트
// GitHub Actions에서 매일 실행
// =============================================
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const LUNCH_SCHOOL_URL = 'https://eungaram-m.goegh.kr/eungaram-m/ad/fm/foodmenu/selectFoodMenuView.do?mi=8056';
const OUTPUT_FILE = path.join(__dirname, '../data/lunch.json');

// 날짜 포맷 함수
function formatDate(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

// td에서 메뉴 아이템 추출 (기존 로직)
function extractMenuFromTd(td) {
    const clone = td.cloneNode(true);
    Array.from(clone.querySelectorAll('a')).forEach(a => a.remove());
    Array.from(clone.querySelectorAll('br')).forEach(br => br.replaceWith('\n'));

    return clone.textContent
        .split('\n')
        .map(line => {
            line = line.trim();
            if (line.includes('상세보기')) return null;
            line = line.replace(/\([가-힣]{1,3}\)/g, '');
            line = line.replace(/[\d.]+\s*Kcal/gi, '');
            line = line.replace(/\d{4}-\d{2}-\d{2}/g, '');
            line = line.replace(/[월화수목금토일]\s*/g, '');
            line = line.replace(/\[.*?\]/g, '');
            line = line.trim();
            return line.length > 0 ? line : null;
        })
        .filter(Boolean);
}

// 날짜 문자열로 메뉴 td 찾기
function findMenuTdByDate(doc, dateStr) {
    let dateTd = null;
    for (const td of doc.querySelectorAll('td, th')) {
        if (td.textContent.includes(dateStr)) {
            dateTd = td;
            break;
        }
    }
    if (!dateTd) return null;

    const tr = dateTd.closest('tr');
    const rowTds = tr ? Array.from(tr.querySelectorAll('td, th')) : [];

    let menuTd = null;
    let maxBr = 0;
    for (const td of rowTds) {
        const brs = td.querySelectorAll('br').length;
        if (brs > maxBr) { maxBr = brs; menuTd = td; }
    }

    if (!menuTd || maxBr < 2) {
        const table = dateTd.closest('table');
        const rows = table ? Array.from(table.querySelectorAll('tr')) : [];
        const colIdx = rowTds.indexOf(dateTd);
        for (let i = rows.indexOf(tr) + 1; i < rows.length; i++) {
            const tds = rows[i].querySelectorAll('td, th');
            if (colIdx < tds.length && tds[colIdx].querySelectorAll('br').length >= 2) {
                menuTd = tds[colIdx];
                break;
            }
        }
    }

    return menuTd || null;
}

// 메인 크롤링 함수
async function scrapeLunch() {
    try {
        console.log('🍱 급식 크롤링 시작...');

        // HTML 가져오기
        const res = await fetch(LUNCH_SCHOOL_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();

        // DOM 파싱
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // 이번 주 월요일 계산
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

        // 월~금 데이터 추출 (이번 주 + 다음 주)
        const menus = {};
        for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
            for (let i = 0; i < 5; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + weekOffset * 7 + i);
                const dateStr = formatDate(d);

                const menuTd = findMenuTdByDate(doc, dateStr);
                if (!menuTd) continue;

                const items = extractMenuFromTd(menuTd);
                const kcalM = menuTd.textContent.match(/([\d.]+)\s*Kcal/i);
                const kcal = kcalM ? kcalM[1] : null;

                if (items.length > 0) {
                    menus[dateStr] = { items, kcal };
                }
            }
        }

        // 결과 저장
        const data = {
            updated: new Date().toISOString(),
            menus
        };

        // data 디렉토리 생성
        const dataDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`✅ 크롤링 완료: ${Object.keys(menus).length}일 저장됨`);
        console.log(`📁 저장 위치: ${OUTPUT_FILE}`);

    } catch (err) {
        console.error('❌ 크롤링 실패:', err.message);
        process.exit(1);
    }
}

scrapeLunch();
