import type { ComponentType } from 'react';
import type { TypeId } from '../data/types';

export type ScenarioId =
  | 'simple-company-form'
  | 'company-screening-form'
  | 'easy-apply-style'
  | 'easy-apply-quickflow'
  | 'enterprise-ats-style'
  | 'enterprise-ats-short'
  | 'modern-ats-style'
  | 'modern-ats-links'
  | 'hostile-edge-cases'
  | 'mild-edge-cases';

export type ScenarioLevel = 1 | 2 | 3 | 4 | 5;

export interface ExpectedField {
  name: string;
  label: string;
  required: boolean;
  notes?: string;
}

export interface ScenarioRubricEntry {
  id: string;
  description: string;
  points: number;
}

export interface JobContext {
  title: string;
  team: string;
  location: string;
  employmentType: string;
  summary: string;
}

export interface ScenarioMeta {
  id: ScenarioId;
  typeId: TypeId;
  title: string;
  level: ScenarioLevel;
  description: string;
  difficultyTags: string[];
  job: JobContext;
  expectedFields: ExpectedField[];
  rubric: ScenarioRubricEntry[];
}

export interface ScenarioDefinition extends ScenarioMeta {
  Component: ComponentType;
}

export interface SubmissionFileMetadata {
  field: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

export interface SubmissionValidationResult {
  passed: boolean;
  missingRequiredFields: string[];
  warnings: string[];
}

export interface SubmissionScore {
  passed: boolean;
  points: number;
  maxPoints: number;
  notes: string[];
}

export interface Submission {
  app: 'applyground';
  version: string;
  scenarioId: ScenarioId;
  submittedAt: string;
  candidate: Record<string, string>;
  answers: Record<string, string>;
  files: SubmissionFileMetadata[];
  validation: SubmissionValidationResult;
  score: SubmissionScore;
  raw: {
    fields: Record<string, unknown>;
  };
}
