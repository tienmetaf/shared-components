

export const FileUploadConstants = {
    message: {
        onlyOneFile: "Only 1 file allowed. New file will replace current file.",
        maxFileSize: (fileName: string, fileSize: number, maxFileSize: number) => `File "${fileName}" is ${ (fileSize / (1024 * 1024)).toFixed(2) }MB, exceeds maximum size of ${ (maxFileSize / (1024 * 1024)).toFixed(2) }MB.`,
        maxFiles: (maxFiles: number) => `Maximum ${maxFiles} files allowed. Limit reached`,
        unsupportedFileType: (fileName: string, acceptedFileTypes: string[]) => `File "${fileName}" has an unsupported type. Accepted types: ${acceptedFileTypes.join(", ")}.`,
        existsFile: (fileName: string) => `File "${fileName}" already exists.`,
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