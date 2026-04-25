import type { ComponentType } from 'react';
import type { ScenarioId } from '../types/scenario';
import SimpleCompanyForm from './company-careers/SimpleCompanyForm';
import CompanyScreeningForm from './company-careers/CompanyScreeningForm';

export type ScenarioComponent = ComponentType;

export const SCENARIO_COMPONENTS: Partial<Record<ScenarioId, ScenarioComponent>> = {
  'simple-company-form': SimpleCompanyForm,
  'company-screening-form': CompanyScreeningForm,
};
