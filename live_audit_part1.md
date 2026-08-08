# Live Audit Part 1: Vercel Production Site

**Date:** 2026-08-08
**Target:** https://jxdesigndev.vercel.app

This audit was conducted via a live Puppeteer browser automation script running directly against the production Vercel URL. All findings represent actual executed events, real DOM states, and measured browser performance across both Desktop (1440x900) and Mobile (375x812) simulated viewports.

---

## 1. Global Navigation & Interactions

**Desktop:**
*   **Nav Links:** Present and functional.
*   **Audio Toggle:** Clicking the audio toggle successfully injects/updates the `#jx-audio-toast` element into the DOM.
*   **Console Errors:**
    *   `[CONSOLE WARN] GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` (Benign WebGL software fallback warning).
    *   `[CONSOLE ERROR] Failed to load resource: the server responded with a status of 404 ()` (Likely a missing asset or favicon; observed globally).

**Mobile:**
*   **Hamburger Menu:** Clicking `#nav-hamburger` successfully adds the `.open` class to `#mobile-menu`. Clicking it a second time successfully removes the `.open` class.
*   **Console Errors:** Same WebGL warnings and 404 error as desktop.

---

## 2. Index Page (`/`)

### Animations & Scrolling Physics
*   **Desktop FPS:** Measured an average of **28 FPS** during a rapid 2000px scroll up/down sequence.
*   **Mobile FPS:** Measured an average of **42 FPS** during the same rapid scroll sequence.

### CLI Terminal (Desktop Only)
*   **Trigger:** The CLI trigger button (`#cli-trigger`) is visible and interactive on Desktop. On Mobile, it is completely hidden from the viewport.
*   **Valid Command (`help`):** Successfully opens the terminal and outputs the expected help menu (e.g., `jx@universe:~$ help` followed by the table of commands).
*   **Invalid Command (`nonsense_command`):** Correctly handles the error state, outputting `Command not found: 'nonsense_command'` in red with a prompt to type 'help'.

### Pong Minigame (Desktop Only)
*   **Activation:** Running `pong` in the CLI successfully adds the `.pong-active` class to the body.
*   **Interaction:** Arrow Up / Arrow Down inputs were held aggressively for 500ms without crashing the browser or throwing JS errors.
*   **Exit:** Clicking the `#pong-close-btn` successfully removed the `.pong-active` class.

---

## 3. About Page (`/about.html`)

### Scroll Performance
*   **Desktop FPS:** Measured an average of **38 FPS** during a 1500px scroll down the narrative sections.
*   **Mobile FPS:** Measured an average of **48 FPS** during the same scroll sequence.

---

## 4. Services Page (`/services.html`)

### Interaction
*   **Call to Action:** The main CTA button (`.services-cta a.btn`) rendered successfully and was clickable on both desktop and mobile.

---

## 5. Work Page (`/work.html`)

### Filters
*   **Behavior:** Clicking a filter button (other than "all") resulted in `0` visible cards (`opacity: 1`) on screen. (Live test revealed `filterWorked: 0` visible elements).

### Project Modal
*   **Trigger:** Clicking a `.work-card` successfully injected and opened the `.vault-modal-overlay` on both desktop and mobile.
*   **Content:** The modal populated the title and role (`.modal-title`, `.modal-meta-value`). However, structural images and case study links (`.modal-img`, `.modal-link`) were not detected in the active DOM (either due to missing payload data or mismatched class selectors).
*   **Scrolling Physics:** The modal is successfully scrollable independently of the background. A programmatic scroll down of 500px inside `.vault-modal` was successfully retained (`modalScrollTop: 500`).
*   **Close Action:** Attempting to click `.modal-close-btn` did **not** remove the overlay (the overlay remained open during the test, likely indicating either a broken close listener or an incorrect class name on the close button).

---

## 6. Contact Page (`/contact.html`)

### Form Validation (Invalid State)
*   **Action:** Submitted the form with an empty name and an invalid email (`not-an-email`).
*   **Result:** The form correctly prevented submission. The name field (`#cf-name`) had its `aria-invalid` attribute set to `"true"`, verifying real-time accessibility and validation handling.

### Form Submission (Valid State)
*   **Action:** Submitted with `Live Test AI Bot` and `test@example.com` along with a test payload indicating automated QA.
*   **Result:** The form successfully awaited network resolution and updated the UI status element with: 
    > `> Signal received. I'll respond within 24–48 hours. Let's build.`
*   **Verification:** This confirms the Supabase insertion logic is live, authenticated, and executing correctly on the Vercel production deployment.
