# AGENTS.md

## Project Overview

This repository contains the official Wired Club documentation, built with Astro and Starlight.

The documentation helps Habbo players understand Wired functionality, configure systems, and learn advanced concepts through explanations, references, and practical guides.

All contributions must prioritize technical accuracy, readability, consistency with existing documentation, and accessibility.

## 1. Language and Writing Style

### Language

- Write all new documentation in **Brazilian Portuguese (pt-BR)** unless explicitly instructed otherwise.
- Use Brazilian Portuguese vocabulary, grammar, spelling, and punctuation.
- Preserve official product names, Wired terminology, identifiers, property names, commands, and code exactly as required.
- Do not translate technical identifiers or official Wired names unless the project already uses an established translation.

### Mandatory Writing Style References

**Before creating or substantially rewriting any documentation page, inspect existing documentation files to understand and reproduce the project's established textual tone.**

The following directories are the authoritative writing-style references:

1. **Getting Started:** All documentation files recursively inside `src/content/docs/vamos-comecar/`.
2. **Practical Guides:** All documentation files recursively inside `src/content/docs/guias-praticos/`.
3. **Reference:** Only documentation files located directly inside `src/content/docs/referencia/`. **Do not include files from subdirectories of `referencia/` when analyzing the writing style.**
4. **About Us:** All documentation files recursively inside `src/content/docs/sobre-nos/`.

For `referencia/`, a file such as `referencia/glossario.mdx` is eligible, but a file such as `referencia/variaveis/exemplo.mdx` is not.

This exclusion applies specifically to the mandatory writing-style reference set. Nested reference pages may still be inspected when necessary for technical information or to preserve the structure of an existing page.

### How to Apply the Writing Style

Before writing:

1. Read the eligible files in the four reference directories.
2. Identify recurring patterns in tone, vocabulary, sentence length, paragraph structure, headings, transitions, explanations, and examples.
3. Pay attention to how the documentation addresses readers and introduces unfamiliar concepts.
4. Use those observations to guide the new content.
5. Compare the finished text against representative reference pages before completing the task.

When the reference set is large, inspect all eligible files where practical. If that is not feasible, select a representative sample from every directory, prioritizing pages similar to the requested content.

**The final text must sound like an existing Wired Club documentation page, not generic AI-generated technical documentation.**

Do not merely copy the structure of existing pages. Reproduce their natural writing style while creating original content.

### Writing Principles

- Prefer clear, natural, direct explanations.
- Explain technical concepts without assuming that every reader is experienced with Wired.
- Use consistent terminology throughout the documentation.
- Introduce concepts before explaining advanced configurations.
- Use concrete examples when they help readers understand a feature.
- Break complex procedures into manageable steps.
- Avoid unnecessary repetition, filler, exaggerated enthusiasm, and promotional language.
- Avoid overly formal, academic, or robotic phrasing.
- Do not add introductory or concluding paragraphs solely to make a page longer.
- Follow the established use of second-person language, imperative verbs, notes, and transitions found in the reference documents.
- Match the level of technical detail to the page's purpose.

When general writing recommendations conflict with a consistent textual convention established in the reference files, **prefer the repository's existing convention**, provided it remains accurate, clear, and accessible.

## 2. Technical Accuracy

Technical correctness takes priority over stylistic consistency.

- Never invent Wired behavior, properties, variable names, configuration options, or supported functionality.
- Verify technical claims using existing documentation, implementation details, or reliable official references.
- Use the exact names of Wireds, effects, conditions, selectors, variables, and other Habbo features.
- Preserve the exact syntax of commands, variable names, property identifiers, and configuration examples.
- Clearly distinguish verified behavior from assumptions.
- Never present an untested example as tested.
- Do not assume that all Wired features are available in every Habbo client or version.
- Do not invent images, URLs, screenshots, or external references.
- If required technical information is unavailable, explicitly identify the missing information instead of fabricating an explanation.

When technical sources disagree, prioritize verified behavior and the most relevant current official documentation. Report unresolved contradictions.

## 3. Documentation Structure

Documentation pages are located under `src/content/docs/`.

### Creating Pages

- Use `.mdx` files unless existing conventions or the task require otherwise.
- Place new pages in the directory that best matches their subject.
- Follow the naming conventions used by neighboring files.
- Prefer descriptive filenames.
- Inspect nearby pages before introducing a new structure.
- Use valid YAML frontmatter.

Typical frontmatter:

```yaml
---
title: Título da página
description: Descrição objetiva do conteúdo da página.
sidebar:
  label: Título no menu
  order: 1
---
```

Adapt frontmatter to the page and surrounding files. Do not blindly copy metadata values such as `sidebar.order`.

### Headings and Content Organization

- Use a logical heading hierarchy.
- Follow the heading patterns found in the relevant documentation section.
- Keep headings descriptive and concise.
- Organize content in the order readers need it.
- Avoid creating unnecessary sections.
- Use numbered procedures for sequential instructions when appropriate.
- Use lists only when they improve clarity.
- Keep related information together.

### Editing Existing Pages

- Preserve the existing page's purpose and organization unless restructuring is explicitly requested or necessary.
- Retain correct information.
- Avoid rewriting unrelated sections.
- Maintain existing internal links, imports, components, and frontmatter unless changes are required.
- Ensure new passages fit naturally into the surrounding text.

## 4. MDX and Components

The repository uses Astro and Starlight.

Prefer existing components and established patterns over custom implementations.

Available components may include:

- `Aside`
- `Steps`
- `Tabs` and `TabItem`
- `Card` and `CardGrid`
- `Infobox`
- `WiredGrid`
- `PageReader`
- `ShowcaseYouTube`

Before using a component:

1. Inspect how it is used in existing documentation.
2. Confirm its current import path and accepted properties.
3. Follow the repository's established formatting.
4. Import only the components that the page actually uses.

Do not introduce new components when an existing component already satisfies the requirement.

Avoid unnecessary changes to Astro configuration, shared components, styles, and global navigation.

## 5. Wired Documentation Guidelines

When documenting Wired functionality:

- Use the official Wired name whenever available.
- Explain the purpose of the feature before describing its configuration.
- Describe prerequisites when they are necessary.
- Present configuration steps in a logical order.
- Explain relevant interactions with other Wireds, variables, or systems.
- Include examples that demonstrate real use cases when helpful.
- Identify limitations, requirements, and important behavior when relevant.
- Avoid presenting a specific implementation as the only possible approach unless that restriction is technically justified.

### Practical Tutorials

When writing a tutorial:

1. Explain what the reader will accomplish.
2. Introduce the required Wireds or other prerequisites.
3. Describe each necessary configuration step.
4. Explain important settings and their effects.
5. Show how the completed system behaves.
6. Mention relevant limitations or troubleshooting guidance when appropriate.

Adapt this structure to the writing patterns already used in `guias-praticos/`.

Do not force every tutorial into an identical template.

### Reference Pages

For technical reference documentation:

- Prioritize precision and completeness.
- Preserve official identifiers and syntax.
- Use the established structure for the relevant reference category.
- Explain properties and behavior clearly.
- Include examples only when their behavior can be verified.
- Maintain consistency with related reference pages.

Although nested directories under `referencia/` are excluded from the mandatory textual-tone reference set, their pages may be inspected to understand technical conventions and page-specific structures.

## 6. Accessibility

Documentation must remain accessible to readers using different devices and assistive technologies.

- Use descriptive headings with a logical hierarchy.
- Provide meaningful alternative text for informative images.
- Avoid relying on color alone to communicate information.
- Use descriptive link text instead of ambiguous expressions such as "clique aqui".
- Use semantic Markdown and appropriate components.
- Ensure instructions remain understandable without relying exclusively on screenshots.
- Use tables only for genuinely tabular information.
- Give code examples appropriate language identifiers.
- Avoid unnecessary HTML when semantic Markdown or existing components are sufficient.
- Keep explanations clear for readers with different levels of technical knowledge.

Follow the existing site's accessibility conventions whenever they satisfy these principles.

## 7. Images and Links

### Images

- Reuse existing project assets whenever appropriate.
- Store new images in the location established by repository conventions.
- Use descriptive filenames.
- Provide meaningful alternative text.
- Do not invent screenshots or pretend that an image demonstrates behavior it does not show.
- Avoid adding decorative images that do not help readers understand the content.

### Internal Links

- Prefer the repository's established internal-link format.
- Verify that referenced pages and anchors exist.
- Update related links when a page is moved or renamed.
- Avoid introducing broken or unnecessary links.
- Consider linking to existing documentation rather than repeating lengthy explanations.

### External Links

- Prefer authoritative and relevant sources.
- Do not invent URLs.
- Avoid unnecessary external dependencies.
- Check that links point to the intended resources when verification is possible.

## 8. Working with the Repository

Before making changes:

1. Inspect the files and directories relevant to the request.
2. Read any existing `AGENTS.md` files applicable to the files being modified.
3. Review the repository's contribution guidelines.
4. Identify established conventions and dependencies.
5. Determine the smallest set of changes necessary to accomplish the task.

### Scope Control

- Only modify files relevant to the requested task.
- Do not perform unrelated refactoring.
- Do not rename or reorganize files without a clear reason.
- Do not change shared configuration solely to accommodate a documentation page when an existing pattern is sufficient.
- Preserve backward compatibility when possible.
- Do not overwrite user changes unrelated to the task.
- Avoid adding new dependencies for documentation-only changes.

### Package Management

- Inspect `package.json` and the existing lockfile before running installation commands.
- Use the project's established package manager.
- Do not replace or regenerate lockfiles unnecessarily.
- Do not assume that particular scripts exist without checking.

## 9. Validation

After creating or editing documentation:

### Content Review

Verify that:

- The text is in Brazilian Portuguese.
- The writing style matches the mandatory reference directories.
- The technical information is accurate.
- The documentation uses established terminology.
- Headings and sections follow a logical structure.
- Examples are internally consistent.
- New content does not unnecessarily duplicate existing pages.
- Frontmatter is valid and follows project conventions.
- Imported components exist and are used correctly.
- Internal links and asset references are valid.

### Build and Automated Checks

- Inspect `package.json` to identify available validation scripts.
- Run the applicable checks for the modified files.
- Run a production build when the environment and task permit.
- If validation fails, determine whether the failure was introduced by the changes.
- Do not claim that checks passed unless they were actually executed successfully.
- Report any checks that could not be executed and explain why.

When possible, inspect the rendered documentation to identify visual or formatting problems that static checks may not detect.

## 10. Git and Pull Requests

Contributions should follow the repository's established Git workflow.

- Do not push directly to `main`.
- Prepare changes on a separate branch or through an authorized fork.
- Keep commits focused on the requested change.
- Follow the repository's existing commit-message conventions.
- Use clear, descriptive commit messages.
- Do not include unrelated modifications.
- Do not create or merge a Pull Request without the user's authorization.

For documentation changes, a suitable commit message might be:

```text
docs: adiciona documentação da variável wf_var_echo
```

Before preparing a Pull Request, verify the changed files and report the validation results.

## 11. Expected Agent Behavior

### Before Writing

- Understand the task and identify relevant files.
- Inspect the mandatory textual-tone reference set.
- Review similar pages and applicable technical references.
- Identify uncertainties before making technical claims.
- Follow existing conventions rather than introducing arbitrary new ones.

### While Writing

- Use Brazilian Portuguese.
- Match the project's established textual tone.
- Preserve technical accuracy.
- Prefer focused, maintainable changes.
- Reuse existing patterns and components.
- Avoid speculative content.
- Do not introduce unrelated changes.

### After Writing

- Review the completed text against the style references.
- Check technical correctness and terminology.
- Validate MDX structure, frontmatter, imports, and links.
- Run available, relevant checks.
- Examine the final diff for unexpected modifications.

### Final Response

After completing a task, provide a concise summary containing:

1. The documentation pages created or modified.
2. Important content or structural changes.
3. Validation commands executed and their results.
4. Any unresolved uncertainties, missing information, or validation limitations.

Do not claim that documentation was published, merged, or deployed unless those actions were actually completed.

## 12. Priority of Instructions

When working on this repository, apply the following priorities:

1. Explicit instructions provided by the user for the current task.
2. Technical accuracy and verified Wired functionality.
3. Applicable repository instructions and contribution requirements.
4. The established writing style from the four mandatory reference directories.
5. Existing documentation conventions and reusable patterns.
6. General documentation best practices.

When instructions conflict, follow the highest applicable priority without sacrificing technical correctness or accessibility.

**The main objective is to produce documentation that feels native to Wired Club, remains technically reliable, and integrates cleanly with the existing project.**