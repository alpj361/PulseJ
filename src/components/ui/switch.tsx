import * as React from "react"
import { cn } from "../../lib/utils"

export interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label className={cn("inline-flex items-center cursor-pointer", disabled && "cursor-not-allowed opacity-50", className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div 
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            checked ? "bg-primary" : "bg-input",
            disabled && "cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-background shadow-lg transition-transform",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </div>
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch } 