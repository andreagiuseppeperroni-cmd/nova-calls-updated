
export type WallTargetType = 'city_wall' | 'personal_square';
export type WallPostType = 'text' | 'image' | 'audio' | 'mixed' | 'news' | 'event';
export type WallPostStatus = 'published' | 'hidden' | 'removed' | 'pending_review';

export type WallPost = {
  id: string;
  citySlug: string;
  cityName: string;
  authorName: string;
  authorInitials: string;
  neighborhood?: string;
  targetType: WallTargetType;
  postType: WallPostType;
  title: string;
  content: string;
  imageUrl?: string;
  imageName?: string;
  audioUrl?: string;
  audioName?: string;
  audioDuration?: string;
  isAnonymous?: boolean;
  reactions: string[];
  createdAtLabel: string;
};

export type CityRequestStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'archived';
