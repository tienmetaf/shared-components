

export const FileUploadConstants = {
    message: {
        onlyOneFile: "Only 1 file allowed. New file will replace current file.",
        maxFileSize: (size: number) => `File size exceeds the limit of ${size} MB.`,
        maxFiles: (maxFiles: number) => `Maximum ${maxFiles} files allowed. Limit reached`,
    },
    text: {
        dropOrBrowse: "Drag & drop files here or",
        browseFiles: "Browse Files",
        processingFiles: "Processing files...",
        loadingUpload: "Processing files...",
        selectedFiles: (fileCount: number, maxFiles: number) => `Selected ${fileCount} / ${maxFiles} files`,
        noPreviewForFileType: "No preview available for this file type.",
        fileName: (fileName: string) => `File Name: ${fileName}`,
    }
}