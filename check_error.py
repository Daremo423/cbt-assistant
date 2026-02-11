from playwright.sync_api import sync_playwright

def check_error():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")
            page.wait_for_timeout(2000) # Wait for overlay to appear
            print("Taking screenshot of error...")
            page.screenshot(path="error_screenshot.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    check_error()
