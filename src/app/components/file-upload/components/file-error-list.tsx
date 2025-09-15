"use client"

import React from "react"
import { AlertCircle } from "lucide-react"

interface FileErrorListProps {
    errors: string[]
}

export function FileErrorList({ errors }: FileErrorListProps) {
    if (errors.length === 0) return null

    return (
        <div className="mt-3 w-full space-y-1">
            {errors.map((error, index) => (
                <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md"
                >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            ))}
        </div>
    )
}