# Project-Wide Claude Instructions

## Development Standards

1. **Always follow Test-Driven Development (TDD).**
   - Use Red/Green TDD.
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
   - Don't introduce variables that just alias a property access. Only create a variable when the original name is unclear or the variable is used across different blocks.
   - Tests should test as little of the application as possible. Prefer focused unit tests over integration-style tests unless explicitly testing integration. Extract pure functions to utilities so they can be unit tested and reused.

---

## STOP — Check Skills Before Writing Code

**Before writing ANY implementation code, evaluate whether an installed skill applies.** This is a mandatory checkpoint, not a suggestion. Review the available skills list and match against the current task. If a skill applies, invoke it BEFORE editing files.

In particular, the `non-trivial-change` skill MUST be invoked when a request involves ANY of:

- Schema or data model changes  
- API/contract modifications  
- Dependency additions or updates  
- Security-sensitive changes  
- Multi-file or cross-module edits  
- Rollout, migration, or feature-flagged work  
- Ambiguous requirements or multiple viable designs  

When `non-trivial-change` applies:

- Follow its Plan-first Output Contract strictly.
- Do **not** write implementation code until the  
  **”Proceed with implementation?”** checkpoint is reached.

**Re-evaluate at every task transition.** When the user shifts to a new task mid-session, check skills again — don't carry forward the previous task's approach.

For trivial changes (e.g., small refactors, renames, minor fixes), implement directly while still adhering to TDD and project standards.
