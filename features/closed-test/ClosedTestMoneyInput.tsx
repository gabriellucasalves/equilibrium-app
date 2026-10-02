import { useMemo } from 'react';

import { Input } from '@/components/ui';
import { formatCentsToBRL } from '@/utils/money';

type Props = {
  cents: number;
  onChangeCents: (cents: number) => void;
  autoFocus?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

export function ClosedTestMoneyInput({
  cents,
  onChangeCents,
  autoFocus,
  testID,
  accessibilityLabel,
}: Props) {
  const value = useMemo(
    () => (cents > 0 ? formatCentsToBRL(cents).replace('\u00a0', ' ') : ''),
    [cents],
  );

  return (
    <Input
      value={value}
      onChangeText={(text) => {
        const digits = text.replace(/\D/g, '');
        const reais = digits ? Number.parseInt(digits, 10) : 0;
        onChangeCents(Number.isFinite(reais) ? reais * 100 : 0);
      }}
      placeholder="R$ 0,00"
      keyboardType="number-pad"
      inputMode="numeric"
      autoFocus={autoFocus}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={{ fontSize: 32, minHeight: 72 }}
    />
  );
}
