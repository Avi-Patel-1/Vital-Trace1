# Design notes

## Visual direction

- Base palette stays near black with sharp white type, red as the main accent, and restrained amber and green trace support.
- The landing route uses layered signal lines, soft radial lighting, and oversized serif typography instead of a standard hero banner.
- Panels are intentionally rounded, translucent, and softly lit so the studio feels like an instrument surface rather than a dashboard template.

## Motion choices

- Landing sections reveal through Framer Motion rather than autoplay-heavy scene changes.
- Cursor light and scroll depth are subtle and degrade under reduced-motion preferences.
- The studio favors persistent movement inside the charts and route transitions instead of decorative page animations.

## Product framing

- Copy stays short and product-minded.
- The report layer is styled to feel printable and review-oriented.
- Vital Trace stays framed as a review environment, not a diagnostic system.

## Engineering choices

- Signal processing stays client-side so the app remains easy to deploy as a static demo.
- Demo datasets are generated from deterministic synthetic waveforms and also exported as public CSV/JSON samples.
- Route-level code splitting keeps the public entry lighter than the full studio bundle.
