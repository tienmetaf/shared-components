import type { SubmitHandler } from "react-hook-form"

export type FormMode = "create" | "update" | "delete"

type FieldConfig<T> = {
    name: keyof T
    label: string
    type: "text" | "email" | "number" | "password" | "checkbox" | "textarea"
    placeholder?: string
    hidden?: (values: T, mode: FormMode) => boolean
    disabled?: (values: T, mode: FormMode) => boolean
    readOnly?: (values: T, mode: FormMode) => boolean // New property for non-editable fields
    colSpan?: {
        mobile?: number // e.g., 1 (col-span-1)
        tablet?: number // e.g., 2 (md:col-span-2)
        desktop?: number // e.g., 3 (lg:col-span-3)
    }
}

type FormProps<T> = {
    schema: any
    fields: FieldConfig<T>[]
    defaultValues?: Partial<T>
    onSubmit: SubmitHandler<T>
    onDelete?: SubmitHandler<T> // Specific handler for delete mode
    submitLabel?: string
    title?: string
    description?: string
    mode: FormMode // 'create', 'update', or 'delete'
}

export type { FieldConfig, FormProps }
