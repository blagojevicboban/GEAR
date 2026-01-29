import { test, expect } from '@playwright/test';

test('authentication flow - switching and failed login', async ({ page }) => {
    await page.goto('/');

    // Navigate to Login
    const loginLink = page.locator('#nav-login');
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    // Verify Login Form - Check for title
    await expect(
        page.getByText(/Welcome Back|Dobrodošli nazad/i).first()
    ).toBeVisible();

    // Switch to Register
    const signUpBtn = page.getByRole('button', {
        name: /Sign Up|Registrujte se/i,
    });
    await expect(signUpBtn).toBeVisible();
    await signUpBtn.click();

    // Verify Register Form
    await expect(page.getByText(/Create Account|Kreiraj nalog/i)).toBeVisible();

    // Switch back to Login
    const signInBtn = page.getByRole('button', {
        name: /Sign In|Prijavite se/i,
    });
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // Try dummy login
    const emailInput = page.getByPlaceholder(/@/i).first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill('wrong@example.com');

    const passwordInput = page.getByPlaceholder('••••••••');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('wrongpassword');

    page.on('dialog', async (dialog) => {
        await dialog.dismiss();
    });

    await page.locator('form button[type="submit"]').click();
});
