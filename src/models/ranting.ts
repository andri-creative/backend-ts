export type RatingLabel = "Very Bad" | "Bad" | "Neutral" | "Good" | "Very Good";

export interface Ranting {
  id: string;
  label: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RantingState {
  averageRating: number;
  totalRating: number;
  rantingDistribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

export interface CreateRanting {
  label: RatingLabel;
  rating: number;
}
