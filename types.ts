export interface GeneratedContent {
  linkedinPost?: {
    copy: string;
  };
  facebookPost?: {
    copy: string;
    hashtags: string[];
  };
  twitterPost?: {
    copy: string;
    hashtags: string[];
  };
  graphicText?: {
    text: string;
    imageUrl?: string;
  };
}

export interface ScheduledPost {
  id: string;
  platform: 'LinkedIn' | 'Twitter' | 'Facebook' | 'Graphic Text';
  content: string;
  scheduledTime: Date;
}