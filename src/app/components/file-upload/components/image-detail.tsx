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
        onCropSave?: (croppedFile: File | null, crop: Crop, croppedUrl?: string) => void
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

// Helper function to generate a Base64 encoded data URL from canvas
async function canvasToDataUrl(canvas: HTMLCanvasElement, fileType: string): Promise<string> {
    return Promise.resolve(canvas.toDataURL(fileType, 0.85));
}
// Helper function to create a cropped image from a URL
async function createCroppedImageFromUrl(
    url: string,
    crop: Crop,
    imageRef: HTMLImageElement
): Promise<string> {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    // Calculate the pixel values for crop
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;

    const pixelCrop = {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
    };

    // Set canvas dimensions
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
        imageRef,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl;
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
    // Use crop data from edited portion if available
    const initialCrop = useMemo(() =>
            fileWithCrop?.editted?.crop ?? undefined
        , [fileWithCrop])

    // In required mode or when we have an aspect ratio, enable crop by default
    const [enableCrop, setEnableCrop] = useState(cropMode === 'required')
    const [crop, setCrop] = useState<Crop>()
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [originalUrl, setOriginalUrl] = useState<string | null>(null)
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [isLoadingImage, setIsLoadingImage] = useState(false)

    const imgRef = useRef<HTMLImageElement>(null)
    const file = fileWithCrop?.origin.file
    const fileUrl = fileWithCrop?.origin.url

    // Create and manage URLs for the original and cropped images
    useEffect(() => {
        if (!fileWithCrop) return;
        setIsLoadingImage(true);

        // Set up original URL (prefer file over URL)
        let newOriginalUrl = fileWithCrop.origin.url || null;
        if (fileWithCrop.origin.file) {
            newOriginalUrl = URL.createObjectURL(fileWithCrop.origin.file);
        }
        setOriginalUrl(newOriginalUrl);

        // Set up preview URL (prefer edited over original)
        if (fileWithCrop.editted?.url) {
            setPreviewUrl(fileWithCrop.editted.url);
        } else if (fileWithCrop.editted?.file) {
            const newPreviewUrl = URL.createObjectURL(fileWithCrop.editted.file);
            setPreviewUrl(newPreviewUrl);
        } else {
            setPreviewUrl(newOriginalUrl);
        }

        // Cleanup function
        return () => {
            // Only revoke URLs we created with createObjectURL
            if (fileWithCrop.origin.file && newOriginalUrl) {
                URL.revokeObjectURL(newOriginalUrl);
            }
            if (fileWithCrop.editted?.file && previewUrl && previewUrl !== newOriginalUrl && previewUrl !== fileWithCrop.editted?.url) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [fileWithCrop]);

    // Reset crop state when a new file is selected
    useEffect(() => {
        if (fileWithCrop) {
            // In required mode or when we have an aspect ratio, enable crop by default
            setEnableCrop(cropMode === 'required');
            setCrop(initialCrop);
        }
    }, [fileWithCrop, initialCrop, cropMode, imageConfig?.aspect]);

    // Set initial crop when image loads
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        setIsLoadingImage(false);
        if (!enableCrop) return;

        const { width, height } = e.currentTarget;

        if (fileWithCrop?.editted?.crop) {
            setCrop(fileWithCrop.editted.crop);
        } else if (imageConfig?.aspect) {
            const newCrop = centerAspectCrop(width, height, imageConfig.aspect);
            setCrop(newCrop);
            setCompletedCrop(convertToPixelCrop(newCrop, width, height))
        } else {
            const newCrop = centerAspectCrop(width, height, 3 / 4);
            setCrop(newCrop);
            setCompletedCrop(convertToPixelCrop(newCrop, width, height))
        }
    }, [enableCrop, imageConfig?.aspect, fileWithCrop?.editted?.crop]);

    // Handle image load error
    const onImageError = useCallback(() => {
        setIsLoadingImage(false);
        console.error('Image load error for:', file?.name || fileUrl);
    }, [file?.name, fileUrl]);

    // Reset crop state when closing dialog
    const handleClose = useCallback(() => {
        onClose();
        setEnableCrop(false);
        setCrop(initialCrop);
    }, [onClose, initialCrop]);

    // Save the cropped image
    const saveCroppedImage = useCallback(async () => {
        if (!crop || !imgRef.current || (!file && !fileUrl)) return;
        const cropToUse = completedCrop || crop;

        const image = imgRef.current;

        try {
            if (fileUrl) {
                // Handle URL-based image
                const croppedDataUrl = await createCroppedImageFromUrl(fileUrl, cropToUse, image);

                // Call the callback with null for file, but pass the crop data and URL
                if (imageConfig?.onCropSave) {
                    imageConfig.onCropSave(null, crop, croppedDataUrl);
                }
            } else if (file) {
                // Handle File-based image
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

                // Determine file type
                const fileType = file.type || 'image/jpeg';

                // Convert canvas to Blob
                canvas.toBlob((blob) => {
                    if (!blob) return;

                    // Create a new File object with the cropped image
                    const croppedFile = new File([blob], file.name || 'cropped-image.jpg', {
                        type: fileType,
                        lastModified: Date.now()
                    });

                    // Call the callback to save the cropped image
                    if (imageConfig?.onCropSave) {
                        imageConfig.onCropSave(croppedFile, crop);
                    }
                }, fileType);
            }

            // Clean up
            setEnableCrop(false);
        } catch (error) {
            console.error("Error saving cropped image:", error);
        }
    }, [crop, completedCrop, file, fileUrl, imageConfig?.onCropSave]);

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
            {((file && file.type.startsWith('image/')) || fileUrl) && previewUrl ? (
                <div
                    data-vaul-no-drag={enableCrop ? '' : undefined}
                    className="relative w-full h-auto max-h-[70vh] flex items-center justify-center bg-muted rounded-lg">
                    {isLoadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                            <div className="loading-spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

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
                                alt={file?.name || "Image"}
                                width={700}
                                height={500}
                                style={{maxWidth: "100%", maxHeight: "70vh"}}
                                className="rounded-lg w-fit object-contain"
                                onLoad={onImageLoad}
                                onError={onImageError}
                                unoptimized={!!fileUrl} // For remote URLs
                                crossOrigin="anonymous"
                            />
                        </ReactCrop>
                    ) : (
                        <Image
                            src={previewUrl}
                            alt={file?.name || "Image"}
                            width={700}
                            height={500}
                            style={{maxWidth: "100%", maxHeight: "70vh"}}
                            className="rounded-lg w-fit object-contain"
                            onLoad={() => setIsLoadingImage(false)}
                            onError={onImageError}
                            unoptimized={!!fileUrl} // For remote URLs
                            crossOrigin="anonymous"
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
                        <DrawerTitle className="truncate leading-6" title={file?.name || fileUrl || "File Preview"}>
                            {file?.name || fileUrl || "File Preview"}
                        </DrawerTitle>
                        <DrawerDescription>
                            {file ? `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Remote Image"}
                            {file?.type && ` | Type: ${file.type}`}
                            {!file && fileUrl && " | Type: Image URL"}
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
                        title={file?.name || fileUrl || "File Preview"}
                    >
                        {file?.name || fileUrl || "File Preview"}
                    </DialogTitle>
                    <DialogDescription>
                        {file ? `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Remote Image"}
                        {file?.type && ` | Type: ${file.type}`}
                        {!file && fileUrl && " | Type: Image URL"}
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