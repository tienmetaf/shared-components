import { FieldProps } from "../types"
import { Controller, FieldValues } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { FormError } from "./form-error"
import { FormFieldDescription } from "./form-field-description"
import { FileUploadInput } from "@/app/components/file-upload/file-upload"

export function FileField<T extends FieldValues>({
                                                     fieldConfig,
                                                     control,
                                                     errors,
                                                     isNonEditable,
                                                     className
                                                 }: FieldProps<T>) {
    const { name, label, required, description, fileConfig } = fieldConfig
    const { maxFiles, maxFileSize, acceptedFileTypes } = fileConfig || {}
    const error = errors[name]

    return (
        <div className={cn("grid gap-2", className)}>
            <Label
                htmlFor={String(name)}
                className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
            >
                {label}
            </Label>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <FileUploadInput
                        value={Array.isArray(field.value) ? field.value : []}
                        onChange={field.onChange}
                        maxFiles={maxFiles}
                        maxFileSize={maxFileSize}
                        acceptedFileTypes={acceptedFileTypes}
                        disabled={isNonEditable}
                        aria-describedby={description ? `${String(name)}-description` : undefined}
                    />
                )}
            />
            {description && <FormFieldDescription id={`${String(name)}-description`} text={description} />}
            {error && <FormError message={error.message as string} />}
        </div>
    )
}