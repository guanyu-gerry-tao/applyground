interface WizardStep {
  id: string;
  label: string;
}

interface WizardStepsProps {
  steps: WizardStep[];
  currentIndex: number;
}

export default function WizardSteps({ steps, currentIndex }: WizardStepsProps) {
  return (
    <nav data-section="wizard-steps" aria-label="Wizard progress">
      <ol>
        {steps.map((s, i) => {
          const status = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'pending';
          return (
            <li key={s.id} data-step-id={s.id} data-step-status={status}>
              <span data-step-number="">{i + 1}</span>. {s.label}
              {status === 'current' && <span aria-current="step"> (current)</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
