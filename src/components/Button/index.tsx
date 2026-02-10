import styles from './index.module.less'
import { ReactNode } from 'react'
import { Button as ButtonAntd } from 'antd'
import type { ButtonProps } from 'antd'

export interface IButtonProps extends ButtonProps {
  icon?: ReactNode
  content?: string
  style?: React.CSSProperties
}

export const Button = ({
  icon,
  content,
  style,
  ...rest
}: IButtonProps) => {
  return (
    <ButtonAntd className={styles.button} {...rest} style={{ gap: content ? '0.35rem' : '0', ...style }}>
      {icon}
      {content}
    </ButtonAntd>
  )
}
