import type {
  ScenarioId,
  ScenarioMeta,
  Submission,
  SubmissionFileMetadata,
  SubmissionScore,
  SubmissionValidationResult,
} from '../types/scenario';
import { isFileField, validateRequired } from './validation';

export const APP_VERSION = '0.1.0';
export const SUBMISSION_STORAGE_KEY = 'applyground.latestSubmission';

export interface BuildSubmissionInput {
  scenarioMeta: ScenarioMeta;
  fields: Record<string, string>;
  files: SubmissionFileMetadata[];
  rawFields?: Record<string, unknown>;
}

const KNOWN_CANDIDATE_KEYS = new Set([
  'fullName',
  'firstName',
  'lastName',
  'email',
  'phone',
  'location',
  'city',
  'region',
  'country',
  'addressLine1',
  'postalCode',
  'preferredStart',
]);

export function splitCandidateAndAnswers(fields: Record<string, string>): {
  candidate: Record<string, string>;
  answers: Record<string, string>;
} {
  const candidate: Record<string, string> = {};
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (isFileField(key)) continue;
    if (KNOWN_CANDIDATE_KEYS.has(key)) {
      candidate[key] = value;
    } else {
      answers[key] = value;
    }
  }
  return { candidate, answers };
}

export function scoreSubmission(
  meta: ScenarioMeta,
  validation: SubmissionValidationResult,
  fields: Record<string, string>,
  files: SubmissionFileMetadata[],
): SubmissionScore {
  const notes: string[] = [];
  const maxPoints = meta.rubric.reduce((sum, r) => sum + r.points, 0);
  let earned = 0;

  for (const entry of meta.rubric) {
    let earnedThis = 0;
    switch (entry.id) {
      case 'required-filled':
        if (validation.passed) earnedThis = entry.points;
        break;
      case 'resume-attached':
        if (files.some((f) => f.field === 'resume')) earnedThis = entry.points;
        break;
      case 'cover-note-nonempty':
        if (fields['coverNote']?.trim()) earnedThis = entry.points;
        break;
      case 'screening-answered':
        if (fields['workAuthorization']?.trim()) earnedThis = entry.points;
        break;
      case 'conditional-only-when-relevant':
        if (
          fields['requiresSponsorship'] === 'yes'
            ? !!fields['sponsorshipDetails']?.trim()
            : !fields['sponsorshipDetails']?.trim()
        ) {
          earnedThis = entry.points;
        }
        break;
      case 'reach-final-step':
      case 'submit-completed':
      case 'two-steps-passed':
      case 'wizard-completed':
      case 'all-pages-completed':
        earnedThis = entry.points;
        break;
      case 'no-skipped-required':
        if (validation.passed) earnedThis = entry.points;
        break;
      case 'confirmation-checked':
        if (fields['confirmAccurate'] === 'yes' || fields['confirmAccurate'] === 'true') {
          earnedThis = entry.points;
        }
        break;
      case 'optional-not-forced':
        if (
          !fields['optionalGenderSelfId']?.trim() ||
          !fields['optionalRaceSelfId']?.trim()
        ) {
          earnedThis = entry.points;
        }
        break;
      case 'short-answer-nonempty':
        if (fields['whyInterested']?.trim()) earnedThis = entry.points;
        break;
      case 'at-least-two-links': {
        const links = ['linkedinUrl', 'githubUrl', 'writingSampleUrl', 'portfolioUrl', 'projectUrl']
          .map((k) => fields[k])
          .filter((v) => !!v?.trim());
        if (links.length >= 2) earnedThis = entry.points;
        break;
      }
      case 'honeypot-skipped':
        if (!fields['honeypotMaybe']?.trim()) earnedThis = entry.points;
        else notes.push('Honeypot field was filled. This is a documented trap.');
        break;
      case 'delayed-revealed-completed':
        if (fields['delayedAvailability']?.trim()) earnedThis = entry.points;
        break;
      default:
        notes.push(`Rubric "${entry.id}" not yet auto-scored.`);
    }
    earned += earnedThis;
  }

  return {
    passed: earned === maxPoints && validation.passed,
    points: earned,
    maxPoints,
    notes,
  };
}

export function buildSubmission(input: BuildSubmissionInput): Submission {
  const { scenarioMeta, fields, files, rawFields } = input;
  const validation = validateRequired(scenarioMeta, { fields, files });
  const { candidate, answers } = splitCandidateAndAnswers(fields);
  const score = scoreSubmission(scenarioMeta, validation, fields, files);

  return {
    app: 'applyground',
    version: APP_VERSION,
    scenarioId: scenarioMeta.id,
    submittedAt: new Date().toISOString(),
    candidate,
    answers,
    files,
    validation,
    score,
    raw: {
      fields: rawFields ?? fields,
    },
  };
}

export function saveLatestToSession(submission: Submission): void {
  try {
    sessionStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(submission));
  } catch (err) {
    console.warn('Failed to write submission to sessionStorage', err);
  }
}

export function buildScoreUrl(scenarioId: ScenarioId, submission: Submission): string {
  const search = new URLSearchParams(window.location.search);
  const jdId = search.get('id') ?? '0';
  const dataset = search.get('dataset');
  const seconds = Math.max(0, Math.round(performance.now() / 1000));
  const filledPercent = submission.score.maxPoints > 0
    ? Math.round((submission.score.points / submission.score.maxPoints) * 100)
    : 0;

  const scoreSearch = new URLSearchParams({
    sec: String(seconds),
    filled: `${filledPercent}%`,
    id: jdId,
  });
  if (dataset) scoreSearch.set('dataset', dataset);

  return `/score/${scenarioId}?${scoreSearch.toString()}`;
}

export function loadLatestFromSession(scenarioId: ScenarioId): Submission | null {
  try {
    const raw = sessionStorage.getItem(SUBMISSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Submission;
    if (parsed.scenarioId !== scenarioId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function fileToMetadata(field: string, file: File): SubmissionFileMetadata {
  return {
    field,
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  };
}
