export interface Batch {
  id: number | string;
  title: string;
  thumbnail: string;
  category?: string;
  tag?: string;
}

export type MaterialType = 'FOLDER' | 'VIDEO' | 'PDF' | 'NOTES' | 'TEST' | string;

export interface ContentItem {
  id: string;
  parent_id?: string;
  Title?: string;
  title?: string;
  material_type: MaterialType;
  type?: MaterialType;
  thumbnail?: string;
  description?: string;
  event_date?: string;
  date_and_time?: string;
  duration?: string;
  duration_in_secs?: string;
  file_link?: string;
  pdf_link?: string;
  pdf_link2?: string;
  download_link?: string;
  course_id?: string;
  live_status?: number | string;
  videos_count?: string | number;
  files_count?: string | number;
  tests_count?: string | number;
}

export interface VideoQuality {
  quality: string;
  url: string;
  player_url?: string;
}

export interface VideoDetails {
  success?: boolean;
  video_id: string;
  course_id: string;
  title: string;
  thumbnail?: string;
  decoded_video_link?: string;
  file_link?: string;
  player_url?: string;
  qualities?: VideoQuality[];
  decoded_pdf_link?: string | null;
  source?: string;
}

export interface BreadcrumbItem {
  id: string;
  title: string;
}
