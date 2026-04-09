"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { AlertCircle, Trash2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "info"
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    setOptions(options)
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleClose = useCallback(() => {
    if (resolvePromise) resolvePromise(false)
    setOptions(null)
  }, [resolvePromise])

  const handleConfirm = useCallback(() => {
    if (resolvePromise) resolvePromise(true)
    setOptions(null)
  }, [resolvePromise])

  const variantIcons = {
    default: <AlertCircle className="w-12 h-12 text-blue-600 mb-2" />,
    destructive: <Trash2 className="w-12 h-12 text-rose-500 mb-2" />,
    info: <Info className="w-12 h-12 text-sky-500 mb-2" />,
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={!!options} onOpenChange={(open) => !open && handleClose()}>
        <AlertDialogContent className="border-none">
          <AlertDialogHeader>
            <div className="flex justify-center flex-col items-center">
              {options?.variant ? variantIcons[options.variant] : variantIcons.default}
              <AlertDialogTitle>{options?.title || "Xác nhận thao tác"}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-center">
              {options?.description || "Bạn có chắc chắn muốn thực hiện hành động này không?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>
              {options?.cancelText || "Hủy bỏ"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className={cn(
                options?.variant === "destructive" ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : ""
              )}
            >
              {options?.confirmText || "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context.confirm
}
