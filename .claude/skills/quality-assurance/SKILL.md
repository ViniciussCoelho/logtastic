---
name: quality-assurance
description: Pragmatic, risk-based QA pass for the Logtastic frontend (React, TypeScript, Phaser 3, Vite). Run after a feature, milestone or implementation is complete — inspects the changes, adds only meaningful unit/integration tests (Jest-style, with React Testing Library) and Playwright end-to-end tests for critical user journeys, runs type checks and tests, fixes real defects, and reports results and remaining risks. Use when the user asks for QA, tests for finished work, or runs /quality-assurance.
---

# Quality Assurance — Logtastic

## Purpose

Perform a pragmatic, risk-based quality assurance pass after a feature, milestone, or implementation is complete.

The project uses React, TypeScript, Phaser 3, and Vite.

Use:
- Jest for unit and integration tests.
- React Testing Library when component interaction testing is appropriate.
- Playwright for end-to-end browser testing.

Do not replace the project's existing test runner without checking its configuration and obtaining approval. If the project currently uses Vitest, explain the migration tradeoff before changing it.

## Core Philosophy

**Test behavior, not implementation details.**

The goal is confidence in the product, not a high test count or arbitrary coverage percentage.

Do not generate test slop.

Every test must protect against a meaningful regression.

## When to Run

Execute this skill after the requested implementation is finished.

Do not interrupt feature development by creating speculative tests for unfinished functionality.

Do not test features that do not exist.

## Workflow

### Step 1 — Inspect

Before writing tests:

1. Inspect the changes and relevant code.
2. Understand the implemented behavior.
3. Review existing test infrastructure.
4. Identify critical user journeys.
5. Identify meaningful edge cases.
6. Identify existing coverage.
7. Determine which tests provide real value.

Do not blindly create one test file per source file.

### Step 2 — Select Tests

Prioritize tests for:

- User-visible behavior
- Business and domain rules
- State transitions
- Data transformations
- Validation
- Integration boundaries
- Error handling
- Critical interactions
- Previously identified bugs

Avoid tests for:

- Trivial getters and setters
- Static markup without behavior
- Implementation details
- Internal hook calls
- Private functions solely for coverage
- Framework behavior
- Third-party library internals
- Redundant happy-path scenarios
- Simple components with no meaningful logic

Do not add tests merely to make the test suite look comprehensive.

### Step 3 — Jest

Write focused unit and integration tests where they provide value.

Guidelines:

- Use clear, behavior-oriented test names.
- Prefer observable results over internal implementation.
- Mock only genuine external boundaries.
- Avoid excessive mocking.
- Avoid fragile snapshots.
- Keep test setup minimal.
- Cover meaningful edge cases.
- Keep tests deterministic.
- Avoid unnecessary testing utilities and abstractions.

Use React Testing Library for meaningful component interactions.

Do not test React or Phaser internals.

For Phaser-specific logic, extract and test pure functions when this genuinely improves testability.

Do not restructure production code solely to accommodate artificial tests.

### Step 4 — Playwright

Use Playwright to validate critical user journeys in a real browser.

For Logtastic, prioritize:

1. Character creation loads correctly.
2. The player can choose a nickname.
3. Invalid nicknames are rejected.
4. Fur color selection updates the avatar.
5. Hat selection updates the avatar.
6. The player can enter The Dam.
7. The game scene loads successfully.
8. The player can move within the room.
9. Predefined messages can be selected.
10. Speech bubbles appear correctly.

Only test features that have actually been implemented.

For canvas-based Phaser interactions:

- Prefer stable observable behavior.
- Use reliable coordinates or exposed test-friendly interfaces where necessary.
- Avoid arbitrary sleeps.
- Wait for explicit readiness conditions.
- Do not depend on animation timing when avoidable.
- Avoid brittle pixel-perfect assertions.

Do not duplicate every Jest test in Playwright.

Use E2E tests for complete user journeys, not trivial isolated functions.

### Step 5 — Execute and Fix

After writing tests:

1. Run the relevant Jest tests.
2. Run the relevant Playwright tests.
3. Run TypeScript checks.
4. Run linting.
5. Investigate failures.
6. Fix actual defects.
7. Re-run affected tests.

Do not weaken assertions merely to make tests pass.

Do not hide failures with skipped tests.

Do not introduce arbitrary retries to mask flaky behavior.

Do not modify unrelated production code.

If a test reveals a real bug, fix it with the smallest maintainable change.

### Step 6 — Review Test Quality

Before finishing, review every new test.

Ask:

- Does this test protect meaningful behavior?
- Could it catch a realistic regression?
- Is it deterministic?
- Is it testing the right abstraction level?
- Is it unnecessarily coupled to implementation details?
- Is it redundant with another test?
- Is the maintenance cost justified?

Delete tests that fail these criteria.

**Having fewer valuable tests is better than having many useless tests.**

### Step 7 — Report

Provide a concise final report containing:

- Behaviors tested
- Tests added
- Test results
- Bugs found and fixed
- Important risks not covered
- Any testing limitations

Do not exaggerate coverage or claim that unexecuted tests passed.

## Additional Constraints

- Follow existing project conventions.
- Keep the testing architecture simple.
- Do not introduce a complex testing framework.
- Do not create unnecessary fixtures, factories, helpers, or custom wrappers.
- Do not add dependencies without justification.
- Prefer small, focused tests.
- Keep the test suite fast.
- Never optimize for test count.
- Never optimize for arbitrary coverage metrics.
- Never test code just because it exists.

## Definition of Done

The quality assurance pass is complete when:

1. Critical implemented behaviors have meaningful regression protection.
2. Relevant Jest tests pass.
3. Relevant Playwright tests pass.
4. TypeScript and lint checks pass.
5. No unnecessary tests or abstractions were introduced.
6. Remaining limitations are documented.

If no meaningful tests are needed for a particular change, explicitly say so rather than inventing tests.

**Final rule: Write only tests that a pragmatic senior engineer would willingly maintain.**
