---
name: building-components
description: Guide for building modern, accessible, and composable UI components. Use when building new components, implementing accessibility, creating composable APIs, setting up design tokens, publishing to npm/registry, or writing component documentation.
---

# Building Components

## Guiding Principles
Generally:
- We dont want local styling or custom CSS classes in our components; we want to use the shared design tokens and system components as much as possible, so that our UI is consistent, themeable, and maintainable.
- when we need a component, follow this:
  1. check wether we already have an existing component or screen that can be reused as is or with minimal adjustments; if so, reuse it.
  2. check if ai-elements has a component that fits the need; if so, use it with minimal customization.
  3. if not, check if default shad/cn components can be used with minimal customization; if so, use them.
  4. if neither of the above works, then create a custom component, but still try to use design tokens and system components as much as possible within it, and avoid adding custom CSS or classes unless absolutely necessary. If you do the latter, please surface that to the user.
- when using ai-element and shad/cn components, start out with their default structure and styling. After having validated functionality, customize the styling following our design system. stronger deviations should be discussed with the user.

## References

- [definitions.mdx](./references/definitions.mdx) - Artifact taxonomy (primitives, components, blocks, templates)
- [principles.mdx](./references/principles.mdx) - Core principles for component design
- [accessibility.mdx](./references/accessibility.mdx) - ARIA, keyboard navigation, WCAG compliance
- [composition.mdx](./references/composition.mdx) - Composable component patterns
- [as-child.mdx](./references/as-child.mdx) - The as-child pattern for element polymorphism
- [polymorphism.mdx](./references/polymorphism.mdx) - Polymorphic component patterns
- [types.mdx](./references/types.mdx) - TypeScript typing patterns for components
- [state.mdx](./references/state.mdx) - Controlled vs uncontrolled state management
- [data-attributes.mdx](./references/data-attributes.mdx) - Using data attributes for styling and state
- [design-tokens.mdx](./references/design-tokens.mdx) - Design token systems and theming
- [styling.mdx](./references/styling.mdx) - Component styling approaches
- [registry.mdx](./references/registry.mdx) - shadcn-style registry distribution
- [npm.mdx](./references/npm.mdx) - Publishing components to npm
- [marketplaces.mdx](./references/marketplaces.mdx) - Component marketplace distribution
- [docs.mdx](./references/docs.mdx) - Writing component documentation
