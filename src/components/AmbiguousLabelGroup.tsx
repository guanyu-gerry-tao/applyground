import { Field } from './Field';

interface AmbiguousLabelGroupProps {
  fullName: string;
  email: string;
  onFullNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
}

export default function AmbiguousLabelGroup({
  fullName,
  email,
  onFullNameChange,
  onEmailChange,
}: AmbiguousLabelGroupProps) {
  return (
    <fieldset data-field-group="personal-info">
      <legend>Personal info</legend>
      <p>
        <small>
          Please enter your legal name and preferred contact email.
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
        label="Email"
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
