import type { SubmissionValidationResult } from '../types/scenario';

interface ValidationSummaryProps {
  validation: SubmissionValidationResult | null;
}

export default function ValidationSummary({ validation }: ValidationSummaryProps) {
  if (!validation) return null;
  if (validation.passed && validation.warnings.length === 0) return null;

  return (
    <section data-section="validation-summary" role="alert">
      {!validation.passed && (
        <>
          <p>The form is missing required answers:</p>
          <ul data-list="missing-required">
            {validation.missingRequiredFields.map((name) => (
              <li key={name} data-missing-field={name}>
                {name}
              </li>
            ))}
          </ul>
        </>
      )}
      {validation.warnings.length > 0 && (
        <>
          <p>Warnings:</p>
          <ul data-list="warnings">
            {validation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
