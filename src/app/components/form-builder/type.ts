import type {
    Control,
    FieldErrors,
    FieldValues, Path,
    SubmitHandler,
    UseFormGetValues,
    UseFormRegister, UseFormSetValue,
    UseFormWatch
} from "react-hook-form"

export type FormMode = "create" | "update" | "delete"

type CommonFieldConfig<T extends FieldValues> = {
    name: Path<T>
    label: string
    placeholder?: string
    hidden?: (values: T, mode: FormMode) => boolean
    disabled?: (values: T, mode: FormMode) => boolean
    readOnly?: (values: T, mode: FormMode) => boolean
    colSpan?: {
        mobile?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
        tablet?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
        desktop?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    }
}

type BasicFieldType = "text" | "email" | "number" | "password" | "checkbox" | "textarea" | "custom"

type BasicFieldConfig<T extends FieldValues> = CommonFieldConfig<T> & {
    type: BasicFieldType
    fileConfig?: never
}

type FileFieldConfig<T extends FieldValues> = CommonFieldConfig<T> & {
    type: "file"
    fileConfig: {
        maxFiles?: number
        maxFileSize?: number // in bytes
        acceptedFileTypes?: string[]
    }
}

type FieldConfig<T extends FieldValues> = BasicFieldConfig<T> | FileFieldConfig<T>

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
