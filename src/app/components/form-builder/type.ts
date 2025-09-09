import type {
    ControllerFieldState,
    ControllerRenderProps,
    FieldValues,
    Path,
    SubmitHandler,
    UseFormStateReturn
} from "react-hook-form"
import {ReactElement} from "react";

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

type BasicFieldType = "text" | "email" | "number" | "password" | "checkbox" | "textarea"

type BasicFieldConfig<T extends FieldValues> = CommonFieldConfig<T> & {
    type: BasicFieldType
}

type FileFieldConfig<T extends FieldValues> = CommonFieldConfig<T> & {
    type: "file"
    fileConfig: {
        maxFiles?: number
        maxFileSize?: number // in bytes
        acceptedFileTypes?: string[]
    }
}

type FieldConfig<T extends FieldValues> = BasicFieldConfig<T> | FileFieldConfig<T> | CustomFieldConfig<T>

type CustomFieldConfig<T extends FieldValues> = CommonFieldConfig<T> & {
    type: "custom"
    render: ({field, fieldState, formState,}: {
        field: ControllerRenderProps<T, Path<T>>;
        fieldState: ControllerFieldState;
        formState: UseFormStateReturn<T>;
    }) => ReactElement
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
