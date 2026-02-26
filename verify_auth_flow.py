from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to root (should redirect to login)
        print("Navigating to http://localhost:8080/ ...")
        page.goto("http://localhost:8080/")
        page.wait_for_url("**/login")
        print("Redirected to Login page.")
        page.screenshot(path="login_redirect.png")

        # 2. Go to Signup
        print("Navigating to Signup...")
        page.click("text=Don't have an account? Sign Up")
        page.wait_for_url("**/signup")
        print("On Signup page.")

        # 3. Fill Signup Form
        print("Filling Signup form...")
        page.fill("input[name='username']", "testuser")
        page.fill("input[name='email']", "test@example.com")
        page.fill("input[name='password']", "password123")
        page.click("button[type='submit']")

        # 4. Wait for success message and redirect
        print("Submitted Signup form. Waiting for redirect...")
        page.wait_for_selector("text=Registration successful!")
        page.wait_for_url("**/login", timeout=5000)
        print("Redirected to Login page after signup.")

        # 5. Login
        print("Logging in...")
        page.fill("input[name='username']", "testuser")
        page.fill("input[name='password']", "password123")
        page.click("button[type='submit']")

        # 6. Wait for Dashboard
        print("Submitted Login form. Waiting for Dashboard...")
        page.wait_for_url("http://localhost:8080/")
        page.wait_for_selector("text=CBT Assistant")
        print("Dashboard loaded.")

        # 7. Take Screenshot
        page.screenshot(path="dashboard_verified.png")
        print("Screenshot saved to dashboard_verified.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
