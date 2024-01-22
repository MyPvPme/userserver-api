import {
  CompleteChunkInterface,
  FileChunkInterface,
  FileDetailsInterface,
  FileDetailsListInterface,
  FilePathInterface,
  OperationStatusResponseInterface,
  FilePathsInterface,
  ServerIdInterface,
  GetFileInterface,
} from '@userserver-api/services';
import { Observable } from 'rxjs';

export interface FilesServiceInterface {
  getFiles(filePath: FilePathInterface): FileDetailsListInterface;

  getFile(filePath: GetFileInterface): Observable<FileChunkInterface>;

  getFolder(filePath: FilePathInterface): Observable<FileChunkInterface>;

  deleteFile(filePath: FilePathInterface): OperationStatusResponseInterface;

  uploadFile(
    messages: Observable<FileChunkInterface>,
  ): OperationStatusResponseInterface;

  getFileStats(filePath: FilePathInterface): FileDetailsInterface;

  writeFile(chunk: FileChunkInterface): OperationStatusResponseInterface;

  renameFile(paths: FilePathsInterface): OperationStatusResponseInterface;

  createFolder(path: FilePathInterface): OperationStatusResponseInterface;

  uploadFileChunk(
    messages: Observable<FileChunkInterface>,
  ): OperationStatusResponseInterface;

  completeChunkUpload(completeChunk: CompleteChunkInterface);

  deleteTempFolder(
    filePath: FilePathInterface,
  ): OperationStatusResponseInterface;

  loadServerFromS3(
    serverId: ServerIdInterface,
  ): OperationStatusResponseInterface;

  moveServerToS3(serverId: ServerIdInterface): OperationStatusResponseInterface;
}
