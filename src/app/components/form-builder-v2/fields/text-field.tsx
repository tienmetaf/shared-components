import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldProps } from "../types"
import { FieldValues } from "react-hook-form"
import { cn } from "@/lib/utils"
import { FormError } from "./form-error"
import { FormFieldDescription } from "./form-field-description"

export function TextField<T extends FieldValues>({
                                                     fieldConfig,
                                                     register,
                                                     errors,
                                                     isNonEditable,
                                                     className
                                                 }: FieldProps<T>) {
    const { name, label, type, placeholder, required, description } = fieldConfig
    const error = errors[name]

    return (
        <div className={cn("grid gap-2", className)}>
            <Label
                htmlFor={String(name)}
                className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
            >
                {label}
            </Label>
            <Input
                id={String(name)}
                {...register(name)}
                type={type}
                placeholder={placeholder}
                disabled={isNonEditable}
                aria-invalid={!!error}
                aria-describedby={description ? `${String(name)}-description` : undefined}
                className={cn(error && "border-red-500")}
            />
            {description && <FormFieldDescription id={`${String(name)}-description`} text={description} />}
            {error && <FormError message={error.message as string} />}
        </div>
    )
}