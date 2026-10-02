export type FinancialProfile = {
  monthlyIncomeCents: number;
  incomeType: 'fixed' | 'variable';
};

export type UserProfile = {
  name: string;
  onboardingCompleted: boolean;
  email?: string;
};

export interface FinancialProfileRepository {
  get(): Promise<FinancialProfile | null>;
  save(profile: FinancialProfile): Promise<void>;
}

export interface ProfileRepository {
  get(): Promise<UserProfile | null>;
  updateName(name: string): Promise<void>;
  setOnboardingCompleted(value: boolean): Promise<void>;
}
