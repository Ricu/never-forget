Follow the reference before inventing.
If a mockup or existing screen exists, treat its layout, density, hierarchy, and restraint as the default target; only deviate deliberately and explicitly.

Prefer design tokens over local colors.
Use the shared design tokens for color, surface, border, text, and states instead of per-component hex values or ad hoc Tailwind colors, so theme changes and dark mode stay systemic.

Start from system components, not custom wrappers.
When ai-elements or shared UI primitives already fit the job, keep their native structure and styling as intact as possible; customize lightly instead of rebuilding the component visually from scratch.
