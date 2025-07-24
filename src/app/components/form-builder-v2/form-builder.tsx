"use client"

import { useCallback, useMemo } from "react"
import { type DefaultValues, type FieldValues, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FieldConfig, FormProps } from "./types"
import { TextField, CheckboxField, TextareaField, FileField } from "./fields"

export function FormBuilder<T extends FieldValues>({
                                                       schema,
                                                       fields,
                                                       defaultValues,
                                                       onSubmit,
                                                       onDelete,
                                                       onCancel,
                                                       submitLabel,
                                                       cancelLabel = "Cancel",
                                                       title,
                                                       description,
                                                       mode,
                                                       loading = false,
                                                       className,
                                                       fieldClassName,
                                                       validationMode
                                                   }: FormProps<T>) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        control,
        setValue,
        getValues
    } = useForm<T>({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as DefaultValues<T>,
        mode: validationMode || "onBlur"
    })

    // Only watch the fields that are used in conditional logic
    const fieldsWithConditions = useMemo(() => {
        return fields.filter(
            field => field.hidden || field.disabled || field.readOnly
        ).map(field => String(field.name))
    }, [fields])

    const watchedValues = watch(fieldsWithConditions.length ? fieldsWithConditions : undefined)

    // Determine the effective submit label based on mode
    const effectiveSubmitLabel = useMemo(() => {
        if (submitLabel) return submitLabel

        switch (mode) {
            case "create": return "Create"
            case "update": return "Update"
            case "delete": return "Delete"
            default: return "Submit"
        }
    }, [submitLabel, mode])

    // Determine the form submission handler
    const formSubmitHandler = useCallback(
        mode === "delete" && onDelete ? handleSubmit(onDelete) : handleSubmit(onSubmit),
        [handleSubmit, onSubmit, onDelete, mode]
    )

    // Render a field based on its configuration
    const renderField = useCallback((field: FieldConfig<T>) => {
        // Check if field should be hidden based on current values and mode
        if (field.hidden?.(watchedValues as T, mode)) return null

        // Determine if the field should be non-editable
        const isFieldNonEditable =
            mode === "delete" ||
            field.disabled?.(watchedValues as T, mode) ||
            (field.readOnly?.(watchedValues as T, mode) && mode === "update") ||
            loading ||
            isSubmitting

        // Calculate responsive column span classes
        const colSpanClasses = cn(
            field.colSpan?.mobile ? `col-span-${field.colSpan.mobile}` : "col-span-1",
            field.colSpan?.tablet ? `md:col-span-${field.colSpan.tablet}` : "md:col-span-1",
            field.colSpan?.desktop ? `lg:col-span-${field.colSpan.desktop}` : "lg:col-span-1",
            fieldClassName
        )

        // Render the appropriate field component based on field type
        switch (field.type) {
            case "text":
            case "email":
            case "number":
            case "password":
                return (
                    <TextField
                        key={String(field.name)}
                        fieldConfig={field}
                        register={register}
                        errors={errors}
                        isNonEditable={isFieldNonEditable}
                        className={colSpanClasses}
                    />
                )

            case "textarea":
                return (
                    <TextareaField
                        key={String(field.name)}
                        fieldConfig={field}
                        register={register}
                        errors={errors}
                        isNonEditable={isFieldNonEditable}
                        className={colSpanClasses}
                    />
                )

            case "checkbox":
                return (
                    <CheckboxField
                        key={String(field.name)}
                        fieldConfig={field}
                        control={control}
                        register={register}
                        errors={errors}
                        isNonEditable={isFieldNonEditable}
                        className={colSpanClasses}
                    />
                )

            case "file":
                return (
                    <FileField
                        key={String(field.name)}
                        fieldConfig={field}
                        control={control}
                        register={register}
                        errors={errors}
                        isNonEditable={isFieldNonEditable}
                        className={colSpanClasses}
                    />
                )

            case "custom":
                if (field.customRender) {
                    return (
                        <div key={String(field.name)} className={colSpanClasses}>
                            {field.customRender({
                                fieldConfig: field,
                                formControl: control,
                                formRegister: register,
                                formWatch: watch,
                                formErrors: errors,
                                formSetValue: setValue,
                                formGetValues: getValues,
                                mode,
                                isNonEditable: isFieldNonEditable,
                                currentValues: watchedValues as T
                            })}
                        </div>
                    )
                }
                return null

            default:
                return null
        }
    }, [
        watch, watchedValues, mode, loading, isSubmitting,
        register, control, errors, setValue, getValues, fieldClassName
    ])

    return (
        <Card className={cn("w-full max-w-2xl mx-auto", className)}>
            {title && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </CardHeader>
            )}
            <CardContent>
                <form onSubmit={formSubmitHandler} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fields.map(renderField)}
                    <div className="col-span-full flex justify-end gap-2 mt-4">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading || isSubmitting}
                            >
                                {cancelLabel}
                            </Button>
                        )}
                        <Button
                            type="submit"
                            variant={mode === "delete" ? "destructive" : "default"}
                            disabled={loading || isSubmitting}
                        >
                            {loading || isSubmitting ? "Đang xử lý..." : effectiveSubmitLabel}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}