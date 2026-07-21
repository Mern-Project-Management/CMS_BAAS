'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex gap-3.5 items-start w-full">
              {props.variant === 'success' && (
                <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0 border border-success/20 shadow-sm scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
              )}
              {props.variant === 'destructive' && (
                <div className="w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0 border border-destructive/20 shadow-sm scale-110 transition-transform duration-300">
                  <AlertCircle className="w-4.5 h-4.5" />
                </div>
              )}
              {(!props.variant || props.variant === 'default') && (
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-sm scale-110 transition-transform duration-300">
                  <Info className="w-4.5 h-4.5" />
                </div>
              )}
              <div className="grid gap-0.5 flex-1 pt-0.5">
                {title && <ToastTitle className="text-sm font-bold tracking-tight text-foreground">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs text-muted-foreground leading-relaxed">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
