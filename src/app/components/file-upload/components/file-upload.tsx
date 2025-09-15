"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    TouchSensor,
} from "@dnd-kit/core"
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { arrayMove } from "@dnd-kit/sortable"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useFileUpload, type FilePreview as FilePreviewType } from "../hooks/use-file-upload"
import { useIsMobile } from "../hooks/use-is-mobile"
import { SortableItem } from "./sortable-item"
import { ImageDetail } from "./image-detail"
import { DropZone } from "./drop-zone"
import { FileErrorList } from "./file-error-list"
import { cn } from "@/lib/utils"
import {FileUploadConstants} from "@/app/components/file-upload/constants";

export interface FileUploadInputProps {
    value: File[] // Controlled component: current files
    onChange: (files: File[]) => void // Callback to update parent's files state
    maxFiles?: number
    maxFileSize?: number // in bytes
    acceptedFileTypes?: string[] // e.g., ['image/jpeg', 'image/png', '.pdf']
    disabled?: boolean
    loading?: boolean // For external upload process (e.g., API call)
    className?: string
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
                                                                    value,
                                                                    onChange,
                                                                    maxFiles = 10,
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
    const [showLimitTooltip, setShowLimitTooltip] = useState(false)
    const isMobile = useIsMobile()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isLimitReached = value.length >= maxFiles
    const isSingleFile = maxFiles === 1

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const { filePreviews, errors, validateAndProcessFiles, revokeObjectURL } = useFileUpload(value, {
        maxFileSize,
        acceptedFileTypes,
    })

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

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()

            // Don't allow drop if limit reached and not single file mode
            if (isLimitReached && !isSingleFile) {
                setShowLimitTooltip(true)
                return
            }

            setIsDraggingOver(true)
        },
        [isLimitReached, isSingleFile]
    )

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingOver(false)
        setShowLimitTooltip(false)
    }, [])

    const processFiles = useCallback(
        (filesToProcess: FileList) => {
            if (disabled || loading) return

            const { validFiles } = validateAndProcessFiles(filesToProcess)

            if (isSingleFile) {
                // Replace current file with the first valid file
                if (validFiles.length > 0) {
                    // Revoke existing file preview URLs
                    value.forEach((file) => {
                        const preview = filePreviews.get(file)
                        if (preview?.url) {
                            revokeObjectURL(preview.url)
                        }
                    })
                    onChange([validFiles[0]])
                }
            } else {
                let updatedFiles = [...value, ...validFiles]

                if (updatedFiles.length > maxFiles) {
                    updatedFiles = updatedFiles.slice(0, maxFiles)
                }

                onChange(updatedFiles)
            }
        },
        [
            disabled,
            loading,
            validateAndProcessFiles,
            value,
            maxFiles,
            onChange,
            isSingleFile,
            filePreviews,
            revokeObjectURL,
        ]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDraggingOver(false)
            setShowLimitTooltip(false)

            if (disabled || loading || (isLimitReached && !isSingleFile)) return

            const filesToProcess = e.dataTransfer.files
            if (filesToProcess.length === 0) return

            processFiles(filesToProcess)
        },
        [disabled, loading, isLimitReached, isSingleFile, processFiles]
    )

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (disabled || loading) return

            const filesToProcess = e.target.files
            if (!filesToProcess) return

            processFiles(filesToProcess)

            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        },
        [disabled, loading, processFiles]
    )

    const handleRemoveFile = useCallback(
        (fileToRemove: File) => {
            if (disabled || loading) return

            const updatedFiles = value.filter((file) => file !== fileToRemove)

            const preview = filePreviews.get(fileToRemove)
            if (preview?.url) {
                revokeObjectURL(preview.url)
            }

            onChange(updatedFiles)
        },
        [value, onChange, disabled, loading, filePreviews, revokeObjectURL]
    )

    const handleDragStart = useCallback(() => {
        setIsDraggingItem(true)

        if (selectedFileForPreview && previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }

        setSelectedFileForPreview(null)
    }, [selectedFileForPreview, previewUrl])

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setIsDraggingItem(false)
            const { active, over } = event

            if (active.id !== over?.id) {
                const oldIndex = value.findIndex(
                    (file) => `${file.name}-${file.size}-${file.lastModified}` === active.id
                )
                const newIndex = value.findIndex(
                    (file) => `${file.name}-${file.size}-${file.lastModified}` === over?.id
                )

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newFiles = arrayMove(value, oldIndex, newIndex)
                    onChange(newFiles)
                }
            }
        },
        [value, onChange]
    )

    const handleFileClick = useCallback(
        (file: File, preview: FilePreviewType | undefined) => {
            if (isDraggingItem) return

            if (preview?.type === "image") {
                if (file.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file)
                    setPreviewUrl(url)
                    setSelectedFileForPreview(file)
                }
            }
        },
        [isDraggingItem]
    )

    const handleBrowseClick = useCallback(() => {
        if (disabled || loading || (isLimitReached && !isSingleFile)) return
        fileInputRef.current?.click()
    }, [disabled, loading, isLimitReached, isSingleFile])

    const sortableItems = value.map(
        (file) => `${file.name}-${file.size}-${file.lastModified}`
    )

    const handlePreviewClose = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        setSelectedFileForPreview(null)
    }, [previewUrl])

    const handleMouseEnter = useCallback(() => {
        if (isLimitReached && !isSingleFile) {
            setShowLimitTooltip(true)
        }
    }, [isLimitReached, isSingleFile])

    const getLimitMessage = () => {
        if (isSingleFile) {
            return FileUploadConstants.message.onlyOneFile
        }
        return FileUploadConstants.message.maxFiles(maxFiles)
    }

    return (
        <TooltipProvider>
            <div className={cn("w-full max-w-full overflow-hidden", className)}>
                <Tooltip open={showLimitTooltip && isLimitReached && !isSingleFile}>
                    <TooltipTrigger asChild>
                        <div>
                            <DropZone
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onBrowseClick={handleBrowseClick}
                                fileCount={value.length}
                                maxFiles={maxFiles}
                                isDraggingOver={isDraggingOver}
                                isLimitReached={isLimitReached}
                                isSingleFile={isSingleFile}
                                loading={loading}
                                disabled={disabled}
                                showLimitTooltip={showLimitTooltip}
                                fileInputRef={fileInputRef}
                                acceptedFileTypes={acceptedFileTypes}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={() => setShowLimitTooltip(false)}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple={!isSingleFile}
                                accept={acceptedFileTypes?.join(",")}
                                disabled={disabled || loading}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{getLimitMessage()}</p>
                    </TooltipContent>
                </Tooltip>

                <FileErrorList errors={errors} />

                {value.length > 0 && (
                    <div className="mt-4 space-y-3 w-full max-w-full">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
                                <div
                                    className="space-y-3"
                                    style={{ touchAction: 'pan-y' }}
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

                <ImageDetail
                    file={selectedFileForPreview}
                    previewUrl={previewUrl}
                    isOpen={!!selectedFileForPreview}
                    onClose={handlePreviewClose}
                    isMobile={isMobile}
                />
            </div>
        </TooltipProvider>
    )
}