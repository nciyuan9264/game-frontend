import styles from './index.module.less'
import { ReactNode } from 'react'
import { Button as ButtonAntd } from 'antd'
import type { ButtonProps } from 'antd'

export interface IButtonProps extends ButtonProps {
  icon?: ReactNode
  content?: string
}

export const Button = ({
  icon,
  content,
  ...rest
}: IButtonProps) => {
  return (
    <ButtonAntd  className={styles.button} {...rest} style={{gap: content ? '0.35rem' : '0'}}>
      {icon}
      {content}
    </ButtonAntd>
  )
}
