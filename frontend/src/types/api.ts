export interface UploadProgressEvent {
  loaded: number;
  total?: number;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  onUploadProgress?: (progressEvent: UploadProgressEvent) => void;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
}

export interface DownloadResponse {
  data: Blob;
}
