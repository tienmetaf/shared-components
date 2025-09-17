"use client"

import React, {useState} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {UploadCloud, Loader2, Link, Plus} from "lucide-react"
import {cn} from "@/lib/utils"
import {FileUploadConstants} from "@/app/components/file-upload/constants"
import {Input} from "@/components/ui/input"
import {toast} from "sonner"

interface DropZoneProps {
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    onBrowseClick: () => void
    onUrlSubmit?: (url: string) => void
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
                             onUrlSubmit,
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
    const [imageUrl, setImageUrl] = useState('')

    const handleUrlSubmit = () => {
        if (!imageUrl.trim()) {
            toast.error("Please enter a valid URL")
            return
        }

        if (onUrlSubmit) {
            onUrlSubmit(imageUrl.trim())
            setImageUrl('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleUrlSubmit()
        }
    }

    return (
        <>
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
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    ) : (
                        <UploadCloud className="h-8 w-8 text-muted-foreground"/>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                        {loading ? FileUploadConstants.text.loadingUpload : FileUploadConstants.text.dropOrBrowse}
                    </p>

                    <div className="flex flex-col md:flex-row gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-transparent"
                            onClick={onBrowseClick}
                            disabled={disabled || loading || (isLimitReached && !isSingleFile)}
                        >
                            {FileUploadConstants.text.browseFiles}
                        </Button>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple={!isSingleFile}
                        accept={acceptedFileTypes?.join(",")}
                        disabled={disabled || loading}
                    />

                    <div className="mt-3 text-xs text-muted-foreground">
                  <span className={cn(
                      "transition-colors duration-200",
                      isLimitReached && "text-destructive font-medium"
                  )}>
                    {FileUploadConstants.text.selectedFiles(fileCount, maxFiles)}
                  </span>
                    </div>
                </CardContent>
            </Card>
            <div className="flex gap-2 mt-4 w-full">
                <Input
                    type="url"
                    placeholder="Paste image URL here"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow"
                    disabled={disabled || loading}
                />
                <Button
                    onClick={handleUrlSubmit}
                    type={"button"}
                    disabled={disabled || loading || !imageUrl.trim()}
                >
                    <Plus className="h-4 w-4"/>
                </Button>
            </div>
        </>
    )
}