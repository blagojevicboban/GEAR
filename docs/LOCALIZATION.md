# Localization & Internationalization (i18n)

THE GEAR platform supports multiple languages using `react-i18next`. Currently supported languages:
- **English (EN)** - Reference/Source of truth.
- **Serbian (SR)** - Fully translated.
- **Greek (EL)**
- **Portuguese (PT)**
- **Turkish (TR)**
- **Italian (IT)**

## Directory Structure

All translations are stored as JSON files in the following structure:
```text
src/locales/
├── en/
│   └── translation.json  <-- Master reference
├── sr/
│   └── translation.json
├── el/
│   └── ...
```

## The English Reference Model

To prevent UI breakage (missing text showing keys like `nav.logout`), all language files must contain exactly the same keys as the English file. 

If a translation is missing for a specific language, the **English string** is used as a fallback placeholder. This ensures the application remains functional and readable while awaiting translation updates.

## Admin Translation Manager

Administrators can manage translations directly from the platform without code access:
1. Go to **Admin Settings**.
2. Select the **Translations** tab.
3. Select a target language.
4. **Search** for specific keys or text across the entire set.
5. The interface shows the **English Reference** value for comparison.
6. Edit the field and click **Save**.

### Technical Implementation

- **Sync Policy**: All locale files follow the same object structure and key ordering as the English file.
- **Backend Storage**: Translations are stored as physical `.json` files on the server to allow easy Git tracking while providing an administrative UI.
- **Key Flattening**: The UI uses a "flattened" key strategy (e.g., `nav.user_menu.logout`) to allow efficient searching and rendering of the nested JSON structure.

## Adding a New Language

To add a new language to the platform:
1. Create a new folder in `src/locales/` (e.g., `de/` for German).
2. Copy the contents of `src/locales/en/translation.json` into `src/locales/de/translation.json`.
3. Register the new language in `src/i18n.ts`.
4. The Admin Translation Manager will automatically detect the new folder and allow editing.
