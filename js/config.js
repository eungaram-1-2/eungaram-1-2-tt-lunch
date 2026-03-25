// =============================================
// 계정 데이터 (기본값, data/accounts.csv로 덮어쓰기 가능)
// =============================================
let ACCOUNTS = [
    { id:'10201', username:'10201', password:'10201', nickname:'1번 학생', role:'user' },
    { id:'10202', username:'10202', password:'10202', nickname:'2번 학생', role:'admin' },
    { id:'10203', username:'10203', password:'10203', nickname:'3번 학생', role:'user' },
    { id:'10204', username:'10204', password:'10204', nickname:'4번 학생', role:'user' },
    { id:'10205', username:'10205', password:'10205', nickname:'5번 학생', role:'user' },
    { id:'10206', username:'10206', password:'10206', nickname:'6번 학생', role:'admin' },
    { id:'10207', username:'10207', password:'10207', nickname:'7번 학생', role:'user' },
    { id:'10208', username:'10208', password:'10208', nickname:'8번 학생', role:'user' },
    { id:'10209', username:'10209', password:'10209', nickname:'9번 학생', role:'user' },
    { id:'10210', username:'10210', password:'10210', nickname:'10번 학생', role:'user' },
    { id:'10211', username:'10211', password:'10211', nickname:'11번 학생', role:'user' },
    { id:'10212', username:'10212', password:'10212', nickname:'12번 학생', role:'user' },
    { id:'10213', username:'10213', password:'10213', nickname:'13번 학생', role:'user' },
    { id:'10214', username:'10214', password:'10214', nickname:'14번 학생', role:'user' },
    { id:'10215', username:'10215', password:'10215', nickname:'15번 학생', role:'user' },
    { id:'10216', username:'10216', password:'10216', nickname:'16번 학생', role:'user' },
    { id:'10217', username:'10217', password:'10217', nickname:'17번 학생', role:'user' },
    { id:'10218', username:'10218', password:'10218', nickname:'18번 학생', role:'user' },
    { id:'10219', username:'10219', password:'10219', nickname:'19번 학생', role:'user' },
    { id:'10220', username:'10220', password:'10220', nickname:'20번 학생', role:'user' },
    { id:'10221', username:'10221', password:'10221', nickname:'21번 학생', role:'user' },
    { id:'10222', username:'10222', password:'10222', nickname:'22번 학생', role:'user' },
    { id:'10223', username:'10223', password:'10223', nickname:'23번 학생', role:'user' },
    { id:'10224', username:'10224', password:'10224', nickname:'24번 학생', role:'user' },
    { id:'10225', username:'10225', password:'10225', nickname:'25번 학생', role:'user' },
    { id:'10226', username:'10226', password:'10226', nickname:'26번 학생', role:'user' },
    { id:'10227', username:'10227', password:'10227', nickname:'27번 학생', role:'user' },
    { id:'10228', username:'10228', password:'10228', nickname:'28번 학생', role:'user' },
    { id:'10229', username:'10229', password:'10229', nickname:'29번 학생', role:'admin' },
    { id:'10230', username:'10230', password:'10230', nickname:'30번 학생', role:'user' },
    { id:'10231', username:'10231', password:'10231', nickname:'31번 학생', role:'user' },
    { id:'10232', username:'10232', password:'10232', nickname:'32번 학생', role:'user' },
    { id:'teacher',  username:'teacher',  password:'1234', nickname:'담임선생님', role:'admin' },
    { id:'test1234', username:'test1234', password:'1234', nickname:'테스트계정',  role:'user' },
    { id:'testdev',  username:'testdev',  password:'1234', nickname:'개발자',     role:'admin' },
    // 과목별 선생님 계정
    { id:'국어_t',  username:'국어_t',  password:'1234', nickname:'국어 선생님', role:'admin' },
    { id:'수학_t',  username:'수학_t',  password:'1234', nickname:'수학 선생님', role:'admin' },
    { id:'영어_t',  username:'영어_t',  password:'1234', nickname:'영어 선생님', role:'admin' },
    { id:'과학_t',  username:'과학_t',  password:'1234', nickname:'과학 선생님', role:'admin' },
    { id:'사회_t',  username:'사회_t',  password:'1234', nickname:'사회 선생님', role:'admin' },
    { id:'체육_t',  username:'체육_t',  password:'1234', nickname:'체육 선생님', role:'admin' },
    { id:'음악_t',  username:'음악_t',  password:'1234', nickname:'음악 선생님', role:'admin' },
    { id:'미술_t',  username:'미술_t',  password:'1234', nickname:'미술 선생님', role:'admin' },
    { id:'도덕_t',  username:'도덕_t',  password:'1234', nickname:'도덕 선생님', role:'admin' },
    { id:'기가_t',  username:'기가_t',  password:'1234', nickname:'기가 선생님', role:'admin' },
    { id:'진로_t',  username:'진로_t',  password:'1234', nickname:'진로 선생님', role:'admin' },
    { id:'주제_t',  username:'주제_t',  password:'1234', nickname:'주제 선생님', role:'admin' }
];

// =============================================
// 시간표 (기본값, data/timetable.csv로 덮어쓰기 가능)
// =============================================
let TIMETABLE = {
    periods: [
        { num:1, time:'09:10' }, { num:2, time:'10:05' }, { num:3, time:'11:00' },
        { num:4, time:'11:55' }, { num:5, time:'13:40' }, { num:6, time:'14:35' },
        { num:7, time:'15:30' }
    ],
    days: ['월','화','수','목','금'],
    schedule: [
        [{s:'국어',t:'전태'},{s:'체육',t:'박준'},{s:'학스',t:'전태'},{s:'기가',t:'안치'},{s:'사회',t:'이혜'}],
        [{s:'과학',t:'박정'},{s:'미술',t:'이경'},{s:'사회',t:'변혜'},{s:'체육',t:'박준'},{s:'진로',t:'순미'}],
        [{s:'체육',t:'박준'},{s:'수학',t:'김정'},{s:'도덕',t:'김현'},{s:'수학',t:'김정'},{s:'수학',t:'김정'}],
        [{s:'미술',t:'이경'},{s:'음악',t:'정향'},{s:'과학',t:'박정'},{s:'사회',t:'이혜'},{s:'도덕',t:'김현'}],
        [{s:'주제1',t:'김인'},{s:'국어',t:'전태'},{s:'음악',t:'정향'},{s:'영어',t:'이하'},{s:'영어',t:'윤정'}],
        [{s:'주제1',t:'김인'},{s:'주제2',t:'김인'},{s:'영어',t:'이하'},{s:'국어',t:'윤현'},{s:'기가',t:'안치'}],
        [{s:'',t:''},{s:'주제2',t:'김인'},{s:'',t:''},{s:'',t:''},{s:'',t:''}]
    ]
};

// =============================================
// 과목 색상
// =============================================
const SUBJ_COLORS = {
    '국어':'#ef4444','수학':'#3b82f6','영어':'#22c55e','과학':'#f59e0b',
    '사회':'#8b5cf6','체육':'#06b6d4','음악':'#ec4899','미술':'#f97316',
    '도덕':'#14b8a6','기가':'#6366f1','진로':'#84cc16','학스':'#a855f7',
    '주제1':'#64748b','주제2':'#64748b'
};

// =============================================
// 바로가기 링크
// =============================================
const QUICK_LINKS = [
    { icon:'🏫', title:'은가람중학교 공식 사이트', desc:'학교 공식 홈페이지',       url:'https://eungaram-m.goegh.kr/eungaram-m/main.do', color:'#7c3aed' },
    { icon:'📚', title:'전자도서관',               desc:'온라인 전자도서관 이용',   url:'https://eungaram.yes24library.com/', color:'#3b82f6' },
    { icon:'🔍', title:'도서 검색',               desc:'학교 도서 검색 서비스',    url:'https://read365.edunet.net/PureScreen/SchoolSearch?schoolName=%EC%9D%80%EA%B0%80%EB%9E%8C%EC%A4%91%ED%95%99%EA%B5%90&provCode=J10&neisCode=J100007036', color:'#22c55e' },
    { icon:'🍽️', title:'급식 안내',               desc:'이번 주 급식 메뉴 확인',   url:'https://eungaram-m.goegh.kr/eungaram-m/ad/fm/foodmenu/selectFoodMenuView.do?mi=8056', color:'#f59e0b' },
    { icon:'📋', title:'학교 정보',               desc:'학교 알리미 정보 공개',    url:'https://www.schoolinfo.go.kr/ei/ss/Pneiss_b01_s0.do?SHL_IDF_CD=5279faf7-723c-4be3-985f-fb64171392e7', color:'#ec4899' },
    { icon:'📮', title:'건의함',                  desc:'의견 및 건의사항 제출',    url:'https://docs.google.com/forms/u/0/d/e/1FAIpQLSc1s4oIvfvoT_GbvdFU95ZglDqYvsfngXrwZOaiaeDDC2NsiA/formResponse', color:'#14b8a6' },
    { icon:'💬', title:'1-2반 건의함',         desc:'웹사이트 피드백 및 건의',   url:'https://docs.google.com/forms/d/e/1FAIpQLScUFM4zrlhQRJrgg0bXX33IiNY2nynXp4STqQsypHCHFb7byQ/viewform', color:'#ef4444' }
];
