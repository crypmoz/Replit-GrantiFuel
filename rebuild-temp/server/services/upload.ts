import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Express, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../middleware/logger';

// Define allowed file types
const ALLOWED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

// Define storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = ALLOWED_FILE_TYPES[file.mimetype] || 'unknown';
    const uniqueFilename = `${Date.now()}-${uuidv4()}.${fileExt}`;
    cb(null, uniqueFilename);
  },
});

// File filter for allowed file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimetypes = Object.keys(ALLOWED_FILE_TYPES);
  
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${Object.values(ALLOWED_FILE_TYPES).join(', ')}`));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Helper to delete a file
const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

// Utility to get public URL for an uploaded file
const getFileUrl = (filename: string): string => {
  return `/uploads/${filename}`;
};

export { upload, deleteFile, getFileUrl };