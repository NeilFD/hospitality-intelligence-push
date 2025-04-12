
export interface HospitalityStep {
  id: string;
  name: string;
}

export interface HospitalityGuide {
  id: string;
  name: string;
  category: string;
  description: string;
  steps: HospitalityStep[];
  department?: string;
  timeToCompleteMinutes: number;
  detailedProcedure?: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  archived?: boolean;
  postedToNoticeboard?: boolean;
}

export type HospitalityFilterOptions = {
  searchTerm?: string;
  department?: string;
  category?: string;
  archived?: boolean;
  letter?: string | null;
  status?: 'live' | 'archived';
};
