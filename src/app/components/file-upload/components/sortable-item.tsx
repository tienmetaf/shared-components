"use client"

import React, {useCallback, useState} from "react"
import {useSortable} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import Image from "next/image"
import {FileText, GripVertical, Trash} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Separator} from "@/components/ui/separator"
import {cn} from "@/lib/utils"
import {type FilePreview} from "../hooks/use-file-upload"
import {FileWithCrop} from "@/app/components/file-upload/components/file-upload"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle} from "@/components/ui/drawer"
import {useIsMobile} from "../hooks/use-is-mobile"
import {FileUploadConstants} from "@/app/components/file-upload/constants";

interface SortableItemProps {
    fileWithCrop: FileWithCrop
    preview: FilePreview | undefined
    onRemove: (file: FileWithCrop) => void
    onFileClick: (file: FileWithCrop, preview: FilePreview | undefined) => void
    disabled?: boolean
}

export function SortableItem({
                                 fileWithCrop,
                                 preview,
                                 onRemove,
                                 onFileClick,
                                 disabled
                             }: SortableItemProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const isMobile = useIsMobile()

    const file = fileWithCrop.croppedImage ?? fileWithCrop.file

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
                onFileClick(fileWithCrop, preview)
            }
        },
        [isDragging, preview, fileWithCrop, onFileClick]
    )

    // Open delete confirmation
    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setShowDeleteConfirm(true)
    }, [])

    // Handle confirmed file removal
    const handleConfirmDelete = useCallback(() => {
        onRemove(fileWithCrop)
        setShowDeleteConfirm(false)
    }, [onRemove, fileWithCrop])

    // Cancel delete
    const handleCancelDelete = useCallback(() => {
        setShowDeleteConfirm(false)
    }, [])

    // Format file size
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)

    // File preview image/icon for the confirmation
    const filePreviewContent = (
        <>
            {preview?.type === "image" && (preview.croppedUrl || preview.url) ? (
                <div className="w-full flex justify-center my-4">
                    <Image
                        src={preview.croppedUrl || preview.url}
                        alt={file.name}
                        width={300}
                        height={200}
                        className="rounded-md max-h-[300px] w-auto object-contain"
                    />
                </div>
            ) : (
                <div className="w-full flex justify-center my-4">
                    <div className="w-24 h-24 flex items-center justify-center bg-muted rounded-md">
                        <FileText className="w-12 h-12 text-muted-foreground" />
                    </div>
                </div>
            )}
        </>
    )

    // Confirmation dialog/drawer content
    const confirmationContent = (
        <>
            {filePreviewContent}

            <div className="space-y-2 mt-4">
                <div className="flex justify-between">
                    <span className="font-medium">File:</span>
                    <span className="text-right">{file.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                    <span className="font-medium">Size:</span>
                    <span>{fileSizeMB} MB</span>
                </div>
            </div>
        </>
    )

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={cn(
                    "flex items-center border rounded-md bg-background w-full max-w-full overflow-hidden",
                    "select-none", // Prevent text selection during drag
                    isDragging && "opacity-50 z-50"
                )}
            >
                {/* Drag handle */}
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
                                src={preview.croppedUrl || preview.url}
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
                            {fileSizeMB} MB
                        </div>
                    </div>
                </div>

                <Separator orientation="vertical" className="min-h-8" />

                <Button
                    type="button"
                    variant="ghost"
                    size="default"
                    onClick={handleDeleteClick}
                    className="flex-shrink-0 px-2 mx-1 hover:bg-red-500 hover:text-white"
                    disabled={disabled}
                    aria-label={`Remove ${file.name}`}
                >
                    <Trash className="w-5 h-5" />
                </Button>
            </div>

            {/* Desktop Dialog for delete confirmation */}
            {!isMobile && (
                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <div className="text-center">
                                <DialogTitle className="text-lg font-medium">{FileUploadConstants.text.confirmDelete}</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground mt-1">{FileUploadConstants.text.cannotUndo}</DialogDescription>
                            </div>
                        </DialogHeader>

                        {confirmationContent}

                        <DialogFooter className="gap-2 sm:gap-0 mt-4">
                            <Button
                                variant="outline"
                                onClick={handleCancelDelete}
                                className="mr-2"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Mobile Drawer for delete confirmation */}
            {isMobile && (
                <Drawer open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DrawerContent>
                        <DrawerHeader>
                            <div className="text-center">
                                <DrawerTitle className="text-lg font-medium">Are you sure you want to delete this file?</DrawerTitle>
                                <DrawerDescription className="text-sm text-muted-foreground mt-1">This action cannot be undone.</DrawerDescription>
                            </div>
                        </DrawerHeader>
                        <div className="px-4">
                            {confirmationContent}
                        </div>

                        <DrawerFooter className="pt-2">
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </Button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            )}
        </>
    )
}