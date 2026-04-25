import type {
  ScenarioMeta,
  SubmissionFileMetadata,
  SubmissionValidationResult,
} from '../types/scenario';

const FILE_FIELDS = new Set(['resume', 'coverLetter']);

export function isFileField(fieldName: string): boolean {
  return FILE_FIELDS.has(fieldName);
}

export interface ValidationInput {
  fields: Record<string, string>;
  files: SubmissionFileMetadata[];
}

export function validateRequired(
  meta: ScenarioMeta,
  input: ValidationInput,
): SubmissionValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const expected of meta.expectedFields) {
    if (!expected.required) continue;

    if (isFileField(expected.name)) {
      const has = input.files.some((f) => f.field === expected.name);
      if (!has) missing.push(expected.name);
      continue;
    }

    const value = input.fields[expected.name];
    if (value === undefined || value === null || `${value}`.trim() === '') {
      missing.push(expected.name);
    }
  }

  return {
    passed: missing.length === 0,
    missingRequiredFields: missing,
    warnings,
  };
}
