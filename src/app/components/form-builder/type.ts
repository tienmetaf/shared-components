import {SubmitHandler} from "react-hook-form";

type FieldConfig<T> = {
    name: keyof T;
    label: string;
    type: 'text' | 'email' | 'number' | 'password';
    placeholder?: string;
    hidden?: (values: T) => boolean;
    disabled?: (values: T) => boolean;
    colSpan?: {
        mobile?: number // e.g., 1 (col-span-1)
        tablet?: number // e.g., 2 (md:col-span-2)
        desktop?: number // e.g., 3 (lg:col-span-3)
    }
};

type FormProps<T > = {
    schema: any;
    fields: FieldConfig<T>[];
    defaultValues?: Partial<T>;
    onSubmit: SubmitHandler<T>;
    submitLabel?: string;
    title?: string
    description?: string
};

export type { FieldConfig, FormProps };