import type { ComponentType } from 'react';
import type { ScenarioId } from '../types/scenario';
import SimpleCompanyForm from './company-careers/simple-company-form';
import CompanyScreeningForm from './company-careers/company-screening-form';
import EasyApplyStyle from './easy-apply/easy-apply-style';
import EasyApplyQuickFlow from './easy-apply/easy-apply-quickflow';
import EnterpriseAtsStyle from './workday-style/enterprise-ats-style';
import EnterpriseAtsShort from './workday-style/enterprise-ats-short';
import ModernAtsStyle from './modern-ats/modern-ats-style';
import ModernAtsLinks from './modern-ats/modern-ats-links';
import HostileEdgeCases from './edge-cases/hostile-edge-cases';
import MildEdgeCases from './edge-cases/mild-edge-cases';

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
  'hostile-edge-cases': HostileEdgeCases,
  'mild-edge-cases': MildEdgeCases,
};
