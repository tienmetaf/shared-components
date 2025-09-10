"use client"
import {type DefaultValues, type FieldValues, useForm, UseFormReturn} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import type {FieldConfig, FormProps} from "@/app/components/form-builder/type"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {FieldItem} from "@/app/components/form-builder/FieldItem";

export function FormBuilder<T extends FieldValues>({
                                                       schema,
                                                       fields,
                                                       defaultValues,
                                                       onSubmit,
                                                       onDelete,
                                                       submitLabel,
                                                       title,
                                                       description,
                                                       mode
                                                   }: FormProps<T>) {
    const useFormReturn = useForm<T>({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as DefaultValues<T>,
    })

    const { handleSubmit } = useFormReturn

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
                <form onSubmit={formSubmitHandler} className="grid grid-cols-12 gap-4">
                    {fields.map((f) => (
                        <FieldItem
                            key={f.name}
                            field={f as FieldConfig<FieldValues>}
                            rf={useFormReturn as UseFormReturn<FieldValues, unknown, FieldValues>}
                            mode={mode}
                        />
                    ))}
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
