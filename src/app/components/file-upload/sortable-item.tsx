"use client"

import React, { useCallback } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Image from "next/image"
import { FileText, GripVertical, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { type FilePreview } from "./hooks/use-file-upload"

interface SortableItemProps {
    file: File
    preview: FilePreview | undefined
    onRemove: (file: File) => void
    disabled?: boolean
    onFileClick: (file: File, preview: FilePreview | undefined) => void
    isDragging?: boolean
}

export function SortableItem({
                                 file,
                                 preview,
                                 onRemove,
                                 onFileClick,
                                 disabled
                             }: SortableItemProps) {
    // Use file.name + file.size + file.lastModified as a unique ID for dnd-kit
    const id = `${file.name}-${file.size}-${file.lastModified}`
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    // Prevent click when dragging
    const handleFileClick = useCallback(
        (e: React.MouseEvent) => {
            if (isDragging) {
                e.preventDefault()
                e.stopPropagation()
                return
            }
            if (preview?.type === "image") {
                onFileClick(file, preview)
            }
        },
        [isDragging, preview, file, onFileClick]
    )

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center border rounded-md bg-background w-full max-w-full overflow-hidden",
                "select-none", // Prevent text selection during drag
                isDragging && "opacity-50 z-50"
            )}
        >
            <Button
                type="button"
                variant="ghost"
                size="default"
                {...listeners}
                {...attributes}
                className={cn(
                    "cursor-grab mx-1 flex-shrink-0 hover:bg-muted select-none",
                    "touch-none",
                    disabled && "cursor-not-allowed opacity-50",
                    isDragging && "cursor-grabbing"
                )}
                disabled={disabled}
                aria-label="Reorder file"
                data-dnd-handle="true"
            >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </Button>

            <div
                className={cn(
                    "flex items-center gap-2 flex-grow min-w-0 py-2",
                    preview?.type === "image" && !isDragging && "cursor-pointer"
                )}
                onClick={handleFileClick}
            >
                {preview?.type === "image" && preview.url ? (
                    <div className="flex-shrink-0 w-12 h-12">
                        <Image
                            src={preview.url || "/placeholder.svg"}
                            alt={file.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded-md"
                        />
                    </div>
                ) : (
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                )}

                <div className="flex-1 min-w-0 pr-1">
                    <div className="truncate text-sm font-medium" title={file.name}>
                        {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                </div>
            </div>

            <Separator orientation="vertical" className="min-h-8" />

            <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove(file)
                }}
                className="flex-shrink-0 px-2 mx-1 hover:bg-red-500 hover:text-white"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
            >
                <Trash className="w-5 h-5" />
            </Button>
        </div>
    )
}