import {Controller, FieldValues, UseFormReturn, useWatch} from "react-hook-form";
import {JSX, memo, useMemo} from "react";
import {FieldConfig} from "@/app/components/form-builder/type";
import {Label} from "@/components/ui/label";
import {FileUploadInput} from "@/app/components/file-upload";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";
import {cn} from "@/lib/utils";
import {FileWithCrop} from "@/app/components/file-upload/components/file-upload";


type FieldItemProps<T extends FieldValues> = {
    field: FieldConfig<T>;
    rf: UseFormReturn<T>;
    mode: "create" | "update" | "delete";
};

export const FieldItem = memo(function FieldItem<T extends FieldValues>({field, rf, mode}: FieldItemProps<T>) {
    const {register, control, formState: {errors}} = rf;
    const deps = useMemo(() => field.deps ?? [], [field.deps]);

    const depValuesArray = useWatch({control, name: deps.length ? deps : []});

    const depValues = useMemo(() => {
        if (!deps.length) return {};
        const obj: Record<string, unknown> = {};
        deps.forEach((name, i) => (obj[name as string] = Array.isArray(depValuesArray) ? depValuesArray[i] : undefined));
        return obj as Partial<T>;
    }, [depValuesArray, deps]);

    const hidden = field.hidden?.(depValues, mode) ?? false;
    if (hidden) return null;

    const isFieldNonEditable =
        mode === "delete" ||
        field.disabled?.(depValues, mode) ||
        (field.readOnly?.(depValues, mode) && mode === "update");

    const colSpanClasses = cn(
        TailwindGridSpan.mobile[(field.colSpan?.mobile ?? 12) - 1],
        TailwindGridSpan.tablet[(field.colSpan?.tablet ?? 12) - 1],
        TailwindGridSpan.desktop[(field.colSpan?.desktop ?? 12) - 1],
    )

    const commonProps = {
        id: String(field.name),
        placeholder: field.placeholder,
        disabled: isFieldNonEditable,
    };

    let inputComponent: JSX.Element;
    switch (field.type) {
        case "text":
        case "email":
        case "number":
        case "password":
            inputComponent = <Input {...register(field.name)} type={field.type} {...commonProps} />
            break
        case "textarea":
            inputComponent = <Textarea {...register(field.name)} {...commonProps} />
            break
        case "checkbox":
            inputComponent = (
                <Controller
                    name={field.name}
                    control={control}
                    render={({field: controllerField}) => (
                        <Checkbox
                            id={String(field.name)}
                            {...controllerField}
                            checked={controllerField.value as boolean}
                            onCheckedChange={controllerField.onChange}
                            disabled={isFieldNonEditable}
                        />
                    )}
                />
            )
            break
        case "file":
            inputComponent = (
                <Controller
                    name={field.name}
                    control={control}
                    render={({field: controllerField}) => (
                        <FileUploadInput
                            value={(controllerField.value as FileWithCrop[]) ?? []}
                            onChange={controllerField.onChange}
                            fileConfig={{
                                ...field.fileConfig
                            }}
                            imageConfig={{
                                ...field.imageConfig
                            }}
                            disabled={isFieldNonEditable}
                        />
                    )}
                />
            )
            break
        case "custom":
            inputComponent = (
                <Controller
                    name={field.name}
                    control={control}
                    render={({field: f, fieldState, formState}) => {
                        return field.render({field: f, fieldState, formState})
                    }}
                />
            )
            break
        default:
            inputComponent = <></>
    }

    if (field.type === "checkbox") {
        return (
            <div key={String(field.name)} className={cn("flex items-center space-x-2", colSpanClasses)}>
                {inputComponent}
                <Label htmlFor={String(field.name)}>{field.label}</Label>
                {errors[field.name] && (
                    <p className="text-red-500 text-sm mt-1">{(errors[field.name]?.message as string) || "Lỗi"}</p>
                )}
            </div>
        )
    } else {
        return (
            <div key={String(field.name)} className={cn("grid gap-2", colSpanClasses)}>
                <Label htmlFor={String(field.name)}>{field.label}</Label>
                {inputComponent}
                {errors[field.name] && (
                    <p className="text-red-500 text-sm mt-1">{(errors[field.name]?.message as string) || "Lỗi"}</p>
                )}
            </div>
        )
    }
});


const TailwindGridSpan = {
    mobile: [
        "col-span-1",
        "col-span-2",
        "col-span-3",
        "col-span-4",
        "col-span-5",
        "col-span-6",
        "col-span-7",
        "col-span-8",
        "col-span-9",
        "col-span-10",
        "col-span-11",
        "col-span-12"
    ],
    tablet: [
        "md:col-span-1",
        "md:col-span-2",
        "md:col-span-3",
        "md:col-span-4",
        "md:col-span-5",
        "md:col-span-6",
        "md:col-span-7",
        "md:col-span-8",
        "md:col-span-9",
        "md:col-span-10",
        "md:col-span-11",
        "md:col-span-12"
    ],
    desktop: [
        "lg:col-span-1",
        "lg:col-span-2",
        "lg:col-span-3",
        "lg:col-span-4",
        "lg:col-span-5",
        "lg:col-span-6",
        "lg:col-span-7",
        "lg:col-span-8",
        "lg:col-span-9",
        "lg:col-span-10",
        "lg:col-span-11",
        "lg:col-span-12"
    ]
}