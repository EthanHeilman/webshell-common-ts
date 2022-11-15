import { ReadStream } from 'fs';

export interface UploadLogArchiveRequest {
    userEmail: string,
    uploadLogsRequestId: string,
    logArchiveZip: ReadStream,
}
