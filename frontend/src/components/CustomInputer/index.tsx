import { Button } from "antd"
import React from 'react';
import styles from './index.module.less';

interface CustomInputNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const CustomInputNumber: React.FC<CustomInputNumberProps> = ({ value, onChange, min = -Infinity, max = Infinity, step = 1, disabled}) => {

  return (
    <div className={styles.customInputNumber}>
      <Button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min || disabled}
        size="small"
      >-</Button>

      <div className={styles.number}>{value}</div>

      <Button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max || disabled}
        size="small"
      >+</Button>
    </div>

  );
};

export default CustomInputNumber;
