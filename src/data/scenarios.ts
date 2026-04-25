import type { ScenarioMeta, ScenarioId } from '../types/scenario';

export const SCENARIO_META: ScenarioMeta[] = [
  {
    id: 'simple-company-form',
    typeId: 'company-careers',
    title: 'Simple company form',
    level: 1,
    description:
      'A baseline single-page application form. Standard label-and-input fields, resume upload, and a small set of screening questions.',
    difficultyTags: ['baseline', 'native-controls'],
    job: {
      title: 'Backend Software Engineer',
      team: 'Platform',
      location: 'Remote (Worldwide)',
      employmentType: 'Full-time',
      summary:
        'Help us build reliable services for our internal platform tools. Looking for engineers comfortable with distributed systems.',
    },
    expectedFields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'phone', label: 'Phone', required: false },
      { name: 'location', label: 'Current location', required: true },
      { name: 'resume', label: 'Resume', required: true, notes: 'Metadata-only upload.' },
      { name: 'portfolioUrl', label: 'Portfolio or profile URL', required: false },
      { name: 'workAuthorization', label: 'Work authorization', required: true },
    ],
    rubric: [
      { id: 'required-filled', description: 'All required fields filled.', points: 5 },
      { id: 'resume-attached', description: 'Resume metadata captured.', points: 3 },
      { id: 'screening-answered', description: 'Screening question answered.', points: 2 },
    ],
  },
  {
    id: 'company-screening-form',
    typeId: 'company-careers',
    title: 'Company form with screening questions',
    level: 1,
    description:
      'Same baseline structure as the simple company form, but with a longer screening section, a textarea cover note, and conditional follow-ups.',
    difficultyTags: ['baseline', 'screening-questions', 'conditional'],
    job: {
      title: 'Frontend Engineer',
      team: 'Web',
      location: 'Hybrid (multiple offices)',
      employmentType: 'Full-time',
      summary:
        'Frontend engineer to ship customer-facing features. Familiarity with React and modern CSS expected.',
    },
    expectedFields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'phone', label: 'Phone', required: false },
      { name: 'location', label: 'Current location', required: true },
      { name: 'resume', label: 'Resume', required: true, notes: 'Metadata-only upload.' },
      { name: 'coverNote', label: 'Cover note', required: true },
      { name: 'yearsExperience', label: 'Years of professional experience', required: true },
      { name: 'workAuthorization', label: 'Work authorization', required: true },
      { name: 'requiresSponsorship', label: 'Requires sponsorship', required: true },
      {
        name: 'sponsorshipDetails',
        label: 'Sponsorship details',
        required: false,
        notes: 'Only shown when requiresSponsorship === "yes".',
      },
    ],
    rubric: [
      { id: 'required-filled', description: 'All required fields filled.', points: 6 },
      { id: 'cover-note-nonempty', description: 'Cover note non-empty.', points: 2 },
      {
        id: 'conditional-only-when-relevant',
        description: 'Sponsorship details filled only when relevant.',
        points: 2,
      },
    ],
  },
  {
    id: 'easy-apply-style',
    typeId: 'easy-apply',
    title: 'Easy-apply style multi-step modal',
    level: 2,
    description:
      'Job detail page with an apply button that opens a three-step modal: contact, resume + links, screening questions. Next button is disabled until the current step is valid.',
    difficultyTags: ['multi-step', 'modal', 'step-gating'],
    job: {
      title: 'Product Designer',
      team: 'Design Systems',
      location: 'Remote (US time zones)',
      employmentType: 'Full-time',
      summary:
        'Designer focused on shared component libraries and design tokens. Some engineering collaboration expected.',
    },
    expectedFields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'phone', label: 'Phone', required: false },
      { name: 'resume', label: 'Resume', required: true },
      { name: 'portfolioUrl', label: 'Portfolio URL', required: true },
      { name: 'yearsExperience', label: 'Years of experience', required: true },
      { name: 'workAuthorization', label: 'Work authorization', required: true },
    ],
    rubric: [
      { id: 'reach-final-step', description: 'Agent reaches final step.', points: 4 },
      { id: 'submit-completed', description: 'Submission completed.', points: 4 },
      { id: 'no-skipped-required', description: 'No required field skipped.', points: 2 },
    ],
  },
  {
    id: 'easy-apply-quickflow',
    typeId: 'easy-apply',
    title: 'Easy-apply quick flow (two steps)',
    level: 2,
    description:
      'Compact two-step flow on a job detail page. Step 1: contact + resume. Step 2: confirm and submit.',
    difficultyTags: ['multi-step', 'compact'],
    job: {
      title: 'Junior Marketing Analyst',
      team: 'Growth',
      location: 'On-site',
      employmentType: 'Full-time',
      summary: 'Entry-level marketing analyst role with heavy emphasis on data work.',
    },
    expectedFields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'resume', label: 'Resume', required: true },
      { name: 'confirmAccurate', label: 'Confirms info is accurate', required: true },
    ],
    rubric: [
      { id: 'two-steps-passed', description: 'Both steps completed.', points: 5 },
      { id: 'confirmation-checked', description: 'Confirmation checkbox toggled.', points: 3 },
      { id: 'submit-completed', description: 'Submission completed.', points: 2 },
    ],
  },
  {
    id: 'enterprise-ats-style',
    typeId: 'workday-style',
    title: 'Enterprise ATS style wizard',
    level: 3,
    description:
      'Multi-page wizard typical of large enterprise ATS systems. Address block, custom select, work authorization, and a neutral EEO-style optional section.',
    difficultyTags: ['multi-page-wizard', 'custom-select', 'address-block', 'optional-eeo-style'],
    job: {
      title: 'Senior Data Engineer',
      team: 'Data Platform',
      location: 'Multiple cities',
      employmentType: 'Full-time',
      summary:
        'Lead data infrastructure work across the organization. Heavy collaboration with analytics and ML teams.',
    },
    expectedFields: [
      { name: 'firstName', label: 'First name', required: true },
      { name: 'lastName', label: 'Last name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'phone', label: 'Phone', required: true },
      { name: 'addressLine1', label: 'Street address', required: true },
      { name: 'city', label: 'City', required: true },
      { name: 'region', label: 'State / region', required: true },
      { name: 'postalCode', label: 'Postal code', required: true },
      { name: 'country', label: 'Country', required: true },
      { name: 'preferredStart', label: 'Preferred start date', required: true },
      { name: 'workAuthorization', label: 'Work authorization', required: true },
      { name: 'requiresSponsorship', label: 'Requires sponsorship', required: true },
      { name: 'highestEducation', label: 'Highest education', required: true },
      { name: 'optionalGenderSelfId', label: 'Optional self-identification (gender)', required: false },
      { name: 'optionalRaceSelfId', label: 'Optional self-identification (race/ethnicity)', required: false },
      { name: 'resume', label: 'Resume', required: true },
    ],
    rubric: [
      { id: 'all-pages-completed', description: 'All wizard pages completed.', points: 5 },
      { id: 'required-filled', description: 'All required fields filled.', points: 4 },
      {
        id: 'optional-not-forced',
        description: 'Optional self-id sections not blindly forced.',
        points: 1,
      },
    ],
  },
  {
    id: 'enterprise-ats-short',
    typeId: 'workday-style',
    title: 'Enterprise ATS short wizard',
    level: 3,
    description:
      'Trimmed two-page wizard variant of the enterprise ATS shape. Same controls family, fewer pages.',
    difficultyTags: ['multi-page-wizard', 'short'],
    job: {
      title: 'IT Support Specialist',
      team: 'Internal IT',
      location: 'On-site',
      employmentType: 'Full-time',
      summary: 'Internal IT support, hardware and account provisioning for a mid-size office.',
    },
    expectedFields: [
      { name: 'firstName', label: 'First name', required: true },
      { name: 'lastName', label: 'Last name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'phone', label: 'Phone', required: true },
      { name: 'city', label: 'City', required: true },
      { name: 'country', label: 'Country', required: true },
      { name: 'workAuthorization', label: 'Work authorization', required: true },
      { name: 'resume', label: 'Resume', required: true },
    ],
    rubric: [
      { id: 'wizard-completed', description: 'Both wizard pages completed.', points: 5 },
      { id: 'required-filled', description: 'All required fields filled.', points: 5 },
    ],
  },
  {
    id: 'modern-ats-style',
    typeId: 'modern-ats',
    title: 'Modern ATS embedded form',
    level: 2,
    description:
      'Compact embedded application form below a job description. Contact info, resume + cover letter metadata, links, two short answers.',
    difficultyTags: ['embedded', 'compact', 'two-uploads'],
    job: {
      title: 'Customer Success Engineer',
      team: 'Customer Engineering',
      location: 'Remote (EU time zones)',
      employmentType: 'Full-time',
      summary:
        'Hybrid technical/customer role. You will work directly with customer engineering teams to debug and unblock integrations.',
    },
    expectedFields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'phone', label: 'Phone', required: false },
      { name: 'resume', label: 'Resume', required: true },
      { name: 'coverLetter', label: 'Cover letter', required: false },
      { name: 'linkedinUrl', label: 'LinkedIn URL', required: false },
      { name: 'githubUrl', label: 'GitHub URL', required: false },
      { name: 'whyInterested', label: 'Why are you interested?', required: true },
      { name: 'noticePeriod', label: 'Current notice period', required: true },
    ],
    rubric: [
      { id: 'required-filled', description: 'All required fields filled.', points: 6 },
      { id: 'resume-attached', description: 'Resume metadata captured.', points: 2 },
      { id: 'short-answer-nonempty', description: 'Why-interested answer non-empty.', points: 2 },
    ],
  },
  {
    id: 'modern-ats-links',
    typeId: 'modern-ats',
    title: 'Modern ATS with extended links section',
    level: 2,
    description:
      'Same modern compact shape, but with a richer links section: profiles, writing samples, project links — each as a separate field.',
    difficultyTags: ['embedded', 'links-heavy'],
    job: {
      title: 'Technical Writer',
      team: 'Developer Experience',
      location: 'Remote',
      employmentType: 'Full-time',
      summary:
        'Own developer-facing documentation across our public APIs. Strong writing samples expected.',
    },
    expectedFields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'resume', label: 'Resume', required: true },
      { name: 'linkedinUrl', label: 'LinkedIn URL', required: false },
      { name: 'githubUrl', label: 'GitHub URL', required: false },
      { name: 'writingSampleUrl', label: 'Writing sample URL', required: true },
      { name: 'portfolioUrl', label: 'Portfolio URL', required: false },
      { name: 'projectUrl', label: 'A project you are proud of', required: false },
      { name: 'whyInterested', label: 'Why are you interested?', required: true },
    ],
    rubric: [
      { id: 'required-filled', description: 'All required fields filled.', points: 5 },
      {
        id: 'at-least-two-links',
        description: 'At least two link fields filled.',
        points: 3,
      },
      { id: 'short-answer-nonempty', description: 'Why-interested answer non-empty.', points: 2 },
    ],
  },
  {
    id: 'hostile-edge-cases',
    typeId: 'edge-cases',
    title: 'Hostile edge cases',
    level: 5,
    description:
      'Stress test page with multiple difficult-but-legal fixtures: ambiguous labels, hidden honeypot input, delayed-reveal section, shadow DOM field, custom dropdown, and an iframe-style upload region. All fixtures are documented in-page.',
    difficultyTags: [
      'ambiguous-labels',
      'honeypot',
      'delayed-section',
      'shadow-dom',
      'custom-dropdown',
      'iframe-upload',
    ],
    job: {
      title: 'Generalist',
      team: 'Special Projects',
      location: 'Remote',
      employmentType: 'Contract',
      summary:
        'Stress-test target. Not a real job; the page is designed to surface edge cases for browser automation.',
    },
    expectedFields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'preferredContact', label: 'Preferred contact method (custom dropdown)', required: true },
      { name: 'shadowComment', label: 'Shadow-DOM comment', required: true },
      { name: 'delayedAvailability', label: 'Availability (delayed reveal)', required: true },
      {
        name: 'honeypotMaybe',
        label: 'Honeypot field — should NOT be filled',
        required: false,
        notes: 'Documented honeypot. Filling it lowers the score.',
      },
      { name: 'resume', label: 'Resume (iframe-style upload region)', required: true },
    ],
    rubric: [
      { id: 'required-filled', description: 'All required fields filled.', points: 5 },
      {
        id: 'honeypot-skipped',
        description: 'Honeypot left empty.',
        points: 3,
      },
      {
        id: 'delayed-revealed-completed',
        description: 'Delayed section revealed and completed.',
        points: 2,
      },
    ],
  },
  {
    id: 'mild-edge-cases',
    typeId: 'edge-cases',
    title: 'Mild edge cases',
    level: 4,
    description:
      'Lighter version of edge cases. Ambiguous labels and a delayed section, but no shadow DOM and no iframe-style region.',
    difficultyTags: ['ambiguous-labels', 'delayed-section'],
    job: {
      title: 'Generalist',
      team: 'Special Projects',
      location: 'Remote',
      employmentType: 'Contract',
      summary:
        'Less aggressive stress-test page. Useful as a stepping stone before tackling hostile-edge-cases.',
    },
    expectedFields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'preferredContact', label: 'Preferred contact method', required: true },
      { name: 'delayedAvailability', label: 'Availability (delayed reveal)', required: true },
      {
        name: 'honeypotMaybe',
        label: 'Honeypot field — should NOT be filled',
        required: false,
        notes: 'Documented honeypot.',
      },
      { name: 'resume', label: 'Resume', required: true },
    ],
    rubric: [
      { id: 'required-filled', description: 'All required fields filled.', points: 5 },
      { id: 'honeypot-skipped', description: 'Honeypot left empty.', points: 3 },
      { id: 'delayed-revealed-completed', description: 'Delayed section completed.', points: 2 },
    ],
  },
];

export function findScenarioMeta(scenarioId: string): ScenarioMeta | undefined {
  return SCENARIO_META.find((s) => s.id === scenarioId);
}

export function scenariosByType(typeId: string): ScenarioMeta[] {
  return SCENARIO_META.filter((s) => s.typeId === typeId);
}

export const SCENARIO_IDS: ScenarioId[] = SCENARIO_META.map((s) => s.id);
