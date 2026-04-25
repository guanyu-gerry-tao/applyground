import type { ComponentType } from 'react';
import type { ScenarioId } from '../types/scenario';

export type ScenarioComponent = ComponentType;

export const SCENARIO_COMPONENTS: Partial<Record<ScenarioId, ScenarioComponent>> = {};
