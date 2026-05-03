# Sanitize Job Posting

You will receive one JSON object from a real job posting. The object includes:

- `title`: the source job title.
- `description_html`: the source job posting HTML fragment.

Return one JSON object with a sanitized core title and sanitized HTML.

## Core Rules

- Preserve the HTML structure when possible.
- Rewrite only visible text content.
- Keep ordinary semantic tags such as `p`, `div`, `section`, `h1`, `h2`, `h3`, `h4`, `ul`, `ol`, `li`, `strong`, `em`, `span`, `br`, and tables when they are useful.
- Do not output Markdown.
- Do not wrap the output in code fences.
- Do not add explanations, comments, citations, or notes.
- Output valid JSON only.

## Sanitization Rules

- Replace every employer name with `{{COMPANY_NAME}}`.
- Replace employer possessives too, such as `Acme's` -> `{{COMPANY_NAME}}'s`.
- Apply the employer-name rule everywhere, including legal boilerplate, equal employment opportunity text, policy names, copyright-like text, benefits text, and final application instructions.
- Do not leave the real employer name in possessive forms, policy names, page titles, image alt text, link text, or repeated boilerplate.
- Replace real product, brand, service, app, and platform names with `{{NPC_PRODUCT}}`.
- Replace real client, customer, partner, team, program, project, and internal system names with `{{NPC_NAME}}`.
- Replace URLs, links, application links, and real `href` values with `{{NPC_URL}}`.
- Replace email addresses with `{{NPC_EMAIL}}`.
- Replace phone numbers with `{{NPC_PHONE}}`.
- Replace recruiter, hiring manager, and named contact people with `{{NPC_RECRUITER}}`.
- Replace exact street addresses and office addresses with `{{NPC_ADDRESS}}`.
- Remove or neutralize tracking parameters and ATS/platform references.
- Remove image/logo tags and invisible tracking elements.
- Do not preserve real `href`, `src`, `srcset`, `data-*`, tracking, analytics, or application-link attribute values.
- Prefer removing `href`, `src`, `srcset`, `data-*`, tracking, analytics, and application-link attributes entirely.
- If a link target is useful to preserve as visible text, use `{{NPC_URL}}` as text content, not as a real attribute value.
- Lightly perturb non-critical numbers, such as salary ranges, years of experience, team size, visitor counts, customer counts, office counts, funding amounts, and growth metrics.

## Preserve Meaning

- Preserve the role type, seniority, work arrangement, core responsibilities, requirements, benefits, and application expectations.
- Preserve common technical terms that are central to the job, such as Python, SQL, AWS, React, Kubernetes, iOS, Android, data pipelines, machine learning, DevOps, or SRE.
- Preserve common technology names when they appear only as skills, tools, or job requirements.
- Replace technology, product, or platform names when they identify the real employer, a real employer-owned product line, a real customer, a real team, an internal system, or a business asset.
- Distinguish applicant skill requirements from employer-identifying names.
- Preserve technology names only when they describe skills, tools, frameworks, languages, infrastructure, or systems the applicant is expected to use.
- Replace or generalize technology, product, project, or platform names when they identify the employer's history, parent company, former project name, product line, customer, partner, internal team, internal platform, business asset, or public brand.
- Replace unique company history, founder stories, origin stories, former names, parent-company references, acquisition history, launch dates, founding dates, and milestone years with generic company background.
- Preserve normal employment details when useful, such as remote/hybrid/on-site, salary range, years of experience, shift expectations, and travel expectations.
- Keep the realistic job-posting texture. Do not make the posting dramatically more polished, more cheerful, more concise, or more generic than the source.

## Title Rules

- Return `title` as a short core role title only.
- Preserve seniority and role family when they are part of the core role, such as `Intern`, `Junior`, `Senior`, `Staff`, `Principal`, `Lead`, or `Engineering Manager`.
- Remove everything after comma-separated, dash-separated, slash-separated, colon-separated, or parenthesized qualifiers when those qualifiers are team, product, location, cohort, year, department, business unit, employer, platform, or program details.
- Remove real employer, platform, product, internal team, business unit, project, location, and cohort terms from `title`.
- Do not include company names or placeholders in `title`.
- Do not include `{{COMPANY_NAME}}`, `{{NPC_PRODUCT}}`, `{{NPC_NAME}}`, URLs, locations, dates, years, requisition IDs, or tags in `title`.
- Keep `title` boring and reusable. Prefer forms like `Senior Software Engineer`, `Staff Machine Learning Engineer`, `Data Engineer Intern`, or `Engineering Manager`.
- If the source title has multiple qualifiers, keep only the leftmost core role phrase.

Examples:

- `Senior Software Engineer, Network Performance & Reliability` -> `Senior Software Engineer`
- `Software Engineer, Airbnb - New Grad` -> `Software Engineer`
- `Principal Software Engineer - Vector Search - Elasticsearch` -> `Principal Software Engineer`
- `Senior Fullstack Engineer, Waymo for Business` -> `Senior Fullstack Engineer`
- `Data Engineer Intern - Pune (2026)` -> `Data Engineer Intern`
- `Sr. Software Engineer, Flight Software (Starship)` -> `Sr. Software Engineer`
- `Engineering Manager, Community Support Engineering (Routing and Data Services)` -> `Engineering Manager`

## Examples

Preserve applicant skill requirements such as:

- Experience with Python, C++, Linux, Kubernetes, ROS, TensorFlow, distributed systems, or data pipelines.
- Ability to build backend services on AWS or GCP.

Replace or generalize employer-identifying names such as:

- Originating as the Google Self-Driving Car Project in 2009.
- Join the YouTube Infrastructure team.
- Build ranking systems for Instagram Reels.
- Support Amazon Prime Video workflows.
- Work on an internal platform or product line that reveals the real employer.

## Paraphrasing Rules

- Paraphrase sentence by sentence.
- Keep roughly the same paragraph/list shape.
- Do not summarize the posting.
- Do not merge unrelated sentences.
- Do not reorder major sections.
- Do not invent a new role, industry, or seniority.
- Do not add rare legal, medical, government, security-clearance, immigration, or certification requirements unless they are central to the original role.

## Output

Return exactly one JSON object with this shape:

```json
{
  "title": "Senior Software Engineer",
  "html": "<p>Sanitized posting HTML...</p>"
}
```

The `title` value must be plain text. The `html` value must be the sanitized HTML fragment.

Before returning, check the result once more for real employer names, real product names, real URLs, email addresses, phone numbers, recruiter names, exact addresses, `href=`, `src=`, `srcset=`, and `data-*` attributes. Fix any remaining occurrence before final output.
