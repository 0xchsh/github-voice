"use client"

import { useState } from "react"
import { CaretDown, Copy, Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ScriptPreview({ script }: { script: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span>Podcast script</span>
        <CaretDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed pt-3">{script}</p>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <Check data-icon="inline-start" className="size-3.5" />
            ) : (
              <Copy data-icon="inline-start" className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy script"}
          </Button>
        </div>
      )}
    </div>
  )
}
