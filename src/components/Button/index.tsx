import { ReactNode } from 'react'

import styles from './index.module.less'

export interface IButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'content'> {
  icon?: ReactNode
  content?: ReactNode
  style?: React.CSSProperties
  customType?: 'primary' | 'default'
}

export const Button = ({
  customType = 'default',
  icon,
  content,
  children,
  className,
  style,
  type = 'button',
  ...rest
}: IButtonProps) => {
  const hasLabel = Boolean(content) || Boolean(children);

  return (
    <button
      type={type}
      className={`${styles.button} ${styles[`btn-${customType}`]} ${className ?? ''}`}
      style={{ gap: icon && hasLabel ? '0.35rem' : '0', ...style }}
      {...rest}
    >
      {icon}
      {content}
      {children}
    </button>
  )
}
