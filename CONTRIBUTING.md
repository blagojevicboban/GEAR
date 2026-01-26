# Contributing to THE GEAR

Thank you for your interest in contributing to THE GEAR! We welcome contributions from developers, teachers, and students.

## Project Structure

- **`src/`**: React Frontend.
  - **`components/`**: Reusable UI components.
  - **`pages/`**: Main application routes.
  - **`services/`**: API client methods.
- **`server/`**: Node.js/Express Backend.
  - **`index.js`**: Main entry point and API routes.
  - **`db.js`**: Database connection pool.
  - **`uploads/`**: Directory for storing uploaded assets.
  - **`scripts/`**: Python/Shell scripts for data processing (e.g., CAD optimization).
- **`deployment/`**: Deployment scripts and webhook logic.
- **`tests/`**: End-to-end tests using Playwright.
- **`src/locales/`**: JSON translation files for i18n.

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/blagojevicboban/GEAR.git
    cd GEAR
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Database**:
    Ensure you have MariaDB/MySQL running.
    ```bash
    # Reset and seed database (Development only)
    npm run seed
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    - Frontend: http://localhost:3000
    - Backend: http://localhost:3001

## Code Quality

- **TypeScript**: We use TypeScript for the frontend. Please ensure your code is typed correctly.
- **TailwindCSS**: Use Tailwind utility classes for styling. Avoid custom CSS files where possible.
- **Linting**: (TODO: Add linting script)
- **Internationalization (i18n)**:
  - All UI strings MUST be placed in `src/locales/en/translation.json` and `src/locales/sr/translation.json`.
  - Use the `useTranslation` hook in React components.
  - When adding a new key, ensure it exists in BOTH language files to avoid fallbacks.

## Testing

We use [Playwright](https://playwright.dev/) for End-to-End (E2E) testing.

**Run all tests:**
```bash
npm run test:e2e
```

**Run interactive UI mode:**
```bash
npx playwright test --ui
```
- **Language Compatibility**: When writing new E2E tests, use regex-based text matching (e.g., `expect(page.getByText(/Save|Sačuvaj/i)).toBeVisible()`) to ensure tests pass in both English and Serbian.

Before submitting a Pull Request, please ensure all tests pass.

## Submitting Changes

1.  Create a new branch: `git checkout -b feature/my-new-feature`
2.  Commit your changes: `git commit -m 'Add some feature'`
3.  Push to the branch: `git push origin feature/my-new-feature`
4.  Open a Pull Request.
