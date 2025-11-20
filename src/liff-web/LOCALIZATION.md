# LIFF Web Localization Guide

The LIFF on-page experience now auto-translates copy on the fly using the free [LibreTranslate](https://libretranslate.de) API. English remains the source language; other languages are rendered at runtime and cached in-memory to avoid repeat requests.

## How to switch languages in the UI
1. Open the LIFF web app.
2. Use the **Language** dropdown in the top navigation (visible on desktop and mobile menus).
3. Choose **English**, **中文**, or **ไทย**. Your selection is stored locally (`yl-liff-lang`) and reused on the next visit.

## How translations are applied
- Components declare their English strings inline and pass them through `useTranslatedText` from `src/liff-web/src/lib/autoTranslate.jsx`.
- The hook translates the map of strings to the currently selected language and returns the translated values once ready.
- Price, access count, and date rendering remain locale-aware via helper functions exposed by the same provider (`formatPrice`, `formatAccessTimes`, `formatDate`, `formatTime`).

## Working with fallbacks and dynamic text
- Data fallbacks for branches, instructors, and sessions are translated before being sent to API normalizers (see calls to `fetchCourses`, `fetchFeaturedCourses`, and `fetchCourseDetail`).
- Template strings keep placeholders (e.g., `{count}` or `{capacity}`); the translated string preserves the placeholder so runtime values can be injected afterward.

## Notes about the free translator
- LibreTranslate is a shared public endpoint; avoid excessive refreshes while developing to respect rate limits.
- When the service is unavailable, the UI gracefully falls back to English.
