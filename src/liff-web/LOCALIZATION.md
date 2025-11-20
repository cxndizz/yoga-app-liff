# LIFF Web Localization Guide

The LIFF on-page experience now supports English (default), Chinese, and Thai. All screens render translations from a single i18n layer so you can expand or adjust copy without touching every component.

## How to switch languages in the UI
1. Open the LIFF web app.
2. Use the **Language** dropdown in the top navigation (visible on desktop and mobile menus).
3. Choose **English**, **中文**, or **ไทย**. Your selection is stored locally (`yl-liff-lang`) and reused on the next visit.

## Where translations live
- **File:** `src/liff-web/src/lib/i18n.jsx`
- Keys are grouped by feature (e.g., `nav`, `home`, `courses`, `detail`, `card`, `session`).
- Each language code (`en`, `zh`, `th`) contains the same set of keys.

## Adding or editing copy
1. Update or add keys inside the `translations` object in `src/liff-web/src/lib/i18n.jsx`.
2. Use the `t('group.key', { placeholder: value })` helper inside components to render text.
3. If you add new UI text, create a translation entry for all supported languages to keep the dropdown experience consistent.

## Formatting helpers
- Price, access count, and date rendering are locale-aware via the i18n context (`formatPrice`, `formatAccessTimes`, `formatDate`).
- To format inside a component, import `useI18n` and call the helper functions instead of using raw formatters.

## API data fallbacks
- Course and session normalization now receive translated fallbacks (branch, instructor, session name) so placeholder text follows the selected language.
- These fallbacks are passed from screens via the `copy` object when calling `fetchCourses`, `fetchFeaturedCourses`, or `fetchCourseDetail`.
