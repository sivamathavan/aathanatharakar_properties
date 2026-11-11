"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/**
 * One toast style for the whole app (see lib/notify.ts for wording). Always
 * light, like the app itself, so a phone in dark mode doesn't get dark toasts.
 * Top centre keeps it clear of the bottom menus and the "Enquire now" bar.
 */
const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      closeButton
      visibleToasts={3}
      offset={{ top: "max(16px, env(safe-area-inset-top))" }}
      mobileOffset={{ top: "max(12px, env(safe-area-inset-top))", left: "12px", right: "12px" }}
      icons={{
        success: <CircleCheckIcon className="size-5 text-navy-600" aria-hidden />,
        info: <InfoIcon className="size-5 text-navy-600" aria-hidden />,
        warning: <TriangleAlertIcon className="size-5 text-gold-600" aria-hidden />,
        error: <OctagonXIcon className="size-5 text-red-700" aria-hidden />,
        loading: <Loader2Icon className="size-5 animate-spin text-navy-600" aria-hidden />,
      }}
      style={
        {
          "--normal-bg": "#FFFFFF",
          "--normal-text": "#0C2B29",
          "--normal-border": "#E4DED2",
          "--border-radius": "12px",
          "--width": "380px",
          // Close button on the right corner, away from the icon.
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0",
          "--toast-close-button-transform": "translate(35%, -35%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "pp-toast font-sans !gap-3 !py-3.5 !pl-4 !pr-4 !text-sm !shadow-lg",
          title: "!font-semibold !leading-snug",
          error: "!border-red-200 !border-l-4 !border-l-red-700",
          success: "!border-l-4 !border-l-navy-600",
          warning: "!border-l-4 !border-l-gold-500",
          info: "!border-l-4 !border-l-navy-400",
          closeButton: "!bg-white !border-[#E4DED2] !text-navy-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
