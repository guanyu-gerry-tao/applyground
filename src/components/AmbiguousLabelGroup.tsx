import { Field } from './Field';

interface AmbiguousLabelGroupProps {
  fullName: string;
  email: string;
  onFullNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
}

/**
 * Two fields where the visible labels are ambiguous ("Name" and "Name *")
 * and the real distinction is in the placeholders / autocomplete hints.
 */
export default function AmbiguousLabelGroup({
  fullName,
  email,
  onFullNameChange,
  onEmailChange,
}: AmbiguousLabelGroupProps) {
  return (
    <fieldset data-field-group="ambiguous-labels">
      <legend>Personal info</legend>
      <p>
        <small>
          Both fields below are labelled with similarly ambiguous text. The autocomplete and
          placeholder are the only signal of which is which. This is intentional — agents must
          look beyond the visible label.
        </small>
      </p>
      <Field
        name="fullName"
        label="Name"
        required
        value={fullName}
        onChange={onFullNameChange}
        autoComplete="name"
        placeholder="Your full name"
      />
      <Field
        name="email"
        label="Name"
        required
        kind="email"
        value={email}
        onChange={onEmailChange}
        autoComplete="email"
        placeholder="you@example.com"
      />
    </fieldset>
  );
}
