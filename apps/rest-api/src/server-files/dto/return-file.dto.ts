import { FileType } from '../file-type.enum';

export class ReturnFileDto {
  /**
   * The Name of the file
   */
  name: string;

  /**
   * The type of the file
   */
  type: FileType;

  /**
   * The path of the file
   */
  path: string;

  /**
   * The size of the file is undefined if the type is FOLDER
   */
  size?: number;

  /**
   * The date when the file was created
   */
  created: Date;

  /**
   * The date when the file was last changed
   */
  changed: Date;

  /**
   * Indicates if the file can be edit. Undefined when the type is FOLDER
   */
  isEditable?: boolean;

  /**
   * Indicates if the file can be downloaded. Undefined when the type is FOLDER
   */
  isDownloadable?: boolean;
}
