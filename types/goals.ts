export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export type FinancialGoal = {
  id: string;
  name: string;
  targetAmountCents: number;
  currentAmountCents: number;
  targetDate: string | null;
  iconKey: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
};

export type GoalInput = {
  name: string;
  targetAmountCents: number;
  currentAmountCents?: number;
  targetDate?: string | null;
  iconKey?: string | null;
  status?: GoalStatus;
};
