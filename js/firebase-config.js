// =============================================
// Firebase 설정
// =============================================
// 📌 사용 방법:
//   1. https://console.firebase.google.com 접속
//   2. 프로젝트 만들기
//   3. 빌드 → Realtime Database → 데이터베이스 만들기 (테스트 모드)
//   4. 프로젝트 설정 → 내 앱 → 웹앱 추가 → 아래 값 붙여넣기
//
// 설정 전까지는 localStorage 방식으로 동작합니다 (단일 기기).
// =============================================
const FIREBASE_CONFIG = {
    apiKey:            "",
    authDomain:        "",
    databaseURL:       "",   // ← 필수: "https://프로젝트명-default-rtdb.firebaseio.com"
    projectId:         "",
    storageBucket:     "",
    messagingSenderId: "",
    appId:             ""
};

// Firebase 초기화 (databaseURL이 입력된 경우에만)
let _fbApp = null;
let _fbDB  = null;

(function initFirebase() {
    if (!FIREBASE_CONFIG.databaseURL) return;
    try {
        _fbApp = firebase.initializeApp(FIREBASE_CONFIG);
        _fbDB  = firebase.database();
        console.info('[Firebase] Realtime Database 연결됨');
    } catch (e) {
        console.warn('[Firebase] 초기화 실패:', e);
        _fbDB = null;
    }
})();

function fbReady() { return !!_fbDB; }
