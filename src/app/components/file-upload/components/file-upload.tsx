"use client"

import React, {useCallback, useRef, useState} from "react"
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import {arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy} from "@dnd-kit/sortable"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {type FilePreview as FilePreviewType, useFileUpload} from "../hooks/use-file-upload"
import {useIsMobile} from "../hooks/use-is-mobile"
import {SortableItem} from "./sortable-item"
import {ImageDetail} from "./image-detail"
import {DropZone} from "./drop-zone"
import {FileErrorList} from "./file-error-list"
import {cn} from "@/lib/utils"
import {FileUploadConstants} from "@/app/components/file-upload/constants"
import {Crop} from "react-image-crop"

export interface FileWithCrop {
    file: File
    croppedImage?: File
    crop?: Crop
}

export interface FileUploadInputProps {
    value: FileWithCrop[]
    onChange: (files: FileWithCrop[]) => void
    fileConfig: {
        maxFiles?: number
        maxFileSize?: number // in bytes
        acceptedFileTypes?: string[] // e.g., ['image/jpeg', 'image/png', '.pdf']
    }
    imageConfig?: {
        aspect?: number
        minWidth?: number
        minHeight?: number
        circularCrop?: boolean
    }
    disabled?: boolean
    loading?: boolean // For external upload process (e.g., API call)
    className?: string,
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
                                                                    value,
                                                                    onChange,
                                                                    fileConfig,
                                                                    imageConfig,
                                                                    disabled,
                                                                    loading,
                                                                    className,
                                                                }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const [selectedFileForPreview, setSelectedFileForPreview] = useState<FileWithCrop | null>(null)
    const [isDraggingItem, setIsDraggingItem] = useState(false)
    const [showLimitTooltip, setShowLimitTooltip] = useState(false)
    const isMobile = useIsMobile()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isLimitReached = !!fileConfig?.maxFiles ? value.length >= fileConfig.maxFiles : false;
    const isSingleFile = !!fileConfig?.maxFiles && fileConfig.maxFiles === 1

    const {filePreviews, errors, validateAndProcessFiles, revokeObjectURL} = useFileUpload(value, {
        maxFileSize: fileConfig?.maxFileSize ?? 5 * 1024 * 1024, // Default to 5MB
        acceptedFileTypes: fileConfig?.acceptedFileTypes,
    })

    // Configure DnD sensors with appropriate constraints
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {distance: 8}, // Require 8px movement before starting drag
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

    // Handle drag events
    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()

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

    // Process files after selection or drop
    const processFiles = useCallback(
        (filesToProcess: FileList) => {
            if (disabled || loading) return

            const {validFiles} = validateAndProcessFiles(filesToProcess)
            if (validFiles.length === 0) return

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
                    onChange([{file: validFiles[0]}])
                }
            } else {
                const newFilesWithCrop: FileWithCrop[] = validFiles.map((f) => ({file: f}))
                let updatedFiles: FileWithCrop[] = [...value, ...newFilesWithCrop]

                // Enforce max files limit
                if (updatedFiles.length > (fileConfig?.maxFiles ?? Infinity)) {
                    updatedFiles = updatedFiles.slice(0, fileConfig.maxFiles)
                }

                onChange(updatedFiles)
            }
        },
        [
            disabled,
            loading,
            validateAndProcessFiles,
            value,
            fileConfig?.maxFiles,
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

            // Reset input value to allow selecting the same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        },
        [disabled, loading, processFiles]
    )

    const handleRemoveFile = useCallback(
        (fileToRemove: FileWithCrop) => {
            if (disabled || loading) return

            const updatedFiles = value.filter((file) => file !== fileToRemove)

            // Clean up preview URL
            const preview = filePreviews.get(fileToRemove)
            if (preview?.url) {
                revokeObjectURL(preview.url)
            }

            onChange(updatedFiles)
        },
        [value, onChange, disabled, loading, filePreviews, revokeObjectURL]
    )

    // DnD item sorting handlers
    const handleDragStart = useCallback(() => {
        setIsDraggingItem(true)
        setSelectedFileForPreview(null)
    }, [])

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setIsDraggingItem(false)
            const {active, over} = event

            if (active.id !== over?.id) {
                const oldIndex = value.findIndex(
                    (fileWithCrop) => `${fileWithCrop.file.name}-${fileWithCrop.file.size}-${fileWithCrop.file.lastModified}` === active.id
                )
                const newIndex = value.findIndex(
                    (fileWithCrop) => `${fileWithCrop.file.name}-${fileWithCrop.file.size}-${fileWithCrop.file.lastModified}` === over?.id
                )

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newFiles = arrayMove(value, oldIndex, newIndex)
                    onChange(newFiles)
                }
            }
        },
        [value, onChange]
    )

    // File click and preview handlers
    const handleFileClick = useCallback(
        (fileWithCrop: FileWithCrop, preview: FilePreviewType | undefined) => {
            if (isDraggingItem) return

            if (preview?.type === "image") {
                if (fileWithCrop.file.type.startsWith('image/')) {
                    setSelectedFileForPreview(fileWithCrop)
                }
            }
        },
        [isDraggingItem]
    )

    const handleBrowseClick = useCallback(() => {
        if (disabled || loading || (isLimitReached && !isSingleFile)) return
        fileInputRef.current?.click()
    }, [disabled, loading, isLimitReached, isSingleFile])

    const handlePreviewClose = useCallback(() => {
        setSelectedFileForPreview(null)
    }, [])

    const handleMouseEnter = useCallback(() => {
        if (isLimitReached && !isSingleFile) {
            setShowLimitTooltip(true)
        }
    }, [isLimitReached, isSingleFile])

    const getLimitMessage = () => {
        return isSingleFile
            ? FileUploadConstants.message.onlyOneFile
            : FileUploadConstants.message.maxFiles(fileConfig?.maxFiles || 1)
    }

    // Crop handling
    const handleCropSave = useCallback(
        (croppedFile: File, cropData: Crop) => {
            if (!selectedFileForPreview) return;

            // Find the index of the original file
            const fileIndex = value.findIndex(fileWithCrop =>
                fileWithCrop.file.name === selectedFileForPreview.file.name &&
                fileWithCrop.file.size === selectedFileForPreview.file.size &&
                fileWithCrop.file.lastModified === selectedFileForPreview.file.lastModified
            );

            if (fileIndex === -1) return;

            // Create a new array with the cropped file replacing the original
            const updatedFiles = [...value];
            updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                croppedImage: croppedFile,
                crop: cropData
            };

            onChange(updatedFiles);
            handlePreviewClose();
        },
        [selectedFileForPreview, value, onChange, handlePreviewClose]
    );

    // Generate sortable IDs for drag and drop
    const sortableItems = value.map(
        (fileWithCrop) => `${fileWithCrop.file.name}-${fileWithCrop.file.size}-${fileWithCrop.file.lastModified}`
    )

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
                                maxFiles={fileConfig?.maxFiles || 1}
                                isDraggingOver={isDraggingOver}
                                isLimitReached={isLimitReached}
                                isSingleFile={isSingleFile}
                                loading={loading}
                                disabled={disabled}
                                showLimitTooltip={showLimitTooltip}
                                fileInputRef={fileInputRef}
                                acceptedFileTypes={fileConfig?.acceptedFileTypes}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={() => setShowLimitTooltip(false)}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple={!isSingleFile}
                                accept={fileConfig?.acceptedFileTypes?.join(",")}
                                disabled={disabled || loading}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{getLimitMessage()}</p>
                    </TooltipContent>
                </Tooltip>

                <FileErrorList errors={errors}/>

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
                                    style={{touchAction: 'pan-y'}}
                                >
                                    {value.map((fileWithCrop) => (
                                        <SortableItem
                                            key={`${fileWithCrop.file.name}-${fileWithCrop.file.size}-${fileWithCrop.file.lastModified}`}
                                            fileWithCrop={fileWithCrop}
                                            preview={filePreviews.get(fileWithCrop)}
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
                    fileWithCrop={selectedFileForPreview}
                    isOpen={!!selectedFileForPreview}
                    onClose={handlePreviewClose}
                    isMobile={isMobile}
                    imageConfig={{
                        ...imageConfig,
                        onCropSave: handleCropSave,
                    }}
                />
            </div>
        </TooltipProvider>
    )
}