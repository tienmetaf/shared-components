"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {FileWithCrop} from "@/app/components/file-upload/components/file-upload";
import {Crop} from "react-image-crop";
import {FileUploadConstants} from "@/app/components/file-upload/constants";

interface UseFileUploadOptions {
    maxFileSize?: number // in bytes
    acceptedFileTypes?: string[] // e.g., ['image/jpeg', 'image/png', '.pdf']
}

export interface FilePreview {
    url: string
    type: "image" | "other"
    croppedUrl?: string
}

/**
 * Custom hook for file validation and preview management.
 * It takes the current list of files and options, and returns previews, errors,
 * and functions to process new files and revoke object URLs.
 */
export function useFileUpload(currentFiles: FileWithCrop[], options?: UseFileUploadOptions) {
    // Use a ref to store the internal map of file -> preview for imperative updates
    // This prevents filePreviewMapRef from being a direct dependency of useEffect, avoiding infinite loops.
    const filePreviewMapRef = useRef<Map<FileWithCrop, FilePreview>>(new Map())
    // This state is what's exposed and triggers re-renders when previews change
    const [filePreviewsState, setFilePreviewsState] = useState<Map<FileWithCrop, FilePreview>>(new Map())

    const [errors, setErrors] = useState<string[]>([])

    // Ref to keep track of active object URLs for cleanup
    const activeObjectUrls = useRef<Set<string>>(new Set())

    // Function to revoke a single object URL
    const revokeObjectURL = useCallback((url: string) => {
        if (activeObjectUrls.current.has(url)) {
            URL.revokeObjectURL(url)
            activeObjectUrls.current.delete(url)
        }
    }, [])

    // Helper to check if a file is an image by type or extension
    const isImageType = useCallback((fileName: string, fileType?: string): boolean => {
        if (fileType && fileType.startsWith("image/")) return true;
        return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(fileName);
    }, []);

    // Function to create and store a file preview
    const createAndStorePreview = useCallback((fileWithCrop: FileWithCrop): FilePreview => {
        // First, determine what kind of content we're dealing with (file or url)
        const originFile = fileWithCrop.origin.file;
        const originUrl = fileWithCrop.origin.url;
        const editedFile = fileWithCrop.editted?.file;
        const editedUrl = fileWithCrop.editted?.url;

        // Determine if this is an image based on either file type or URL extension
        let isImageContent = false;

        if (originFile) {
            isImageContent = isImageType(originFile.name, originFile.type);
        } else if (originUrl) {
            isImageContent = isImageType(originUrl);
        }

        // Create preview based on content type
        if (isImageContent) {
            // For edited content, prioritize that
            let previewUrl = "";
            let croppedUrl: string | undefined = undefined;

            // Set up original URL
            if (originFile) {
                previewUrl = URL.createObjectURL(originFile);
                activeObjectUrls.current.add(previewUrl);
            } else if (originUrl) {
                previewUrl = originUrl; // No need to create object URL for remote URLs
            }

            // Set up cropped/edited URL
            if (editedFile) {
                croppedUrl = URL.createObjectURL(editedFile);
                activeObjectUrls.current.add(croppedUrl);
            } else if (editedUrl) {
                croppedUrl = editedUrl;
            }

            return { url: previewUrl, type: "image", croppedUrl };
        }

        // For non-image files/URLs
        if (originFile) {
            return { url: "", type: "other" }; // No preview for non-image files
        } else if (originUrl) {
            return { url: originUrl, type: "other" }; // Just use the URL directly
        }

        // Fallback
        return { url: "", type: "other" };
    }, [isImageType])

    // Effect to manage previews based on the `currentFiles` prop
    useEffect(() => {
        const prevFileMap = filePreviewMapRef.current // Get the previous map from ref
        const newFileMap = new Map<FileWithCrop, FilePreview>()

        // 1. Identify items that are no longer in currentFiles and revoke their URLs
        prevFileMap.forEach((preview, file) => {
            if (!currentFiles.includes(file)) {
                if (preview.url && !file.origin.url) {
                    revokeObjectURL(preview.url);
                }
                if (preview.croppedUrl && !file.editted?.url) {
                    revokeObjectURL(preview.croppedUrl);
                }
            }
        })

        // 2. Identify files in currentFiles: reuse existing previews or create new ones
        currentFiles.forEach((file) => {
            if (prevFileMap.has(file)) {
                // File already has a preview, reuse it
                newFileMap.set(file, prevFileMap.get(file)!)
            } else {
                // New file, create a preview
                newFileMap.set(file, createAndStorePreview(file))
            }
        })

        // Update the ref and the state to trigger re-render in consuming components
        filePreviewMapRef.current = newFileMap
        setFilePreviewsState(newFileMap)

        // Cleanup on unmount: revoke all active object URLs
        const urls = activeObjectUrls.current

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url))
            urls.clear()
        }
    }, [currentFiles, createAndStorePreview, revokeObjectURL]) // Dependencies are currentFiles and memoized callbacks

    // Function to validate and process a list of new files
    const validateAndProcessFiles = useCallback(
        (newFiles: FileList | File[]): { validFiles: File[]; newErrors: string[] } => {
            const newValidFiles: File[] = []
            const currentErrors: string[] = []

            Array.from(newFiles).forEach((file) => {
                let isValid = true
                let errorMessage = ""

                // Validate file size
                if (options?.maxFileSize && file.size > options.maxFileSize) {
                    isValid = false
                    errorMessage = `File "${file.name}" exceeds maximum size of ${options.maxFileSize / (1024 * 1024)}MB.`
                }

                // Validate file type
                if (options?.acceptedFileTypes && options.acceptedFileTypes.length > 0) {
                    const isAccepted = options.acceptedFileTypes.some((type) => {
                        if (type.startsWith(".")) {
                            // Check by extension
                            const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
                            return fileExtension === type.toLowerCase()
                        }
                        return file.type === type // Check by MIME type
                    })

                    if (!isAccepted) {
                        isValid = false
                        errorMessage = FileUploadConstants.message.unsupportedFileType(file.name, options.acceptedFileTypes)
                    }
                }

                // Check for duplicate files (by name and size, simple check)
                // Use the current internal map for checking duplicates
                if (
                    Array.from(filePreviewMapRef.current.keys()).some(
                        (existingFile) => {
                            // Check if the existing file has a File object
                            const existingOriginFile = existingFile.origin.file;

                            // Only compare if both have File objects
                            return existingOriginFile &&
                                existingOriginFile.name === file.name &&
                                existingOriginFile.size === file.size;
                        }
                    )
                ) {
                    isValid = false
                    errorMessage = FileUploadConstants.message.existsFile(file.name)
                }

                if (isValid) {
                    newValidFiles.push(file)
                } else {
                    currentErrors.push(errorMessage)
                }
            })

            setErrors(currentErrors) // Update errors state in the hook
            return { validFiles: newValidFiles, newErrors: currentErrors }
        },
        [options], // Dependencies are only options, as filePreviewMapRef.current is accessed directly
    )

    return {
        filePreviews: filePreviewsState, // Expose the state version of file previews
        errors,
        validateAndProcessFiles,
        revokeObjectURL, // Expose for explicit cleanup if needed by the component
    }
}