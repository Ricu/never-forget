FRONTMATTER TBD

Fundamentally:
- We dont want local styling or custom CSS classes in our components; we want to use the shared design tokens and system components as much as possible, so that our UI is consistent, themeable, and maintainable.
- when we need a component, follow this:
  1. check wether we already have an existing component or screen that can be reused as is or with minimal adjustments; if so, reuse it.
  2. check if ai-elements has a component that fits the need; if so, use it with minimal customization.
  3. if not, check if default shad/cn components can be used with minimal customization; if so, use them.
  4. if neither of the above works, then create a custom component, but still try to use design tokens and system components as much as possible within it, and avoid adding custom CSS or classes unless absolutely necessary. If you do the latter, please surface that to the user.
- when using ai-element and shad/cn components, start out with their default structure and styling. After having validated functionality, customize the styling following our design system. stronger deviations should be discussed with the user.