import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FieldProps } from "../types"
import { Controller, FieldValues } from "react-hook-form"
import { cn } from "@/lib/utils"
import { FormError } from "./form-error"
import { FormFieldDescription } from "./form-field-description"

export function CheckboxField<T extends FieldValues>({
                                                         fieldConfig,
                                                         control,
                                                         errors,
                                                         isNonEditable,
                                                         className
                                                     }: FieldProps<T>) {
    const { name, label, required, description } = fieldConfig
    const error = errors[name]

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="flex items-center space-x-2">
                <Controller
                    name={name}
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                            id={String(name)}
                            checked={field.value as boolean}
                            onCheckedChange={field.onChange}
                            disabled={isNonEditable}
                            aria-describedby={description ? `${String(name)}-description` : undefined}
                        />
                    )}
                />
                <Label
                    htmlFor={String(name)}
                    className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
                >
                    {label}
                </Label>
            </div>
            {description && <FormFieldDescription id={`${String(name)}-description`} text={description} />}
            {error && <FormError message={error.message as string} />}
        </div>
    )
}