"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface UseFileUploadOptions {
    maxFileSize?: number // in bytes
    acceptedFileTypes?: string[] // e.g., ['image/jpeg', 'image/png', '.pdf']
}

export interface FilePreview {
    file: File
    url: string
    type: "image" | "other"
}

/**
 * Custom hook for file validation and preview management.
 * It takes the current list of files and options, and returns previews, errors,
 * and functions to process new files and revoke object URLs.
 */
export function useFileUpload(currentFiles: File[], options?: UseFileUploadOptions) {
    // Use a ref to store the internal map of file -> preview for imperative updates
    // This prevents filePreviewMapRef from being a direct dependency of useEffect, avoiding infinite loops.
    const filePreviewMapRef = useRef<Map<File, FilePreview>>(new Map())
    // This state is what's exposed and triggers re-renders when previews change
    const [filePreviewsState, setFilePreviewsState] = useState<Map<File, FilePreview>>(new Map())

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

    // Function to create and store a file preview
    const createAndStorePreview = useCallback((file: File): FilePreview => {
        // Check if file type starts with "image/" or if it has a common image extension
        const isImageFile = file.type.startsWith("image/") || /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(file.name)

        if (isImageFile) {
            const url = URL.createObjectURL(file)
            activeObjectUrls.current.add(url)
            return { file, url, type: "image" }
        }
        // For non-image files, we don't create an object URL for preview
        return { file, url: "", type: "other" }
    }, [])

    // Effect to manage previews based on the `currentFiles` prop
    useEffect(() => {
        const prevFileMap = filePreviewMapRef.current // Get the previous map from ref
        const newFileMap = new Map<File, FilePreview>()

        // 1. Identify files that are no longer in currentFiles and revoke their URLs
        prevFileMap.forEach((preview, file) => {
            if (!currentFiles.includes(file)) {
                revokeObjectURL(preview.url)
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
        return () => {
            activeObjectUrls.current.forEach((url) => URL.revokeObjectURL(url))
            activeObjectUrls.current.clear()
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
                        errorMessage = `File "${file.name}" has an unsupported type. Accepted types: ${options.acceptedFileTypes.join(", ")}.`
                    }
                }

                // Check for duplicate files (by name and size, simple check)
                // Use the current internal map for checking duplicates
                if (
                    Array.from(filePreviewMapRef.current.keys()).some(
                        (existingFile) => existingFile.name === file.name && existingFile.size === file.size,
                    )
                ) {
                    isValid = false
                    errorMessage = `File "${file.name}" is already added.`
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
