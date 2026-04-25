import type { ComponentType } from 'react';
import type { ScenarioId } from '../types/scenario';
import SimpleCompanyForm from './company-careers/SimpleCompanyForm';
import CompanyScreeningForm from './company-careers/CompanyScreeningForm';
import EasyApplyStyle from './easy-apply/EasyApplyStyle';
import EasyApplyQuickFlow from './easy-apply/EasyApplyQuickFlow';
import EnterpriseAtsStyle from './workday-style/EnterpriseAtsStyle';
import EnterpriseAtsShort from './workday-style/EnterpriseAtsShort';
import ModernAtsStyle from './modern-ats/ModernAtsStyle';
import ModernAtsLinks from './modern-ats/ModernAtsLinks';

export type ScenarioComponent = ComponentType;

export const SCENARIO_COMPONENTS: Partial<Record<ScenarioId, ScenarioComponent>> = {
  'simple-company-form': SimpleCompanyForm,
  'company-screening-form': CompanyScreeningForm,
  'easy-apply-style': EasyApplyStyle,
  'easy-apply-quickflow': EasyApplyQuickFlow,
  'enterprise-ats-style': EnterpriseAtsStyle,
  'enterprise-ats-short': EnterpriseAtsShort,
  'modern-ats-style': ModernAtsStyle,
  'modern-ats-links': ModernAtsLinks,
};
