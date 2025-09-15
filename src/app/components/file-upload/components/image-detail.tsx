"use client"

import React from "react"
import Image from "next/image"
import { FileText } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import {FileUploadConstants} from "@/app/components/file-upload/constants";

interface FilePreviewProps {
    file: File | null
    previewUrl: string | null
    isOpen: boolean
    onClose: () => void
    isMobile: boolean
}

export function ImageDetail({ file, previewUrl, isOpen, onClose, isMobile }: FilePreviewProps) {
    const handleClose = () => {
        onClose()
    }

    const previewContent = (
        <>
            {file?.type.startsWith('image/') && previewUrl ? (
                <div className="relative w-full h-auto max-h-[70vh] flex items-center justify-center bg-muted rounded-lg">
                    <Image
                        src={previewUrl}
                        alt={file.name}
                        width={700}
                        height={500}
                        style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
                        className="rounded-lg"
                        unoptimized
                        onError={() => {
                            console.error('Image load error for:', file.name)
                        }}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-muted rounded-lg text-muted-foreground">
                    <FileText className="w-20 h-20 mb-4" />
                    <p className="text-lg font-medium">{FileUploadConstants.text.noPreviewForFileType}</p>
                    {
                        file?.name && <p className="text-sm mt-2">{FileUploadConstants.text.fileName(file.name)}</p>
                    }
                </div>
            )}
        </>
    )

    if (isMobile) {
        return (
            <Drawer
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) handleClose()
                }}
            >
                <DrawerContent className="max-h-[90vh] overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle className="truncate leading-6" title={file?.name || "File Preview"}>
                            {
                                file?.name && <p className="text-sm mt-2">{FileUploadConstants.text.fileName(file.name)}</p>
                            }
                        </DrawerTitle>
                        <DrawerDescription>
                            Size: {file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB
                            {file?.type && ` | Type: ${file.type}`}
                        </DrawerDescription>
                    </DrawerHeader>
                    {previewContent}
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) handleClose()
            }}
        >
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="w-full overflow-hidden">
                    <DialogTitle
                        className="truncate leading-6"
                        title={file?.name || "File Preview"}
                    >
                        {file?.name}
                    </DialogTitle>
                    <DialogDescription>
                        Size: {file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB
                        {file?.type && ` | Type: ${file.type}`}
                    </DialogDescription>
                </DialogHeader>
                {previewContent}
            </DialogContent>
        </Dialog>
    )
}