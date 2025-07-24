import type {
    Control,
    FieldErrors,
    FieldValues,
    Path,
    SubmitHandler,
    UseFormGetValues,
    UseFormRegister,
    UseFormSetValue,
    UseFormWatch,
    ValidationMode
} from "react-hook-form"
import { ReactNode } from "react"
import { z } from "zod"

export type FormMode = "create" | "update" | "delete"

export type FieldConfig<T extends FieldValues> = {
    name: Path<T>  // Use Path instead of keyof for better type safety with nested fields
    label: string
    type: "text" | "email" | "number" | "password" | "checkbox" | "textarea" | "custom" | "file"
    placeholder?: string
    hidden?: (values: T, mode: FormMode) => boolean
    disabled?: (values: T, mode: FormMode) => boolean
    readOnly?: (values: T, mode: FormMode) => boolean
    required?: boolean
    description?: string // Add description for field help text
    colSpan?: {
        mobile?: number
        tablet?: number
        desktop?: number
    }
    fileConfig?: {
        maxFiles?: number
        maxFileSize?: number
        acceptedFileTypes?: string[]
    }
    customRender?: (props: CustomFieldRenderProps<T>) => ReactNode // Add type for custom rendering
}

export type CustomFieldRenderProps<T extends FieldValues> = {
    fieldConfig: FieldConfig<T>
    formControl: Control<T>
    formRegister: UseFormRegister<T>
    formWatch: UseFormWatch<T>
    formErrors: FieldErrors<T>
    formSetValue: UseFormSetValue<T>
    formGetValues: UseFormGetValues<T>
    mode: FormMode
    isNonEditable: boolean
    currentValues: T
}

export type FormProps<T extends FieldValues> = {
    schema: z.ZodType<T>  // Be more specific about the schema type
    fields: FieldConfig<T>[]
    defaultValues?: Partial<T>
    onSubmit: SubmitHandler<T>
    onDelete?: SubmitHandler<T>
    submitLabel?: string
    cancelLabel?: string  // Add support for cancel button
    onCancel?: () => void // Add support for cancel action
    title?: string
    description?: string
    mode: FormMode
    loading?: boolean
    className?: string   // Add className prop for better styling control
    fieldClassName?: string // Class for field containers
    validationMode?: keyof ValidationMode // Allow configuration of validation mode
}

export type FieldProps<T extends FieldValues> = {
    fieldConfig: FieldConfig<T>
    control: Control<T>
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    isNonEditable: boolean
    className?: string
}