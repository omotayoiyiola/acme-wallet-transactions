import type { SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from '@/lib/cx'
import { Field } from '../Field'
import { Icon } from '../Icon'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string
  hideLabel?: boolean
  options: readonly SelectOption[]
  fieldClassName?: string
}

export function Select({ label, hideLabel, options, fieldClassName, className, id, ...rest }: SelectProps) {
  const generatedId = useId()
  return (
    <Field htmlFor={id ?? generatedId} label={label} hideLabel={hideLabel} className={fieldClassName}>
      <div className={styles.control}>
        <select id={id ?? generatedId} className={cx(styles.select, className)} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={16} className={styles.chevron} />
      </div>
    </Field>
  )
}
