import { cn } from "@/lib/utils"

interface FormFieldDescriptionProps {
    id?: string
    text?: string
    className?: string
}

export function FormFieldDescription({ id, text, className }: FormFieldDescriptionProps) {
    if (!text) return null

    return (
        <p
            id={id}
            className={cn("text-sm text-muted-foreground", className)}
        >
            {text}
        </p>
    )
}