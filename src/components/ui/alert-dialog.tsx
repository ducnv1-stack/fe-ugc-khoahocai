"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"

function AlertDialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
}

function AlertDialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-[100] bg-slate-950/20 backdrop-blur-sm tracking-tight transition-all duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <DialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-[101] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-[1.5rem] bg-white dark:bg-slate-900 p-6 text-sm text-popover-foreground shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] ring-1 ring-slate-200 dark:ring-slate-800 duration-200 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-left-1/2 data-open:slide-in-from-top-48 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-left-1/2 data-closed:slide-out-to-top-48",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col items-center text-center gap-3", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:justify-center pt-2",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-xl font-bold tracking-tight text-slate-900 dark:text-white",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "text-slate-500 dark:text-slate-400 text-sm leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogAction({ ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-dialog-action"
      variant="default"
      className="rounded-xl px-8 h-11 font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
      {...props}
    />
  )
}

function AlertDialogCancel({ ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-dialog-cancel"
      variant="outline"
      className="rounded-xl px-8 h-11 font-bold bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all"
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
