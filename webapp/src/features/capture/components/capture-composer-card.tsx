import { zodResolver } from "@hookform/resolvers/zod"
import { Mic, Plus } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  type PromptInputMessage,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { Badge } from "@/shared/ui/badge"

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
    <div className="w-full max-w-5xl space-y-7">
      <div className="space-y-2 text-center">
        <h1 className="text-[clamp(3rem,8vw,4.5rem)] font-semibold tracking-[-0.04em]">
          Capture
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Voice, text, or audio.
        </p>
      </div>

      <div className="space-y-3">
        <PromptInput onSubmit={handlePromptSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              aria-label="Capture prompt"
              className="min-h-40 text-base sm:text-lg"
              onChange={(event) => {
                form.setValue("text", event.currentTarget.value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }}
              placeholder="What should be remembered?"
              value={text ?? ""}
            />
          </PromptInputBody>

          <PromptInputFooter className="w-full items-center">
            <PromptInputTools>
              <PromptInputButton aria-label="Add attachment" size="icon-sm">
                <Plus className="size-4" />
              </PromptInputButton>
              <PromptInputButton aria-label="Record voice" size="icon-sm">
                <Mic className="size-4" />
              </PromptInputButton>
              <Badge className="h-8 rounded-full px-3" variant="outline">
                web app
              </Badge>
            </PromptInputTools>

            <PromptInputSubmit className="ml-auto" />
          </PromptInputFooter>
        </PromptInput>

        {form.formState.errors.text ? (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.text.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
