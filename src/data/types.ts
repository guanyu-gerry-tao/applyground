export type TypeId =
  | 'company-careers'
  | 'easy-apply'
  | 'workday-style'
  | 'modern-ats'
  | 'edge-cases';

export interface ApplicationType {
  id: TypeId;
  title: string;
  shortDescription: string;
  examples: string[];
  notes: string;
}

export const APPLICATION_TYPES: ApplicationType[] = [
  {
    id: 'company-careers',
    title: 'Company careers page',
    shortDescription:
      'Single-page application form similar to a company careers page. Plain labels, plain validation.',
    examples: ['simple-company-form', 'company-screening-form'],
    notes:
      'Baseline target. Standard label-and-input forms with required fields, file uploads, and short screening questions.',
  },
  {
    id: 'easy-apply',
    title: 'Easy-apply style',
    shortDescription:
      'Short multi-step modal launched from a job detail page. Step-gated next/back controls.',
    examples: ['easy-apply-style', 'easy-apply-quickflow'],
    notes:
      'Tests handling of multi-step flows, conditional next-button enablement, and modal containers.',
  },
  {
    id: 'workday-style',
    title: 'Enterprise ATS style (workday-style)',
    shortDescription:
      'Multi-page wizard with deeper structure, custom selects, address blocks, EEO-style optional questions.',
    examples: ['enterprise-ats-style', 'enterprise-ats-short'],
    notes:
      'Descriptive name only. No real brand visuals, no copied DOM, no copied CSS. Models the interaction shape, not the brand.',
  },
  {
    id: 'modern-ats',
    title: 'Modern ATS style',
    shortDescription:
      'Embedded application form on a clean job page. Compact field grouping, links section, short answers.',
    examples: ['modern-ats-style', 'modern-ats-links'],
    notes:
      'Targets agents that need to handle real-feeling but compact embedded forms.',
  },
  {
    id: 'edge-cases',
    title: 'Edge cases',
    shortDescription:
      'Difficult-but-legal interaction patterns: ambiguous labels, delayed sections, hidden honeypots, weird controls.',
    examples: ['hostile-edge-cases', 'mild-edge-cases'],
    notes:
      'Stress test for browser automation. Each fixture is documented in-page so an agent operator can recognise the trap.',
  },
];

export function findType(typeId: string): ApplicationType | undefined {
  return APPLICATION_TYPES.find((t) => t.id === typeId);
}
