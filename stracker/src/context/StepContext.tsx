import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from 'react';

import { useStepLogic } from '../hooks/useStepLogic';

export type SensorStrategy = 'pedometer' | 'accelerometer' | 'unsupported';

export interface StepContextValue {
  steps: number;
  distanceKm: number;
  calories: number;
  isWalking: boolean;
  isSupported: boolean;
  strategy: SensorStrategy;
  initialized: boolean;
  resetSteps: () => void;
}

const StepContext = createContext<StepContextValue | undefined>(undefined);

interface StepProviderProps {
  children: ReactNode;
}

export const StepProvider: React.FC<StepProviderProps> = ({ children }) => {
  const {
    steps,
    isWalking,
    isSupported,
    strategy,
    initialized,
    resetSteps,
  } = useStepLogic();

  const distanceKm = useMemo(() => {
    // Average step length ~0.78m -> 0.00078 km per step
    const METERS_PER_STEP = 0.78;
    return (steps * METERS_PER_STEP) / 1000;
  }, [steps]);

  const calories = useMemo(() => {
    // Rough average: 0.05 kcal per step
    const CALORIES_PER_STEP = 0.05;
    return steps * CALORIES_PER_STEP;
  }, [steps]);

  const value: StepContextValue = useMemo(
    () => ({
      steps,
      distanceKm,
      calories,
      isWalking,
      isSupported,
      strategy,
      initialized,
      resetSteps,
    }),
    [
      steps,
      distanceKm,
      calories,
      isWalking,
      isSupported,
      strategy,
      initialized,
      resetSteps,
    ],
  );

  return <StepContext.Provider value={value}>{children}</StepContext.Provider>;
};

export const useStepContext = (): StepContextValue => {
  const ctx = useContext(StepContext);
  if (!ctx) {
    throw new Error('useStepContext must be used within a StepProvider');
  }
  return ctx;
};

