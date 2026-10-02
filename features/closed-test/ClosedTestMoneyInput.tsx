import { useEffect, useState } from 'react';

import { Input } from '@/components/ui';
import { formatCentsToBRL, parseBRLToCents } from '@/utils/money';

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
  const [raw, setRaw] = useState(
    cents > 0 ? formatCentsToBRL(cents).replace('\u00a0', ' ') : '',
  );

  useEffect(() => {
    if (cents === 0 && raw !== '') return;
    if (cents > 0 && raw === '') {
      setRaw(formatCentsToBRL(cents).replace('\u00a0', ' '));
    }
  }, [cents, raw]);

  return (
    <Input
      value={raw}
      onChangeText={(text) => {
        setRaw(text);
        const parsed = parseBRLToCents(text);
        onChangeCents(parsed && parsed > 0 ? parsed : 0);
      }}
      onBlur={() => {
        if (cents > 0) {
          setRaw(formatCentsToBRL(cents).replace('\u00a0', ' '));
        }
      }}
      placeholder="R$ 0,00"
      keyboardType="decimal-pad"
      inputMode="decimal"
      autoFocus={autoFocus}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={{ fontSize: 32, minHeight: 72 }}
    />
  );
}
