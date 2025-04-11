declare module 'express-compression' {
  import { RequestHandler } from 'express';
  
  interface CompressionOptions {
    threshold?: number;
    filter?: (req: any, res: any) => boolean;
    chunkSize?: number;
    level?: number;
    memLevel?: number;
  }
  
  function compression(options?: CompressionOptions): RequestHandler;
  
  export = compression;
}