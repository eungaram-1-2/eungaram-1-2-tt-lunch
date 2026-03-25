import requests
from bs4 import BeautifulSoup
from datetime import date
import re
import sys

URL = "https://eungaram-m.goegh.kr/eungaram-m/ad/fm/foodmenu/selectFoodMenuView.do?mi=8056"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9",
}

def clean_menu_item(text):
    """알레르기 번호와 불필요한 공백 제거"""
    text = re.sub(r'\([\d\.]+\)', '', text)   # (1.5.6.10) 같은 알레르기 번호 제거
    text = re.sub(r'\([가-힣]+\)', '', text)   # (중) 같은 크기 표시 제거
    return text.strip()

def get_today_lunch():
    today = date.today().strftime("%Y-%m-%d")  # 예: 2026-03-22

    try:
        resp = requests.get(URL, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding
    except requests.RequestException as e:
        print(f"[오류] 페이지 접속 실패: {e}")
        sys.exit(1)

    soup = BeautifulSoup(resp.text, "html.parser")

    # 날짜가 포함된 td 탐색
    target_td = None
    for td in soup.find_all("td"):
        if today in td.get_text():
            target_td = td
            break

    if target_td is None:
        print(f"[안내] {today} 날짜의 급식 정보를 찾을 수 없습니다. (오늘은 방학/공휴일일 수 있습니다)")
        return

    # 해당 td가 속한 tr에서 메뉴 td 찾기
    parent_tr = target_td.find_parent("tr")
    if parent_tr is None:
        # td 자체에 메뉴가 있을 경우
        menu_td = target_td
    else:
        tds = parent_tr.find_all("td")
        menu_td = tds[-1] if tds else target_td  # 마지막 td에 메뉴가 있는 경우가 많음

    # 메뉴 텍스트 추출
    raw_text = menu_td.get_text(separator="\n")
    items = [clean_menu_item(line) for line in raw_text.splitlines() if line.strip()]
    items = [item for item in items if item]  # 빈 항목 제거

    # 칼로리 추출
    kcal_match = re.search(r'[\d\.]+\s*Kcal', resp.text)
    kcal_info = kcal_match.group() if kcal_match else "정보 없음"

    print(f"=== {today} 오늘의 급식 메뉴 ===")
    print(f"열량: {kcal_info}\n")
    for i, item in enumerate(items, 1):
        print(f"  {i}. {item}")

if __name__ == "__main__":
    get_today_lunch()
