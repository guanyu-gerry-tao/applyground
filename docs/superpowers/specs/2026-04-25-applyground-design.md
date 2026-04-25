# Applyground Design

Date: 2026-04-25

## Summary

Applyground is an MIT-licensed static web playground for testing job application form automation. It gives AI browser agents, Playwright, Selenium, and wolf-like job automation tools a safe, stable, repeatable target for job application form filling.

The project simulates interaction patterns and structural challenges found in job application and ATS-style forms. It does not clone real brands, submit real applications, or store user data on a server.

## Product Boundaries

Applyground has three long-term product boundaries:

1. No brand styling.
   - Do not use real companies, ATS products, or platform names as scenario brands.
   - Descriptive references to common target types, such as "Workday style", are allowed when they clarify the target category. That is not a brand clone.
   - Do not use real logos, copied CSS, copied DOM structures, trademarked layouts, or any visual identity that looks official.
   - Scenarios may quietly mimic common interaction patterns so agents can practice against realistic targets.
   - Scenario names should remain neutral, such as `easy-apply-style`, `enterprise-ats-style`, and `modern-ats-style`.

2. No real backend by default.
   - The app should remain static-only for the foreseeable future.
   - There is no database, account system, server-side upload, or persistent submission store.
   - The built artifact should work on GitHub Pages, Netlify, Vercel static hosting, or any plain static file server.

3. Echo submitted data as JSON.
   - When a user or agent submits a form, the frontend assembles a submission object.
   - The confirmation page renders that object back to the user.
   - The user can download `submission.json`.
   - File uploads are not sent anywhere. The MVP only records file metadata such as name, type, size, and last modified time.

These boundaries keep Applyground useful as an automation target while avoiding privacy, storage, cleanup, abuse, and legal risk.

## Users And Use Cases

Primary users:

- Engineers building browser automation for job application forms.
- AI browser agent authors who need safe fill-and-submit targets.
- Playwright and Selenium users who need realistic form fixtures.
- wolf-like tools that need acceptance test targets for `fill` behavior.

Primary use cases:

- Practice filling out a job application from a candidate profile.
- Verify that an automation tool can handle common ATS form structures.
- Capture a deterministic JSON submission for automated scoring.
- Reproduce difficult browser-agent cases without touching real job platforms.

Non-goals:

- Real job board functionality.
- Employer dashboards.
- Candidate accounts.
- Persistent storage.
- Email delivery.
- Real resume parsing.
- Brand clones.

## Technical Architecture

Applyground is a Vite + React + TypeScript app.

Recommended dependencies:

- Vite for build and local development.
- React for UI.
- TypeScript for scenario and submission contracts.
- React Router for scenario and confirmation routes.
- Playwright for project self-tests.

The app is static. Runtime state lives in browser storage:

- `sessionStorage` stores the latest submitted object for the review page.
- `localStorage` may later store optional local preferences, but should not store submitted candidate data by default.

Form submission should not depend on a network request. The submit path is:

1. Agent fills the scenario form.
2. Agent clicks submit.
3. Frontend validates required fields.
4. Frontend normalizes form state into a typed JSON object.
5. Frontend writes the JSON object to `sessionStorage`.
6. Frontend navigates to the confirmation page.
7. Confirmation page displays JSON, scenario score, validation result, and a download button.

## Routes

Initial routes:

- `/`
  - Minimal type index.
  - Contains only the page title, short description, and application page type entries.
  - Type entries can be target categories such as `easy-apply`, `workday-style`, `company-careers`, `modern-ats`, and `edge-cases`.
  - The homepage does not directly list all cases and does not directly enter a full simulation.
  - This page prioritizes machine, AI agent, and test-script readability. It should not use flashy hero sections or complex visual design.

- `/types/:typeId`
  - Case list page for one application page type.
  - The top of the page has a title and introduction explaining what this type tests.
  - The bottom uses a bullet list to show one or more fake job application cases under that type.
  - Each bullet includes a stable URL, case name, difficulty, target capabilities, and a short description.

- `/scenarios/:scenarioId`
  - Runs one fake job application scenario.
  - Uses scenario metadata to render the title, job context, form surface, and expected rubric.

- `/confirmation/:scenarioId`
  - Reads the latest submission from `sessionStorage`.
  - Shows structured review, validation result, and raw JSON.
  - Provides a `submission.json` download.

- `/fixtures`
  - Optional lightweight page listing bundled sample resumes, job descriptions, and candidate profiles.
  - Can be deferred if MVP scope gets tight.

## Type And Scenario Model

Each type should define:

- `id`
- `title`
- `description`
- `examples`
- `scenarioIds`
- `notes`

A type is a homepage entry, not necessarily a concrete simulation page. One type can contain multiple scenarios. For example, `workday-style` can later contain a basic wizard, a long-form wizard, and a validation-heavy wizard.

Each scenario should define:

- `id`
- `typeId`
- `title`
- `level`
- `description`
- `job`
- `expectedFields`
- `difficultyTags`
- `rubric`
- `component`

Difficulty levels:

- Level 1: Standard accessible form.
- Level 2: Realistic but not hostile.
- Level 3: ATS-style complex DOM.
- Level 4: Deliberately awkward but still legal and operable.
- Level 5: Edge cases and agent stress tests.

Type metadata and scenario metadata should be separate from rendering code so tests and docs can reuse them.

## MVP Scenarios

The MVP homepage should first show these types:

- `company-careers`
  - Description: company careers application pages.
  - Initial case: `simple-company-form`.

- `easy-apply`
  - Description: short-flow, modal, multi-step application pages.
  - Initial case: `easy-apply-style`.

- `workday-style`
  - Description: large enterprise ATS wizard target category. This name may be used descriptively to help testers understand the category, but the app must not clone any real brand visuals or DOM.
  - Initial case: `enterprise-ats-style`.

- `modern-ats`
  - Description: modern, compact, embedded ATS application pages.
  - Initial case: `modern-ats-style`.

- `edge-cases`
  - Description: stress tests for difficult controls, ambiguous labels, delayed regions, shadow DOM, and related cases.
  - Initial case: `hostile-edge-cases`.

### 1. `simple-company-form`

Purpose: baseline one-page company careers application.

Features:

- Standard labels and inputs.
- Name, email, phone, and location.
- Resume upload.
- Portfolio or professional profile URL field with neutral naming.
- Basic screening questions.
- Direct, clear validation.

Expected difficulty: Level 1.

### 2. `easy-apply-style`

Purpose: short-form, multi-step modal application pattern.

Features:

- Job detail page with an apply button.
- Multi-step modal.
- Next and back controls.
- Resume upload.
- Contact fields.
- Screening questions.
- Submit or next button disabled until the current step is valid.

Expected difficulty: Level 2.

### 3. `enterprise-ats-style`

Purpose: large ATS-style wizard with deeper structure and more required data.

Features:

- Multi-page wizard.
- Deep nested layout.
- Required validation.
- Custom select or autocomplete.
- Address block.
- Work authorization.
- EEO-style optional questions with neutral wording.
- Validation summary.

Expected difficulty: Level 3.

### 4. `modern-ats-style`

Purpose: clean, compact, modern ATS-style application page without brand imitation.

Features:

- Job page plus embedded application form.
- Resume and cover letter upload metadata.
- Links section.
- Short-answer questions.
- Clean, realistic layout.
- Compact field grouping.

Expected difficulty: Level 2.

### 5. `hostile-edge-cases`

Purpose: focused stress test for difficult but legitimate browser automation cases.

Features:

- Duplicate labels.
- Ambiguous field names.
- Hidden honeypot-like fields that should not be filled and should be clearly documented as test fixtures.
- Delayed section reveal.
- Shadow DOM field.
- Iframe-like upload area.
- Weird custom dropdown.
- First validation failure followed by retry.

Expected difficulty: Level 5.

## Component Design

Initial component groups:

- Shared layout:
  - `AppShell`
  - `ScenarioIndex`
  - `ScenarioHeader`
  - `ScenarioFrame`
  - `ConfirmationReview`

- Form primitives:
  - `Field`
  - `FileInput`
  - `ValidationSummary`
  - `JsonDownloadButton`

- Difficult interaction fixtures:
  - `WeirdSelect`
  - `DelayedSection`
  - `ShadowField`
  - `IframeUpload`
  - `MultiStepModal`
  - `AmbiguousLabelGroup`
  - `ConditionalQuestion`

Each hard fixture should still be legal to operate with normal browser APIs. The goal is to test automation resilience, not to create impossible pages.

## Submission Contract

Every submission should follow a stable shape:

```json
{
  "app": "applyground",
  "version": "0.1.0",
  "scenarioId": "simple-company-form",
  "submittedAt": "2026-04-25T00:00:00.000Z",
  "candidate": {
    "fullName": "Example Candidate",
    "email": "candidate@example.com"
  },
  "answers": {
    "workAuthorization": "yes",
    "requiresSponsorship": "no"
  },
  "files": [
    {
      "field": "resume",
      "name": "resume.pdf",
      "type": "application/pdf",
      "size": 12345,
      "lastModified": 1777075200000
    }
  ],
  "validation": {
    "passed": true,
    "missingRequiredFields": [],
    "warnings": []
  },
  "score": {
    "passed": true,
    "points": 10,
    "maxPoints": 10,
    "notes": []
  },
  "raw": {
    "fields": {}
  }
}
```

Rules:

- Preserve user-entered values plainly.
- Do not silently correct user input.
- Include enough metadata for tests to verify behavior.
- Do not include binary file contents in the MVP.
- Keep the schema versioned so future scenarios can evolve safely.

## Validation And Scoring

Validation is local and deterministic.

Required fields should produce:

- Inline field errors.
- A summary when submit fails.
- A failed validation object if a scenario intentionally allows review after failure.

Initial scoring should stay simple:

- Required fields are present.
- Expected screening answers are present.
- Required file metadata is captured.
- Hidden fields are avoided in the hostile scenario.
- Conditional fields are completed only when relevant.

The score does not judge real candidate quality. It only judges whether an automation flow completed the target scenario correctly.

## Fixtures

Public fixtures can include:

- Sample resumes.
- Sample cover letters.
- Sample job descriptions.
- Candidate profiles.

Fixtures must be synthetic and safe to publish.

Suggested path:

```text
public/
  fixtures/
    resumes/
    cover-letters/
    jd/
src/
  data/
    candidateProfiles.ts
    jobs.ts
    scenarioRubrics.ts
```

## Visual Direction

Applyground should feel like a practical developer testing tool, not a marketing site. The homepage in particular should feel like a machine-friendly target-category index, not a heavily designed product homepage.

Visual principles:

- Neutral, original product identity.
- Homepage only contains a title, short description, and application page type entries.
- Type pages use Markdown-like structure: title, introduction, bullet list, stable links.
- Homepage can use a small amount of CSS for human readability, but should not be flashy, visually elaborate, image-heavy, or hero-driven.
- Prefer semantic HTML so browser agents, screen readers, Playwright/Selenium selectors, and LLMs can read the page easily.
- Users click into a type to see cases, then click into a case to enter the specific fake job application page.
- Scenario pages should be clean but not over-polished.
- Scenario difficulty labels should be clear.
- Information density should be high enough for repeated testing.
- Do not use real brand colors, logos, or copied layouts.
- Different scenarios may use different neutral styles so agents face varied surfaces.

The first screen should be a usable type index, not a landing page hero.

## Testing Strategy

MVP tests should use Playwright.

Core tests:

- Home page renders all application page type entries.
- Each type page renders that type's case bullet list.
- Each scenario route loads.
- `simple-company-form` can be filled and submitted.
- Confirmation page shows JSON and a download button.
- Required validation blocks incomplete submit.
- `hostile-edge-cases` exposes the expected difficult fixtures.

Later tests:

- Complete every scenario with the bundled candidate profile.
- Save downloaded JSON and compare it to the expected schema.
- Test mobile viewport for each scenario.
- Provide an external acceptance script for tools such as wolf.

## Documentation

Initial documentation:

- `README.md`
  - Project purpose.
  - No-brand and no-backend boundaries.
  - How to run locally.
  - How to use as an automation target.
  - Scenario list.

- `docs/scenarios.md`
  - Type and scenario details, target interactions, and scoring rubric.

- `docs/submission-schema.md`
  - JSON contract and examples.

## Implementation Plan Preview

The next implementation phase should:

1. Initialize Vite + React + TypeScript.
2. Add routing and app shell.
3. Add type metadata, scenario metadata, and shared submission types.
4. Implement fake submit and confirmation review.
5. Build the five MVP scenarios.
6. Add Playwright smoke tests.
7. Update README and docs.
8. Run build and tests.

## Open Decisions

No blocking decisions remain for the MVP.

Reasonable defaults:

- Use npm unless the user asks for pnpm.
- Use React Router for routing.
- Use plain CSS modules or a small global CSS file first, avoiding a component library until the patterns settle.
- Store only the latest submission in `sessionStorage`.
- Do not persist uploaded file contents.
