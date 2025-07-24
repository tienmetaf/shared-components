"use client"

import type React from "react"
import {useState, useCallback, useRef, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {X, UploadCloud, FileText, Loader2, GripVertical} from "lucide-react"
import Image from "next/image"
import {useFileUpload, type FilePreview} from "./use-file-upload"
import {cn} from "@/lib/utils"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent, TouchSensor,
} from "@dnd-kit/core"
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import {arrayMove} from "@dnd-kit/sortable"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"

interface FileUploadInputProps {
    value: File[] // Controlled component: current files
    onChange: (files: File[]) => void // Callback to update parent's files state
    maxFiles?: number
    maxFileSize?: number // in bytes
    acceptedFileTypes?: string[] // e.g., ['image/jpeg', 'image/png', '.pdf']
    disabled?: boolean
    loading?: boolean // For external upload process (e.g., API call)
    className?: string
}

interface SortableItemProps {
    file: File
    preview: FilePreview | undefined
    onRemove: (file: File) => void
    disabled?: boolean
    onFileClick: (file: File, preview: FilePreview | undefined) => void
    isDragging?: boolean
}

// Component for individual sortable file item
function SortableItem({file, preview, onRemove, onFileClick, disabled}: SortableItemProps) {
    // Use file.name + file.size + file.lastModified as a unique ID for dnd-kit
    const id = `${file.name}-${file.size}-${file.lastModified}`
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id})

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    // Prevent click when dragging
    const handleFileClick = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault()
            e.stopPropagation()
            return
        }
        if (preview?.type === "image") {
            onFileClick(file, preview)
        }
    }, [isDragging, preview, file, onFileClick])

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
            <button
                type="button"
                {...listeners}
                {...attributes}
                className={cn(
                    "cursor-grab p-3 flex-shrink-0 hover:bg-muted select-none",
                    "touch-none", // Prevent default touch behaviors
                    disabled && "cursor-not-allowed opacity-50",
                    isDragging && "cursor-grabbing"
                )}
                style={{
                    touchAction: 'none', // Prevent scrolling, zooming, etc.
                }}
                disabled={disabled}
                aria-label="Reorder file"
                data-dnd-handle="true" // Mark as drag handle for touch detection
            >
                <GripVertical className="w-4 h-4 text-muted-foreground"/>
            </button>

            <div
                className={cn(
                    "flex items-center gap-2 flex-grow min-w-0",
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
                        <FileText className="w-6 h-6 text-muted-foreground"/>
                    </div>
                )}

                <div className="flex-1 min-w-0 px-2 py-2">
                    <div className="truncate text-sm font-medium" title={file.name}>
                        {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                </div>
            </div>

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove(file)
                }}
                className="flex-shrink-0 h-full rounded-none px-3 border-l hover:bg-muted"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
            >
                <X className="w-4 h-4"/>
            </Button>
        </div>
    )
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
                                                                    value,
                                                                    onChange,
                                                                    maxFiles,
                                                                    maxFileSize,
                                                                    acceptedFileTypes,
                                                                    disabled,
                                                                    loading,
                                                                    className,
                                                                }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const [selectedFileForPreview, setSelectedFileForPreview] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isDraggingItem, setIsDraggingItem] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    // Use the custom hook to handle file validation and preview generation
    const {filePreviews, errors, validateAndProcessFiles, revokeObjectURL} = useFileUpload(value, {
        maxFileSize,
        acceptedFileTypes,
    })

    // Dnd-kit sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before starting drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100, // Shorter delay for better responsiveness
                tolerance: 15, // Larger tolerance for finger touch
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    // Handle drag over event for styling
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingOver(true)
    }, [])

    // Handle drag leave event for styling
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingOver(false)
    }, [])

    // Handle file drop event
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDraggingOver(false)

            if (disabled || loading) return

            const filesToProcess = e.dataTransfer.files
            if (filesToProcess.length === 0) return

            const {validFiles, newErrors} = validateAndProcessFiles(filesToProcess)

            // Combine existing files with new valid files
            let updatedFiles = [...value, ...validFiles]

            // Handle maxFiles limit
            if (maxFiles && updatedFiles.length > maxFiles) {
                updatedFiles = updatedFiles.slice(0, maxFiles)
            }

            onChange(updatedFiles)
        },
        [disabled, loading, validateAndProcessFiles, value, maxFiles, onChange],
    )

    // Handle file selection via input
    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (disabled || loading) return

            const filesToProcess = e.target.files
            if (!filesToProcess) return

            const {validFiles, newErrors} = validateAndProcessFiles(filesToProcess)

            let updatedFiles = [...value, ...validFiles]

            if (maxFiles && updatedFiles.length > maxFiles) {
                updatedFiles = updatedFiles.slice(0, maxFiles)
            }

            onChange(updatedFiles)

            // Clear the input value to allow selecting the same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        },
        [disabled, loading, validateAndProcessFiles, value, maxFiles, onChange],
    )

    // Handle file removal
    const handleRemoveFile = useCallback(
        (fileToRemove: File) => {
            if (disabled || loading) return
            const updatedFiles = value.filter((file) => file !== fileToRemove)
            // Revoke the object URL for the removed file's preview
            const preview = filePreviews.get(fileToRemove)
            if (preview && preview.url) {
                revokeObjectURL(preview.url)
            }
            onChange(updatedFiles)
        },
        [value, onChange, disabled, loading, filePreviews, revokeObjectURL],
    )

    // Handle drag start
    const handleDragStart = useCallback(() => {
        setIsDraggingItem(true)
        // Close dialog if open and cleanup URL
        if (selectedFileForPreview && previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        setSelectedFileForPreview(null)
    }, [selectedFileForPreview, previewUrl])

    // Handle drag end for reordering files
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setIsDraggingItem(false)
            const {active, over} = event

            if (active.id !== over?.id) {
                const oldIndex = value.findIndex((file) => `${file.name}-${file.size}-${file.lastModified}` === active.id)
                const newIndex = value.findIndex((file) => `${file.name}-${file.size}-${file.lastModified}` === over?.id)

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newFiles = arrayMove(value, oldIndex, newIndex)
                    onChange(newFiles)
                }
            }
        },
        [value, onChange],
    )

    const handleFileClick = useCallback((file: File, preview: FilePreview | undefined) => {
        // Don't open dialog if we're dragging
        if (isDraggingItem) return

        if (preview && preview.type === "image") {
            // Create a fresh object URL for the dialog
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
                setSelectedFileForPreview(file)
            }
        }
    }, [isDraggingItem])

    // Generate unique IDs for dnd-kit items based on file properties
    const sortableItems = value.map((file) => `${file.name}-${file.size}-${file.lastModified}`)

    return (
        <div className={cn("w-full max-w-full overflow-hidden", className)}>
            <Card
                className={cn(
                    "border-2 border-dashed shadow-none transition-colors w-full",
                    isDraggingOver ? "border-primary bg-primary/5" : "border-muted-foreground/20",
                    (disabled || loading) && "opacity-50 cursor-not-allowed",
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    ) : (
                        <UploadCloud className="h-8 w-8 text-muted-foreground"/>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                        {loading ? "Processing files..." : "Drag & drop files here or"}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || loading}
                    >
                        Browse Files
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple={maxFiles === 1 ? false : true} // Allow multiple if maxFiles > 1
                        accept={acceptedFileTypes?.join(",")}
                        disabled={disabled || loading}
                    />
                </CardContent>
            </Card>

            {errors.length > 0 && (
                <div className="mt-2 w-full">
                    {errors.map((error, index) => (
                        <p key={index} className="text-sm text-destructive">
                            {error}
                        </p>
                    ))}
                </div>
            )}

            {value.length > 0 && (
                <div className="mt-2 space-y-2 w-full max-w-full">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
                            <div
                                className="space-y-2"
                                style={{touchAction: 'pan-y'}} // Allow vertical scrolling but prevent horizontal pan
                            >
                                {value.map((file) => (
                                    <SortableItem
                                        key={`${file.name}-${file.size}-${file.lastModified}`}
                                        file={file}
                                        preview={filePreviews.get(file)}
                                        onRemove={handleRemoveFile}
                                        onFileClick={handleFileClick}
                                        disabled={disabled || loading}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            <Dialog
                open={!!selectedFileForPreview}
                onOpenChange={(open) => {
                    if (!open) {
                        // Cleanup URL when closing dialog
                        if (previewUrl) {
                            URL.revokeObjectURL(previewUrl)
                            setPreviewUrl(null)
                        }
                        setSelectedFileForPreview(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedFileForPreview?.name}</DialogTitle>
                        <DialogDescription>
                            Size: {selectedFileForPreview ? (selectedFileForPreview.size / (1024 * 1024)).toFixed(2) : 0} MB
                            {selectedFileForPreview?.type && ` | Type: ${selectedFileForPreview.type}`}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedFileForPreview?.type.startsWith('image/') && previewUrl ? (
                        <div className="relative w-full h-auto max-h-[70vh] overflow-hidden flex items-center justify-center bg-muted rounded-md">
                            <Image
                                src={previewUrl}
                                alt={selectedFileForPreview.name}
                                width={500}
                                height={400}
                                style={{maxWidth: "100%", maxHeight: "70vh", objectFit: "contain"}}
                                className="rounded-md"
                                unoptimized
                                onError={() => {
                                    console.error('Image load error for:', selectedFileForPreview.name)
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-md text-muted-foreground">
                            <FileText className="w-16 h-16 mb-4"/>
                            <p className="text-lg font-medium">No preview available for this file type.</p>
                            <p className="text-sm">File Name: {selectedFileForPreview?.name}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}