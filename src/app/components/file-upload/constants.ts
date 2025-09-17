export const FileUploadConstants = {
    text: {
        dropOrBrowse: "Drag and drop files here or browse",
        browseFiles: "Browse files",
        loadingUpload: "Uploading files...",
        confirmDelete: "Are you sure you want to delete this file?",
        cannotUndo: "This action cannot be undone.",
        noPreviewForFileType: "No preview available for this file type",
        fileName: (name: string) => `File name: ${name}`,
        selectedFiles: (count: number, max: number | undefined) =>
            `${count} file${count !== 1 ? 's' : ''} selected${max ? ` / ${max}` : ''}`,
    },
    message: {
        maxFiles: (max: number) => `You can upload a maximum of ${max} file${max !== 1 ? 's' : ''}.`,
        onlyOneFile: "You can only upload one file at a time.",
        unsupportedFileType: (name: string, types: string[]) =>
            `File "${name}" has an unsupported format. Only ${types.join(', ')} are allowed.`,
        unsupportedUrlType: (types: string[]) =>
            `This URL does not point to a supported image format. Only ${types.join(', ')} are allowed.`,
        existsFile: (name: string) => `File "${name}" has already been added.`,
        existsUrl: "This URL has already been added.",
    }
}