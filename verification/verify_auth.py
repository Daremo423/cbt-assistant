from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", timeout=60000)

        # Should redirect to /login
        print("Checking for redirect to /login...")
        # Wait for navigation to settle
        page.wait_for_url("**/login", timeout=10000)
        if "login" not in page.url:
            print(f"Warning: Expected redirection to /login, but URL is {page.url}")

        # Sign up flow
        print("Navigating to Sign Up...")
        page.get_by_text("Don't have an account? Sign Up").click()

        # Wait for Sign Up page
        page.wait_for_selector('h1:has-text("Sign Up")')

        # Fill Sign Up form
        print("Filling Sign Up form...")
        timestamp = int(time.time())
        username = f"user_{timestamp}"
        email = f"user_{timestamp}@example.com"
        password = "password123"

        page.fill('input[name="username"]', username)
        page.fill('input[name="email"]', email)
        page.fill('input[name="password"]', password)

        # Submit
        print("Submitting Sign Up form...")
        page.click('button[type="submit"]')

        # Wait for success message or redirect to login
        # Signup.jsx says: "Registration successful! Redirecting to login..." then waits 2s
        page.wait_for_selector('text=Registration successful!', timeout=10000)
        print("Registration successful!")

        # Wait for redirect to login (simulating time passing or checking url)
        # We can also manually navigate to login if needed, but let's see if the redirect works
        time.sleep(3)

        # Login flow
        print("Logging in...")
        # Should be back at login page
        if "login" not in page.url:
             page.goto("http://localhost:3000/login")

        page.fill('input[name="username"]', username)
        page.fill('input[name="password"]', password)
        page.click('button[type="submit"]')

        # Wait for Dashboard
        print("Waiting for Dashboard...")
        # Dashboard has "CBT Assistant" title and "Hello, {username}"
        # We wait for the text "Hello, user_..." to appear
        page.wait_for_selector(f'text=Hello, {username}', timeout=10000)

        print("Dashboard loaded!")

        # Take screenshot
        page.screenshot(path="verification/auth_flow.png")
        print("Screenshot saved to verification/auth_flow.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
