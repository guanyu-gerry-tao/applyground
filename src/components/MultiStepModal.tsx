import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface MultiStepModalProps {
  open: boolean;
  title: string;
  stepIndex: number;
  totalSteps: number;
  onClose: () => void;
  children: ReactNode;
}

export default function MultiStepModal({
  open,
  title,
  stepIndex,
  totalSteps,
  onClose,
  children,
}: MultiStepModalProps) {
  if (!open) return null;
  return createPortal(
    <div data-modal-overlay="" role="dialog" aria-modal="true" aria-label={title}>
      <div data-modal-window="">
        <header data-modal-header="">
          <h2>{title}</h2>
          <p data-modal-progress="">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <button type="button" data-action="close-modal" onClick={onClose}>
            Close
          </button>
        </header>
        <div data-modal-body="">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
