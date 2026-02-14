# Project-Wide Claude Instructions

## Development Standards

1. **Always follow Test-Driven Development (TDD).**
   - Write failing tests first.
   - Implement the minimal code required to pass.
   - Refactor only after tests pass.
   - Do not write production code without corresponding tests.

2. **Use `yarn` instead of `npm`.**
   - All install, add, remove, and script commands must use `yarn`.
   - Never suggest `npm` commands.

3. **Code Quality & Architecture**
   - Follow SOLID principles.
   - Prefer loosely coupled, highly cohesive modules.
   - Favor composition over inheritance.
   - Keep functions small and single-purpose.
   - For React projects:
     - Use component-based architecture.
     - Prefer functional components and hooks.
     - Keep business logic separate from presentation.
   - Avoid unnecessary dependencies.
   - Keep changes minimal and localized.

---

## Non-trivial Change Policy

If a request matches the triggers defined in the `non-trivial-change-protocol` skill:

- Schema or data model changes  
- API/contract modifications  
- Dependency additions or updates  
- Security-sensitive changes  
- Multi-file or cross-module edits  
- Rollout, migration, or feature-flagged work  
- Ambiguous requirements or multiple viable designs  

Then:

- Automatically apply the `non-trivial-change-protocol` skill.
- Follow its Plan-first Output Contract strictly.
- Do **not** write implementation code until the  
  **“Proceed with implementation?”** checkpoint is reached.

For trivial changes (e.g., small refactors, renames, minor fixes), implement directly while still adhering to TDD and project standards.
