export interface FileUploadDto {
    fileName: string,
    mimeType: string,
    buffer: Buffer,
}