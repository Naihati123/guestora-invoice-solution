// v1.10.83 (#112) - is the Cost centres feature on, and this business's
// centres. With the feature off (Settings > Features) screens render nothing new.
import { useState, useEffect } from 'react';
import { getCostCentres, getEnabledModules } from '../store';
import { isModuleEnabled } from '../utils';
import { centresForBusiness } from '../utils/costCentres';

export const costCentresOn = () => isModuleEnabled('costCentres', getEnabledModules());

// This business's cost centres (archived included: lists and reports need
// them, the picker hides them). Empty while the feature is off.
export function useCostCentres(profile) {
  const [on] = useState(costCentresOn);
  const [all, setAll] = useState([]);
  useEffect(() => {
    if (on) getCostCentres().then(setAll).catch(() => setAll([]));
  }, [on]);
  return { on, centres: on ? centresForBusiness(all, profile) : [] };
}
