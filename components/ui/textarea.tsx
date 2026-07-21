import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, onInvalid, onInput, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      ref={ref}
      onInvalid={(e) => {
        if (e.target instanceof HTMLTextAreaElement) {
          const val = e.target.value;
          if (val.length > 0 && val.trim().length === 0) {
            e.target.setCustomValidity("Field cannot contain only whitespace.");
          } else {
            e.target.setCustomValidity("");
          }
        }
        onInvalid?.(e);
      }}
      onInput={(e) => {
        if (e.target instanceof HTMLTextAreaElement) {
          e.target.setCustomValidity("");
          const val = e.target.value;
          if (val.length > 0 && val.trim().length === 0) {
             e.target.setCustomValidity("Field cannot contain only whitespace.");
          }
        }
        onInput?.(e);
      }}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
