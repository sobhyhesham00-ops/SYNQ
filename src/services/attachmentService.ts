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

  const processed = await Promise.all(
    attachments.map(async (att) => {
      // If there's no file object, it means it's either an old base64 attachment,
      // or an already uploaded file. Keep it exactly as is (metadata only).
      if (!att.file) return att;

      // Ensure a clean clone without the File object for Firestore
      const { file, ...attMeta } = att;
      
      const { uploadTask } = createUploadTask(file, entityType, entityId, replyOrRoot);
      await uploadTask;
      const downloadUrl = await getAttachmentDownloadURL(uploadTask);
      
      return {
        ...attMeta,
        url: downloadUrl
      };
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
