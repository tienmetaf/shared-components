"use client"
import { type DefaultValues, type FieldValues, useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { FormProps } from "@/app/components/form-builder/type"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";

export function FormBuilder<T extends FieldValues>({
                                                       schema,
                                                       fields,
                                                       defaultValues,
                                                       onSubmit,
                                                       onDelete,
                                                       submitLabel,
                                                       title,
                                                       description,
                                                       mode,
                                                   }: FormProps<T>) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        control,
    } = useForm<T>({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as DefaultValues<T>,
    })

    const values = watch()

    const renderField = (field: (typeof fields)[number]) => {
        // Check if field should be hidden based on current values and mode
        if (field.hidden?.(values, mode)) return null

        // Determine if the field should be non-editable (disabled)
        // All fields are disabled in 'delete' mode
        // Fields can be disabled if explicitly configured via field.disabled
        // Fields can be disabled if explicitly configured via field.readOnly in 'update' mode
        const isFieldNonEditable =
            mode === "delete" || field.disabled?.(values, mode) || (field.readOnly?.(values, mode) && mode === "update")

        const colSpanClasses = cn(
            field.colSpan?.mobile ? `col-span-${field.colSpan.mobile}` : "col-span-1",
            field.colSpan?.tablet ? `md:col-span-${field.colSpan.tablet}` : "md:col-span-1",
            field.colSpan?.desktop ? `lg:col-span-${field.colSpan.desktop}` : "lg:col-span-1",
        )

        let inputComponent
        const commonProps = {
            id: String(field.name),
            placeholder: field.placeholder,
            disabled: isFieldNonEditable,
        }

        switch (field.type) {
            case "text":
            case "email":
            case "number":
            case "password":
                inputComponent = <Input {...register(field.name as any)} type={field.type} {...commonProps} />
                break
            case "textarea":
                inputComponent = <Textarea {...register(field.name as any)} {...commonProps} />
                break
            case "checkbox":
                inputComponent = (
                    <Controller
                        name={field.name as any}
                        control={control}
                        render={({ field: controllerField }) => (
                            <Checkbox
                                {...controllerField}
                                checked={controllerField.value as boolean}
                                onCheckedChange={controllerField.onChange}
                                disabled={isFieldNonEditable}
                            />
                        )}
                    />
                )
                break
            default:
                inputComponent = null
        }

        // Special rendering for checkbox to place label next to it
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
    }

    // Determine the effective submit label
    let effectiveSubmitLabel = submitLabel
    if (!effectiveSubmitLabel) {
        if (mode === "create") effectiveSubmitLabel = "Create"
        else if (mode === "update") effectiveSubmitLabel = "Update"
        else if (mode === "delete") effectiveSubmitLabel = "Delete"
        else effectiveSubmitLabel = "Submit"
    }

    // Determine the form submission handler
    const formSubmitHandler = mode === "delete" && onDelete ? handleSubmit(onDelete) : handleSubmit(onSubmit)

    return (
        <Card className="w-full max-w-2xl mx-auto">
            {title && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </CardHeader>
            )}
            <CardContent>
                <form onSubmit={formSubmitHandler} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fields.map(renderField)}
                    <div className="col-span-full flex justify-end mt-4">
                        <Button type="submit" variant={mode === "delete" ? "destructive" : "default"}>
                            {effectiveSubmitLabel}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
