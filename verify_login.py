from playwright.sync_api import sync_playwright, expect
import time

def verify_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")

            # Should redirect to login
            print("Checking for login page...")
            expect(page.get_by_role("heading", name="Sign in")).to_be_visible(timeout=10000)

            print("Clicking Sign Up link...")
            page.get_by_role("link", name="Don't have an account? Sign Up").click()

            print("Checking for Sign Up page...")
            expect(page.get_by_role("heading", name="Sign Up")).to_be_visible()

            print("Filling signup form...")
            # Use timestamp to make unique user each time
            ts = int(time.time())
            username = f"testuser_{ts}"
            email = f"test_{ts}@example.com"
            password = "password123"

            page.get_by_label("Username").fill(username)
            page.get_by_label("Email Address").fill(email)
            page.get_by_label("Password").fill(password)

            print(f"Registering user: {username}")
            page.get_by_role("button", name="Sign Up").click()

            # Should show success message and redirect
            print("Checking for success message...")
            expect(page.get_by_text("Registration successful!")).to_be_visible()

            # Wait for redirect to login
            print("Waiting for redirect to login...")
            # Increase timeout to 10s
            page.wait_for_url("**/login", timeout=10000)

            print("Logging in with new user...")
            page.get_by_label("Username").fill(username)
            page.get_by_label("Password").fill(password)
            page.get_by_role("button", name="Sign In").click()

            # Should redirect to Dashboard (/)
            print("Waiting for redirect to Dashboard...")
            page.wait_for_url("http://localhost:3000/", timeout=10000)

            print("Checking for Dashboard content...")
            expect(page.get_by_text("CBT Assistant")).to_be_visible(timeout=10000)
            expect(page.get_by_text(f"Hello, {username}")).to_be_visible()

            print("Taking screenshot...")
            page.screenshot(path="dashboard_verification.png")
            print("Verification complete!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="failure_screenshot.png")
            print("Saved failure_screenshot.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_login()
