import { ReactNode } from 'react'
import { Button as ButtonAntd } from 'antd'
import type { ButtonProps } from 'antd'

import styles from './index.module.less'

export interface IButtonProps extends ButtonProps {
  icon?: ReactNode
  content?: string
  style?: React.CSSProperties
  customType?: 'primary' | 'default'
}

export const Button = ({
  customType = 'default',
  icon,
  content,
  style,
  ...rest
}: IButtonProps) => {
  return (
    <ButtonAntd
      className={`${styles.button} ${styles[`btn-${customType}`]}`}
      style={{ gap: content ? '0.35rem' : '0', ...style }}
      {...rest}
    >
      {icon}
      {content}
    </ButtonAntd>
  )
}
