#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// CSS 최소화
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // 주석 제거
    .replace(/\n\s+/g, '\n') // 줄바꿈 및 들여쓰기 정리
    .replace(/\s+{/g, '{') // 공백 제거
    .replace(/\s+}/g, '}')
    .replace(/:\s+/g, ':')
    .replace(/,\s+/g, ',')
    .replace(/;\s+/g, ';')
    .replace(/\n+/g, '') // 모든 줄바꿈 제거
    .trim();
}

// 파일 읽기
const cssPath = path.join(__dirname, 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

// 최소화
const minified = minifyCSS(cssContent);

// 최소화된 CSS 저장
const minCssPath = path.join(__dirname, 'style.min.css');
fs.writeFileSync(minCssPath, minified);

// 크기 비교
const originalSize = cssContent.length;
const minifiedSize = minified.length;
const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(2);

console.log(`✅ CSS 최소화 완료`);
console.log(`📊 원본: ${(originalSize / 1024).toFixed(2)}KB → 최소화: ${(minifiedSize / 1024).toFixed(2)}KB (${reduction}% 감소)`);
