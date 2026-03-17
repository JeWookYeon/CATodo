import logging
import os
import re
import shutil

from typing import Optional, Dict, Any, List

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException, TimeoutException


logger = logging.getLogger(__name__)

BASE_URL = "https://www.dhlottery.co.kr/lt645/result"


def create_driver(headless: bool = True) -> webdriver.Chrome:
    options = Options()

    if headless:
        options.add_argument("--headless=new")

    options.add_argument("--window-size=1400,1200")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--remote-debugging-port=9222")

    binary_candidates = [
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
    ]
    driver_candidates = [
        "/usr/bin/chromedriver",
        "/usr/lib/chromium/chromedriver",
    ]

    chrome_binary = next((p for p in binary_candidates if os.path.exists(p)), None)
    chrome_driver = next((p for p in driver_candidates if os.path.exists(p)), None)

    if not chrome_binary:
        chrome_binary = shutil.which("chromium") or shutil.which("chromium-browser")
    if not chrome_driver:
        chrome_driver = shutil.which("chromedriver")

    logger.info("Chrome binary path=%s", chrome_binary)
    logger.info("Chrome driver path=%s", chrome_driver)

    if not chrome_binary:
        raise RuntimeError("Chromium 실행 파일을 찾지 못했습니다.")
    if not chrome_driver:
        raise RuntimeError("chromedriver 실행 파일을 찾지 못했습니다.")

    options.binary_location = chrome_binary
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    service = Service(chrome_driver)

    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(1)
    return driver


def open_result_page(driver: webdriver.Chrome) -> None:
    driver.get(BASE_URL)

    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".lt645Swiper")))
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".swiper-slide-active")))
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".swiper-slide-active .ltEpsd")))
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".swiper-slide-active .result-ball")))

    wait.until(lambda d: d.execute_script("""
        const el = document.querySelector('.lt645Swiper');
        return !!(el && el.swiper);
    """))

    driver.execute_script("""
        const el = document.querySelector('.lt645Swiper');
        if (el && el.swiper) {
            el.swiper.params.speed = 0;
        }
    """)

    logger.info("동행복권 결과 페이지 진입 완료")


def get_active_round_no(driver: webdriver.Chrome) -> int:
    elem = driver.find_element(By.CSS_SELECTOR, ".swiper-slide-active .ltEpsd")
    return int(elem.text.strip())


def parse_draw_date(text: str) -> Optional[str]:
    match = re.search(r"(\d{4})\.(\d{1,2})\.(\d{1,2})", text)
    if not match:
        return None

    y, m, d = match.groups()
    return f"{y}-{int(m):02d}-{int(d):02d}"

def wait_for_active_slide_ready(driver: webdriver.Chrome, timeout: int = 10) -> None:
    wait = WebDriverWait(driver, timeout)

    def _ready(d):
        try:
            slide = d.find_element(By.CSS_SELECTOR, ".swiper-slide-active")
            round_text = slide.find_element(By.CSS_SELECTOR, ".ltEpsd").text.strip()
            balls = slide.find_elements(By.CSS_SELECTOR, ".result-ball")
            return bool(round_text) and len(balls) >= 7
        except StaleElementReferenceException:
            return False
        except Exception:
            return False

    wait.until(_ready)


def extract_current_slide(driver: webdriver.Chrome) -> Dict[str, Any]:
    last_error = None

    for attempt in range(3):
        try:
            wait_for_active_slide_ready(driver, timeout=10)

            # 매번 새로 찾는다. 이전 element 재사용 금지
            slide = driver.find_element(By.CSS_SELECTOR, ".swiper-slide-active")

            round_text = slide.find_element(By.CSS_SELECTOR, ".ltEpsd").text.strip()
            raw_date = slide.find_element(By.CSS_SELECTOR, ".result-date").text.strip()
            balls = slide.find_elements(By.CSS_SELECTOR, ".result-ball")

            if not round_text:
                raise RuntimeError("활성 슬라이드의 회차 텍스트가 비어 있습니다.")

            if len(balls) < 7:
                raise RuntimeError(f"result-ball 개수가 부족합니다: {len(balls)}")

            round_no = int(round_text)
            draw_date = parse_draw_date(raw_date)

            values = []
            for ball in balls[:7]:
                txt = ball.text.strip()
                if not txt:
                    raise RuntimeError("공 번호 텍스트가 비어 있습니다.")
                values.append(int(txt))

            numbers = values[:6]
            bonus = values[6]

            return {
                "round": round_no,
                "draw_date": draw_date,
                "numbers": numbers,
                "bonus": bonus,
            }

        except StaleElementReferenceException as e:
            last_error = e
            logger.warning("active slide stale 발생, 재시도 %s/3", attempt + 1)
        except TimeoutException as e:
            last_error = e
            logger.warning("active slide 준비 timeout, 재시도 %s/3", attempt + 1)
        except Exception as e:
            last_error = e
            logger.warning("slide 추출 중 예외, 재시도 %s/3: %s", attempt + 1, e)

    raise RuntimeError(f"활성 슬라이드 추출 실패: {last_error}")


def go_prev_round_fast(driver: webdriver.Chrome, current_round: int) -> None:
    target_round = current_round - 1

    driver.execute_script("""
        const el = document.querySelector('.lt645Swiper');
        if (el && el.swiper) {
            el.swiper.slidePrev(0);
        } else {
            throw new Error('Swiper instance not found');
        }
    """)

    wait = WebDriverWait(driver, 10)
    wait.until(lambda d: get_active_round_no(d) == target_round)
    wait_for_active_slide_ready(driver, timeout=10)

def collect_recent_rounds(
    count: int = 100,
    expected_latest_round: Optional[int] = None,
    headless: bool = True,
) -> List[Dict[str, Any]]:
    driver = create_driver(headless=headless)

    try:
        open_result_page(driver)

        current_round = get_active_round_no(driver)
        if expected_latest_round is not None and current_round != expected_latest_round:
            logger.warning(
                "현재 활성 회차=%s, 기대 최신 회차=%s",
                current_round,
                expected_latest_round,
            )

        results: List[Dict[str, Any]] = []

        for i in range(count):
            item = extract_current_slide(driver)
            results.append(item)
            logger.info("%s회 수집 완료", item["round"])

            if i < count - 1:
                go_prev_round_fast(driver, item["round"])

        return results

    finally:
        driver.quit()


def collect_new_rounds_since(last_saved_round: int, headless: bool = True) -> List[Dict[str, Any]]:
    driver = create_driver(headless=headless)

    try:
        open_result_page(driver)

        results: List[Dict[str, Any]] = []

        while True:
            item = extract_current_slide(driver)
            current_round = item["round"]

            if current_round <= last_saved_round:
                break

            results.append(item)
            logger.info("신규 회차 감지: %s회", current_round)

            go_prev_round_fast(driver, current_round)

        return results

    finally:
        driver.quit()


def get_latest_round(headless: bool = True) -> int:
    driver = create_driver(headless=headless)

    try:
        open_result_page(driver)
        return get_active_round_no(driver)
    finally:
        driver.quit()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    data = collect_recent_rounds(count=5, headless=False)
    for item in data:
        print(item)