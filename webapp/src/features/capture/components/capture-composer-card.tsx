import { zodResolver } from "@hookform/resolvers/zod"
import { MessageSquareQuote, Orbit, Sparkles } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { cn } from "@/shared/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"

const capturePromptSchema = z.object({
  text: z.string().trim().min(1, "Enter some text to start a capture session."),
})

type CapturePromptValues = z.infer<typeof capturePromptSchema>

type CaptureComposerCardProps = {
  onStartCapture: (text: string) => void
}

export function CaptureComposerCard({
  onStartCapture,
}: CaptureComposerCardProps) {
  const form = useForm<CapturePromptValues>({
    defaultValues: {
      text: "",
    },
    resolver: zodResolver(capturePromptSchema),
  })

  const text = useWatch({
    control: form.control,
    name: "text",
  })

  async function handlePromptSubmit(message: PromptInputMessage) {
    form.setValue("text", message.text, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    const isValid = await form.trigger("text")
    if (!isValid) {
      return
    }

    const nextText = message.text.trim()
    onStartCapture(nextText)
    form.reset()
  }

  return (
    <Card className="relative overflow-hidden border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-2xl shadow-black/20">
      <div className="pointer-events-none absolute inset-y-7 left-5 w-px bg-[linear-gradient(180deg,rgba(125,211,252,0.75),rgba(251,146,60,0.18),transparent)]" />
      <div className="pointer-events-none absolute left-[17px] top-7 h-4 w-4 rounded-full border border-sky-300/50 bg-sky-300/20 shadow-[0_0_30px_rgba(125,211,252,0.35)]" />

      <CardHeader className="gap-4 pl-11">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/72">
          <Orbit className="h-3.5 w-3.5" />
          Direct Text Capture
        </div>

        <div className="space-y-2">
          <CardTitle className="text-[clamp(30px,5vw,48px)] leading-[1.02] tracking-[-0.03em]">
            Move the thought into a session while it is still clear.
          </CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7 text-[color:rgba(255,255,255,0.72)]">
            Submit one fresh text prompt. The app will open the capture session
            view immediately and stream the first assistant pass there.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pl-11">
        <PromptInput
          className="rounded-[28px] border border-white/10 bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur"
          onSubmit={handlePromptSubmit}
        >
          <PromptInputBody>
            <PromptInputTextarea
              aria-label="Capture prompt"
              className="min-h-32 border-none bg-transparent px-1 text-[15px] leading-7 shadow-none focus-visible:ring-0"
              onChange={(event) => {
                form.setValue("text", event.currentTarget.value, {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }}
              placeholder="Write what you want to remember."
              value={text ?? ""}
            />
          </PromptInputBody>

          <PromptInputFooter className="mt-3 border-t border-white/8 pt-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-[color:rgba(255,255,255,0.54)]">
              <MessageSquareQuote className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                The first user message becomes the opening transcript.
              </span>
            </div>

            <PromptInputSubmit
              className={cn("rounded-full px-4", !text?.trim() && "opacity-60")}
              disabled={!text?.trim()}
            >
              <Sparkles className="h-4 w-4" />
              <span>Start session</span>
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>

        {form.formState.errors.text ? (
          <p className="text-sm text-amber-300">
            {form.formState.errors.text.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
