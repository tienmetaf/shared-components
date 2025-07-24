import type {
    Control,
    FieldErrors,
    FieldValues,
    SubmitHandler,
    UseFormGetValues,
    UseFormRegister, UseFormSetValue,
    UseFormWatch
} from "react-hook-form"

export type FormMode = "create" | "update" | "delete"

type FieldConfig<T extends FieldValues> = {
    name: keyof T
    label: string
    type: "text" | "email" | "number" | "password" | "checkbox" | "textarea" | "custom" | "file"
    placeholder?: string
    hidden?: (values: T, mode: FormMode) => boolean
    disabled?: (values: T, mode: FormMode) => boolean
    readOnly?: (values: T, mode: FormMode) => boolean // New property for non-editable fields
    colSpan?: {
        mobile?: number // e.g., 1 (col-span-1)
        tablet?: number // e.g., 2 (md:col-span-2)
        desktop?: number // e.g., 3 (lg:col-span-3)
    },
    fileConfig?: {
        maxFiles?: number
        maxFileSize?: number // in bytes
        acceptedFileTypes?: string[] // e.g., ['image/jpeg', 'image/png', '.pdf']
    }
}

// Props passed to the custom render function
export type CustomFieldRenderProps<T extends FieldValues> = {
    fieldConfig: FieldConfig<T> // The full field configuration
    formControl: Control<T> // react-hook-form's control object
    formRegister: UseFormRegister<T> // react-hook-form's register function
    formWatch: UseFormWatch<T> // react-hook-form's watch function
    formErrors: FieldErrors<T> // react-hook-form's errors object
    formSetValue: UseFormSetValue<T> // react-hook-form's setValue function
    formGetValues: UseFormGetValues<T> // react-hook-form's getValues function
    mode: FormMode
    isNonEditable: boolean // Combined disabled/readOnly status for the field
    currentValues: T // Current form values
}

type FormProps<T extends FieldValues> = {
    schema: any
    fields: FieldConfig<T>[]
    defaultValues?: Partial<T>
    onSubmit: SubmitHandler<T>
    onDelete?: SubmitHandler<T> // Specific handler for delete mode
    submitLabel?: string
    title?: string
    description?: string
    mode: FormMode // 'create', 'update', or 'delete'
    loading?: boolean
}

export type { FieldConfig, FormProps }
