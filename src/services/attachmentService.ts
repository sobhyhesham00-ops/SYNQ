import { storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from "firebase/storage";
import { FileAttachment } from "../types";

export interface UploadProgress {
  progress: number;
  fileName: string;
  bytesTransferred: number;
  totalBytes: number;
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export const processAttachments = async (
  attachments: FileAttachment[] | undefined,
  entityType: string,
  entityId: string,
  replyOrRoot: string
): Promise<FileAttachment[]> => {
  if (!attachments || attachments.length === 0) return [];

  const uploadTimeoutMs = 15000; // 15s timeout for attachments

  const processed = await Promise.all(
    attachments.map(async (att) => {
      if (!att.file) return att;
      const { file, ...attMeta } = att;

      try {
        const downloadUrl = await new Promise<string>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Upload timed out after ${uploadTimeoutMs}ms`));
          }, uploadTimeoutMs);

          const { uploadTask } = createUploadTask(
            file, entityType, entityId, replyOrRoot
          );
          uploadTask.on(
            'state_changed',
            null, 
            (error) => {
              clearTimeout(timeoutId);
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                clearTimeout(timeoutId);
                resolve(url);
              } catch (e) {
                clearTimeout(timeoutId);
                reject(e);
              }
            }
          );
        });

        return {
          ...attMeta,
          url: downloadUrl,
          file: undefined,
        };
      } catch (err) {
        console.error(`Failed to upload ${att.name}:`, err);
        return { ...attMeta, file: undefined };
      }
    })
  );

  return processed;
};

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const BLOCKED_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".js", ".sh", ".ps1", ".vbs", ".scr", ".com"];
const BLOCKED_MIME_TYPES = [
  "application/x-msdownload",
  "application/x-sh",
  "application/javascript",
  "text/javascript",
  "application/x-executable",
];

export const validateFile = (file: File): UploadValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File ${file.name} exceeds 20MB limit.` };
  }

  const nameLower = file.name.toLowerCase();
  const hasBlockedExt = BLOCKED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
  if (hasBlockedExt) {
    return { valid: false, error: `File type for ${file.name} is not allowed for security reasons.` };
  }

  if (BLOCKED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `MIME type for ${file.name} is not allowed.` };
  }

  return { valid: true };
};

export const createUploadTask = (
  file: File,
  entityType: string,
  entityId: string,
  replyOrRoot: string
): { uploadTask: UploadTask; fileMeta: Partial<FileAttachment> } => {
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `case-attachments/${entityType}/${entityId}/${replyOrRoot}/${timestamp}-${safeFileName}`;
  const storageRef = ref(storage, path);
  
  const uploadTask = uploadBytesResumable(storageRef, file);

  const fileMeta: Partial<FileAttachment> = {
    id: `att_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
  };

  return { uploadTask, fileMeta };
};

export const getAttachmentDownloadURL = async (uploadTask: UploadTask): Promise<string> => {
  return await getDownloadURL(uploadTask.snapshot.ref);
};
