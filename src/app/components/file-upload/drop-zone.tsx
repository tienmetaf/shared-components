"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UploadCloud, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropZoneProps {
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    onBrowseClick: () => void
    fileCount: number
    maxFiles: number
    isDraggingOver: boolean
    isLimitReached: boolean
    isSingleFile: boolean
    loading?: boolean
    disabled?: boolean
    showLimitTooltip: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
    acceptedFileTypes?: string[]
    onMouseEnter: () => void
    onMouseLeave: () => void
}

export function DropZone({
                             onDragOver,
                             onDragLeave,
                             onDrop,
                             onBrowseClick,
                             fileCount,
                             maxFiles,
                             isDraggingOver,
                             isLimitReached,
                             isSingleFile,
                             loading,
                             disabled,
                             showLimitTooltip,
                             fileInputRef,
                             acceptedFileTypes,
                             onMouseEnter,
                             onMouseLeave
                         }: DropZoneProps) {
    return (
        <Card
            className={cn(
                "border-2 border-dashed shadow-none transition-all duration-200 w-full",
                isDraggingOver && !isLimitReached ? "border-primary bg-primary/5" : "border-muted-foreground/20",
                (disabled || loading) && "opacity-50 cursor-not-allowed",
                showLimitTooltip && "border-destructive bg-destructive/10"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                    {loading ? "Processing files..." : "Drag & drop files here or"}
                </p>
                <Button
                    type="button"
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={onBrowseClick}
                    disabled={disabled || loading || (isLimitReached && !isSingleFile)}
                >
                    Browse Files
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple={!isSingleFile}
                    accept={acceptedFileTypes?.join(",")}
                    disabled={disabled || loading}
                />

                {/* File count display */}
                <div className="mt-3 text-xs text-muted-foreground">
          <span className={cn(
              "transition-colors duration-200",
              isLimitReached && "text-destructive font-medium"
          )}>
            Selected {fileCount} / {maxFiles} files
          </span>
                </div>
            </CardContent>
        </Card>
    )
}