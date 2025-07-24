"use client";

import React from "react";
import { DefaultValues, FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProps } from "@/app/components/form-builder/type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormBuilder<T extends FieldValues>({
                                                schema,
                                                fields,
                                                defaultValues,
                                                onSubmit,
                                                submitLabel = "Submit",
                                                title,
                                                description,
                                            }: FormProps<T>) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<T>({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as DefaultValues<T>,
    });

    const values = watch();

    const renderField = (field: typeof fields[number]) => {
        if (field.hidden?.(values)) return null;

        const isDisabled = field.disabled?.(values);
        const colSpanClasses = cn(
            field.colSpan?.mobile ? `col-span-${field.colSpan.mobile}` : "col-span-1",
            field.colSpan?.tablet ? `md:col-span-${field.colSpan.tablet}` : "md:col-span-1",
            field.colSpan?.desktop ? `lg:col-span-${field.colSpan.desktop}` : "lg:col-span-1"
        );

        return (
            <div key={String(field.name)} className={cn("grid gap-2", colSpanClasses)}>
                <Label htmlFor={String(field.name)}>{field.label}</Label>
                <Input
                    id={String(field.name)}
                    {...register(field.name as any)}
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled={isDisabled}
                />
                {errors[field.name] && (
                    <p className="text-red-500 text-sm mt-1">
                        {(errors[field.name]?.message as string) || "Lỗi"}
                    </p>
                )}
            </div>
        );
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            {title && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </CardHeader>
            )}
            <CardContent>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {fields.map(renderField)}
                    <div className="col-span-full flex justify-end mt-4">
                        <Button type="submit">{submitLabel}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}