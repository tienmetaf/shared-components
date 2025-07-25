"use client"

import React from 'react'
import { Controller } from 'react-hook-form'
import type { FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/label'

import type { TreeFieldConfig, SortableTreeFieldConfig, TreeRenderProps, SortableTreeRenderProps } from './types'
import {SortableTree} from "@/app/components/tree/sortable-tree";
import {Tree} from "@/app/components/tree/tree";

interface TreeFieldProps<T extends FieldValues> {
    fieldConfig: TreeFieldConfig<T>
    formControl: any
    formErrors: any
}

interface SortableTreeFieldProps<T extends FieldValues> {
    fieldConfig: SortableTreeFieldConfig<T>
    formControl: any
    formErrors: any
}

export function TreeField<T extends FieldValues>({
                                                     fieldConfig,
                                                     formControl,
                                                     formErrors,
                                                 }: TreeFieldProps<T>) {
    return (
        <div className="space-y-2">
            <Label htmlFor={String(fieldConfig.name)}>{fieldConfig.label}</Label>

            <Controller
                name={fieldConfig.name}
                control={formControl}
                render={({ field }) => (
                    <Tree
                        data={fieldConfig.data}
                        config={fieldConfig.config}
                        selectedValues={field.value || []}
                        onSelectionChange={field.onChange}
                        className="border rounded-md p-2"
                    />
                )}
            />

            {formErrors[fieldConfig.name] && (
                <p className="text-red-500 text-sm">
                    {formErrors[fieldConfig.name]?.message || "Error"}
                </p>
            )}
        </div>
    )
}

export function SortableTreeField<T extends FieldValues>({
                                                             fieldConfig,
                                                             formControl,
                                                             formErrors,
                                                         }: SortableTreeFieldProps<T>) {
    return (
        <div className="space-y-2">
            <Label htmlFor={String(fieldConfig.name)}>{fieldConfig.label}</Label>

            <Controller
                name={fieldConfig.name}
                control={formControl}
                render={({ field }) => (
                    <SortableTree
                        data={field.value || fieldConfig.data}
                        config={fieldConfig.config}
                        onDataChange={field.onChange}
                        className="border rounded-md p-2"
                    />
                )}
            />

            {formErrors[fieldConfig.name] && (
                <p className="text-red-500 text-sm">
                    {formErrors[fieldConfig.name]?.message || "Error"}
                </p>
            )}
        </div>
    )
}