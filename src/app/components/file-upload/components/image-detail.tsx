"use client"

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import Image from "next/image"
import {FileText, ImageIcon} from "lucide-react"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle} from "@/components/ui/drawer"
import {FileUploadConstants} from "@/app/components/file-upload/constants"
import {Button} from "@/components/ui/button"
import {centerCrop, convertToPixelCrop, Crop, makeAspectCrop, PixelCrop, ReactCrop} from "react-image-crop"

import 'react-image-crop/dist/ReactCrop.css'
import {FileWithCrop} from "@/app/components/file-upload/components/file-upload"
import {Badge} from "@/components/ui/badge"

interface FilePreviewProps {
    fileWithCrop: FileWithCrop | null
    isOpen: boolean
    onClose: () => void
    onReject?: () => void
    isMobile: boolean
    cropMode?: 'preview' | 'required'
    remainingQueueCount?: number
    imageConfig?: {
        aspect?: number
        onCropSave?: (croppedFile: File, crop: Crop) => void
        minWidth?: number
        minHeight?: number
        circularCrop?: boolean
    }
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
): Crop {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export function ImageDetail({
                                fileWithCrop,
                                isOpen,
                                onClose,
                                onReject,
                                isMobile,
                                cropMode = 'preview',
                                remainingQueueCount = 0,
                                imageConfig
                            }: FilePreviewProps) {
    const initialCrop = useMemo(() =>
            fileWithCrop?.crop ?? undefined
        , [fileWithCrop])

    // In required mode or when we have an aspect ratio, enable crop by default
    const [enableCrop, setEnableCrop] = useState(cropMode === 'required')
    const [crop, setCrop] = useState<Crop>()
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [originalUrl, setOriginalUrl] = useState<string | null>(null)
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

    const imgRef = useRef<HTMLImageElement>(null)
    const file = fileWithCrop?.file

    // Create and manage URLs for the original and cropped images
    useEffect(() => {
        if (!file) return;

        // Create URLs for original and preview images
        const newOriginalUrl = URL.createObjectURL(file);
        setOriginalUrl(newOriginalUrl);

        if (fileWithCrop?.croppedImage) {
            const newPreviewUrl = URL.createObjectURL(fileWithCrop.croppedImage);
            setPreviewUrl(newPreviewUrl);
        } else {
            setPreviewUrl(newOriginalUrl);
        }

        // Cleanup function to revoke object URLs
        return () => {
            if (newOriginalUrl) URL.revokeObjectURL(newOriginalUrl);
            if (previewUrl && previewUrl !== newOriginalUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [file, fileWithCrop?.croppedImage]);

    // Reset crop state when a new file is selected
    useEffect(() => {
        if (file) {
            // In required mode or when we have an aspect ratio, enable crop by default
            setEnableCrop(cropMode === 'required');
            setCrop(initialCrop);
        }
    }, [file, initialCrop, cropMode, imageConfig?.aspect]);

    // Set initial crop when image loads
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        if (!enableCrop) return;

        const { width, height } = e.currentTarget;

        if (fileWithCrop?.crop) {
            setCrop(fileWithCrop.crop);
        } else if (imageConfig?.aspect) {
            const newCrop = centerAspectCrop(width, height, imageConfig.aspect);
            setCrop(newCrop);
            setCompletedCrop(convertToPixelCrop(newCrop, width, height))
        } else {
            const newCrop = centerAspectCrop(width, height, 3 / 4);
            setCrop(newCrop);
            setCompletedCrop(convertToPixelCrop(newCrop, width, height))
        }
    }, [enableCrop, imageConfig?.aspect, fileWithCrop?.crop]);

    // Reset crop state when closing dialog
    const handleClose = useCallback(() => {
        onClose();
        setEnableCrop(false);
        setCrop(initialCrop);
    }, [onClose, initialCrop]);

    // Save the cropped image
    const saveCroppedImage = useCallback(() => {
        if (!crop || !imgRef.current || !file) return;
        const cropToUse = completedCrop || crop;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate the pixel values for crop
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const pixelCrop = {
            x: cropToUse.x * scaleX,
            y: cropToUse.y * scaleY,
            width: cropToUse.width * scaleX,
            height: cropToUse.height * scaleY,
        };

        // Set canvas dimensions
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // Convert canvas to Blob
        canvas.toBlob((blob) => {
            if (!blob || !file) return;

            // Create a new File object with the cropped image
            const croppedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
            });

            // Call the callback to save the cropped image
            if (imageConfig?.onCropSave) {
                imageConfig.onCropSave(croppedFile, crop);
            }

            // Clean up
            setEnableCrop(false);
        }, file.type);
    }, [crop, completedCrop, imageConfig?.onCropSave]);

    // Toggle crop mode
    const toggleCropMode = useCallback(() => {
        setEnableCrop(prev => !prev);
    }, []);

    // Handle reject button click
    const handleReject = useCallback(() => {
        if (onReject) {
            onReject();
        }
    }, [onReject]);

    // Shared content for both mobile and desktop views
    const previewContent = (
        <>
            {file?.type.startsWith('image/') && previewUrl ? (
                <div
                    data-vaul-no-drag={enableCrop ? '' : undefined}
                    className="relative w-full h-auto max-h-[70vh] flex items-center justify-center bg-muted rounded-lg">
                    {enableCrop ? (
                        <ReactCrop
                            crop={crop}
                            onComplete={c => setCompletedCrop(c)}
                            onChange={setCrop}
                            aspect={imageConfig?.aspect}
                            minWidth={imageConfig?.minWidth}
                            minHeight={imageConfig?.minHeight}
                            circularCrop={!!imageConfig?.circularCrop}
                        >
                            <Image
                                ref={imgRef}
                                src={originalUrl!}
                                alt={file.name}
                                width={700}
                                height={500}
                                style={{maxWidth: "100%", maxHeight: "70vh"}}
                                className="rounded-lg w-fit object-contain"
                                onLoad={onImageLoad}
                                onError={() => console.error('Image load error for:', file.name)}
                            />
                        </ReactCrop>
                    ) : (
                        <Image
                            src={previewUrl}
                            alt={file.name}
                            width={700}
                            height={500}
                            style={{maxWidth: "100%", maxHeight: "70vh"}}
                            className="rounded-lg w-fit object-contain"
                            onError={() => console.error('Image load error for:', file.name)}
                        />
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-muted rounded-lg text-muted-foreground">
                    <FileText className="w-20 h-20 mb-4"/>
                    <p className="text-lg font-medium">{FileUploadConstants.text.noPreviewForFileType}</p>
                    {file?.name && (
                        <p className="text-sm mt-2">{FileUploadConstants.text.fileName(file.name)}</p>
                    )}
                </div>
            )}
        </>
    );

    // Header content with remaining queue indicator
    const headerContent = (
        <>
            {cropMode === 'required' && remainingQueueCount > 0 && (
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="px-2 py-1">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        <span>{remainingQueueCount} more image{remainingQueueCount !== 1 ? 's' : ''} to crop</span>
                    </Badge>
                </div>
            )}
        </>
    );

    // Actions for crop controls
    const cropActions = (
        <div className="flex justify-end gap-2 mr-2 w-full">
            {cropMode === 'preview' && (
                <Button
                    variant="outline"
                    onClick={toggleCropMode}
                >
                    {enableCrop ? "Cancel" : "Edit Image"}
                </Button>
            )}

            {cropMode === 'required' && onReject && (
                <Button
                    variant="destructive"
                    onClick={handleReject}
                >
                    Reject
                </Button>
            )}

            {enableCrop && crop && (
                <Button
                    variant="default"
                    onClick={saveCroppedImage}
                >
                    Apply
                </Button>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <Drawer
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) handleClose();
                }}
            >
                <DrawerContent className="max-h-[90vh] overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle className="truncate leading-6" title={file?.name || "File Preview"}>
                            {file?.name}
                        </DrawerTitle>
                        <DrawerDescription>
                            Size: {file ? (file.size / (1024 * 1024)).toFixed(2) : "??"} MB
                            {file?.type && ` | Type: ${file.type}`}
                        </DrawerDescription>
                        {headerContent}
                    </DrawerHeader>
                    {previewContent}
                    <DrawerFooter>
                        <div className="w-full flex justify-between">
                            {cropActions}
                            {cropMode === 'preview' && (
                                <Button onClick={handleClose}>
                                    Close
                                </Button>
                            )}
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    // Desktop view using Dialog
    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) handleClose();
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
                        Size: {file ? (file.size / (1024 * 1024)).toFixed(2) : "??"} MB
                        {file?.type && ` | Type: ${file.type}`}
                    </DialogDescription>
                    {headerContent}
                </DialogHeader>
                {previewContent}
                <DialogFooter>
                    <div className="w-full flex justify-between">
                        {cropActions}
                        {cropMode === 'preview' && (
                            <Button onClick={handleClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}