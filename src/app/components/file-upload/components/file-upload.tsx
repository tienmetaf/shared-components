"use client"

import React, {useCallback, useEffect, useRef, useState} from "react"
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
import { toast } from "sonner"

// import { toast } from "@/components/ui/use-toast"

export interface FileWithCrop {
    origin: {
        file?: File,
        url?: string
    },
    editted?: {
        file?: File,
        url?: string,
        crop?: Crop
    }
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

    // New state for managing crop queue
    const [cropQueue, setCropQueue] = useState<FileWithCrop[]>([])
    const [cropMode, setCropMode] = useState<'preview' | 'required'>('preview')

    const isMobile = useIsMobile()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isLimitReached = !!fileConfig?.maxFiles ? value.length >= fileConfig.maxFiles : false;
    const isSingleFile = !!fileConfig?.maxFiles && fileConfig.maxFiles === 1

    // Modified to work with new FileWithCrop structure
    const {
        filePreviews,
        errors,
        validateAndProcessFiles,
        validateAndProcessUrl,
        revokeObjectURL
    } = useFileUpload(value, {
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

            // Filter out image files for cropping queue
            const imageFiles: File[] = []
            const nonImageFiles: File[] = []

            validFiles.forEach(file => {
                if (file.type.startsWith('image/') && imageConfig?.aspect) {
                    imageFiles.push(file)
                } else {
                    nonImageFiles.push(file)
                }
            })

            // Create file objects for non-image files using new structure
            const nonImageFilesWithCrop: FileWithCrop[] = nonImageFiles.map(f => ({
                origin: { file: f }
            }))

            // Create a crop queue for image files when aspect ratio is specified
            if (imageFiles.length > 0 && imageConfig?.aspect) {
                const imageCropQueue = imageFiles.map(f => ({
                    origin: { file: f }
                }))
                setCropQueue(prev => [...prev, ...imageCropQueue])
                setCropMode('required')
            }

            if (isSingleFile) {
                // For single file, prioritize image files for cropping if aspect is defined
                if (imageFiles.length > 0 && imageConfig?.aspect) {
                    // Don't immediately add to value, let the crop process handle it
                    // Clean up existing files for single file mode
                    value.forEach(fileWithCrop => {
                        const preview = filePreviews.get(fileWithCrop)
                        if (preview?.url) {
                            revokeObjectURL(preview.url)
                        }
                    })
                    onChange([])
                } else if (validFiles.length > 0) {
                    // For non-image files or when no aspect ratio is defined
                    value.forEach(fileWithCrop => {
                        const preview = filePreviews.get(fileWithCrop)
                        if (preview?.url) {
                            revokeObjectURL(preview.url)
                        }
                    })
                    onChange([{ origin: { file: validFiles[0] } }])
                }
            } else {
                // For multiple files
                let updatedFiles: FileWithCrop[] = [...value, ...nonImageFilesWithCrop]

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
            imageConfig?.aspect
        ]
    )

    // New function to process URL input
    const processImageUrl = useCallback(
        async (url: string) => {
            if (disabled || loading) return

            try {
                const isValid = await validateAndProcessUrl(url)

                if (!isValid) {
                    toast.error("Invalid image URL. Please enter a valid image URL.")
                    return
                }

                // Create a new file object with the URL
                const newFileWithCrop: FileWithCrop = {
                    origin: { url }
                }

                if (imageConfig?.aspect) {
                    // Add to crop queue if aspect ratio is specified
                    setCropQueue(prev => [...prev, newFileWithCrop])
                    setCropMode('required')

                    if (isSingleFile) {
                        // Clean up existing files for single file mode
                        value.forEach(fileWithCrop => {
                            const preview = filePreviews.get(fileWithCrop)
                            if (preview?.url && !fileWithCrop.origin.url) {
                                revokeObjectURL(preview.url)
                            }
                        })
                        onChange([])
                    }
                } else {
                    // Add directly if no cropping needed
                    if (isSingleFile) {
                        // Replace existing file in single file mode
                        value.forEach(fileWithCrop => {
                            const preview = filePreviews.get(fileWithCrop)
                            if (preview?.url && !fileWithCrop.origin.url) {
                                revokeObjectURL(preview.url)
                            }
                        })
                        onChange([newFileWithCrop])
                    } else {
                        // Add to existing files in multiple file mode
                        let updatedFiles = [...value, newFileWithCrop]

                        // Enforce max files limit
                        if (updatedFiles.length > (fileConfig?.maxFiles ?? Infinity)) {
                            updatedFiles = updatedFiles.slice(0, fileConfig.maxFiles)
                        }

                        onChange(updatedFiles)
                    }
                }
            } catch (error) {
                console.error("Error processing image URL:", error)
                toast.error("Failed to process the image URL")
            }
        },
        [
            disabled,
            loading,
            validateAndProcessUrl,
            imageConfig?.aspect,
            isSingleFile,
            value,
            filePreviews,
            revokeObjectURL,
            onChange,
            fileConfig?.maxFiles
        ]
    )

    // Effect to process the crop queue
    useEffect(() => {
        if (cropQueue.length > 0) {
            // Process the first item in the queue
            setSelectedFileForPreview(cropQueue[0])
        } else {
            setSelectedFileForPreview(null)
        }
    }, [cropQueue])

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
            if (preview?.url && !fileToRemove.origin.url) {
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
                    (fileWithCrop) => {
                        if (fileWithCrop.origin.file) {
                            const file = fileWithCrop.origin.file;
                            return `${file.name}-${file.size}-${file.lastModified}` === active.id;
                        } else if (fileWithCrop.origin.url) {
                            return fileWithCrop.origin.url === active.id;
                        }
                        return false;
                    }
                )
                const newIndex = value.findIndex(
                    (fileWithCrop) => {
                        if (fileWithCrop.origin.file) {
                            const file = fileWithCrop.origin.file;
                            return `${file.name}-${file.size}-${file.lastModified}` === over?.id;
                        } else if (fileWithCrop.origin.url) {
                            return fileWithCrop.origin.url === over?.id;
                        }
                        return false;
                    }
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
                if (fileWithCrop.origin.file?.type.startsWith('image/') || fileWithCrop.origin.url) {
                    setSelectedFileForPreview(fileWithCrop)
                    setCropMode('preview')
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
        if (cropMode === 'required' && cropQueue.length > 0) {
            // Remove current file from queue without saving when in required mode
            setCropQueue(prev => prev.slice(1))
        } else {
            // Normal preview close
            setSelectedFileForPreview(null)
        }
    }, [cropMode, cropQueue.length])

    // New handler for rejecting an image in the crop queue
    const handleRejectImage = useCallback(() => {
        if (cropQueue.length > 0) {
            // Simply remove the current item from the queue without saving
            setCropQueue(prev => prev.slice(1))
        }
    }, [cropQueue.length])

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
        (croppedFile: File | null, cropData: Crop, croppedUrl?: string) => {
            const currentFile = selectedFileForPreview;
            if (!currentFile) return;

            if (cropMode === 'required' && cropQueue.length > 0) {
                // Add the cropped file to the value and remove from queue
                const newFileWithCrop: FileWithCrop = {
                    origin: { ...currentFile.origin },
                    editted: {
                        file: croppedFile || undefined,
                        url: croppedUrl,
                        crop: cropData
                    }
                };

                if (isSingleFile) {
                    // For single file mode, replace any existing file
                    onChange([newFileWithCrop]);
                } else {
                    // For multiple files, add to existing files
                    const updatedFiles = [...value, newFileWithCrop];

                    // Enforce max files limit
                    if (updatedFiles.length > (fileConfig?.maxFiles ?? Infinity)) {
                        onChange(updatedFiles.slice(0, fileConfig.maxFiles));
                    } else {
                        onChange(updatedFiles);
                    }
                }

                // Remove current file from queue
                setCropQueue(prev => prev.slice(1));
            } else {
                // Normal edit mode for existing files
                const fileIndex = value.findIndex(fileWithCrop => {
                    if (fileWithCrop.origin.file && currentFile.origin.file) {
                        return fileWithCrop.origin.file.name === currentFile.origin.file.name &&
                            fileWithCrop.origin.file.size === currentFile.origin.file.size &&
                            fileWithCrop.origin.file.lastModified === currentFile.origin.file.lastModified;
                    } else if (fileWithCrop.origin.url && currentFile.origin.url) {
                        return fileWithCrop.origin.url === currentFile.origin.url;
                    }
                    return false;
                });

                if (fileIndex === -1) return;

                const updatedFiles = [...value];
                updatedFiles[fileIndex] = {
                    origin: { ...updatedFiles[fileIndex].origin },
                    editted: {
                        file: croppedFile || undefined,
                        url: croppedUrl,
                        crop: cropData
                    }
                };

                onChange(updatedFiles);
                setSelectedFileForPreview(null);
            }
        },
        [selectedFileForPreview, value, onChange, cropMode, cropQueue.length, isSingleFile, fileConfig?.maxFiles]
    );

    // Generate sortable IDs for drag and drop
    const sortableItems = value.map(
        (fileWithCrop) => {
            if (fileWithCrop.origin.file) {
                const file = fileWithCrop.origin.file;
                return `${file.name}-${file.size}-${file.lastModified}`;
            }
            return fileWithCrop.origin.url || '';
        }
    ).filter(id => id !== '');

    // Get the queue count for display
    const remainingQueueCount = cropQueue.length - (selectedFileForPreview && cropMode === 'required' ? 1 : 0);

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
                                onUrlSubmit={processImageUrl}
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
                                            key={fileWithCrop.origin.file ?
                                                `${fileWithCrop.origin.file.name}-${fileWithCrop.origin.file.size}-${fileWithCrop.origin.file.lastModified}` :
                                                fileWithCrop.origin.url
                                            }
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
                    onReject={cropMode === 'required' ? handleRejectImage : undefined}
                    isMobile={isMobile}
                    cropMode={cropMode}
                    remainingQueueCount={remainingQueueCount}
                    imageConfig={{
                        ...imageConfig,
                        onCropSave: handleCropSave,
                    }}
                />
            </div>
        </TooltipProvider>
    )
}