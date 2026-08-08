Based on the empirical live testing via Puppeteer, here are the actual results from the console:

**1. ScrollTrigger Instance Count**
*   **Before clicking any filter:** `0` (The initial page-load ScrollTrigger successfully fired and killed itself due to `once: true`).
*   **After first filter click:** `1`
*   **After second filter click:** `2`
*   **Result:** The instances **grow endlessly**. The new ScrollTriggers are successfully created on each render but they *never* fire their `onEnter` event, which means they never reach the `once: true` destruction phase. They just stack up in memory.

**2. Computed Opacity**
*   **Result:** `[ { inline: '0', computed: '0' }, { inline: '0', computed: '0' } ]`
*   The opacity stays absolutely frozen at exactly `0`. The tween is created but is perpetually paused waiting for the scroll trigger that never fires.

**3. The `ScrollTrigger.refresh()` Test**
*   **Result:** Running `ScrollTrigger.refresh()` manually in the console **DID NOT** make the cards appear. The opacity remained at `0`.
*   Even simulating a manual `window.scrollBy` after the refresh did not trigger the animation. 
*   **Conclusion:** The "stale/uninitialized trigger" theory is *incorrect*. `refresh()` updates the trigger positions, but because the scroll position hasn't crossed the `start: 'top 90%'` threshold (it was *already* past it when the new trigger was created), GSAP does not fire the `onEnter` callback. A `once: true` trigger created *below* the current scroll position requires the user to scroll back up and down across the threshold to fire, which they cannot do if the grid is at the top of the page.

**4. Detached Nodes / Selector Issues**
*   **Result:** `querySelectorAll('.work-card')` returned exactly `2` active nodes in the DOM.
*   GSAP is targeting the correct, active nodes. The issue is purely that the tween never executes.

**Final Verdict**
The root cause is a fundamental GSAP logic flaw for dynamically re-rendered elements: wrapping the opacity animation in a `ScrollTrigger` with `once: true` for the *initial* page load works, but reusing that exact same `ScrollTrigger` logic on filter clicks creates a deadlocked animation that never fires.

To fix this, the programmatic filter re-render should execute the `gsap.fromTo` animation **immediately** without a `ScrollTrigger` attached, since the user is already actively looking at the grid.
