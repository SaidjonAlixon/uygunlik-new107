export type RatingPeriod = 'today' | 'week' | 'last_week';

export interface RatingEntry {
  rank: number;
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  is_perfect: boolean;
  tests_count: number;
}

export interface LessonRating {
  id: number;
  title: string;
  order_number: number;
  leaderboard: RatingEntry[];
}

export interface SectionRating {
  id: number;
  name: string;
  order_number: number;
  leaderboard: RatingEntry[];
  lessons: LessonRating[];
}

export interface RatingData {
  period: RatingPeriod;
  period_label: string;
  tariff_id: number | null;
  tariff_name: string;
  overall_leaderboard: RatingEntry[];
  tariff_leaderboard: RatingEntry[];
  sections: SectionRating[];
  total_submissions: number;
}
