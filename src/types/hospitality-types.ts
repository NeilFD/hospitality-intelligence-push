
export interface HospitalityGuideStep {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface HospitalityGuide {
  id: string;
  name: string;
  category: string;
  description?: string;
  timeToCompleteMinutes: number;
  steps: HospitalityGuideStep[];
  detailedProcedure?: string;
  department?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
  postedToNoticeboard?: boolean;
}

export type HospitalityFilterOptions = {
  searchTerm?: string;
  category?: string;
  letter?: string | null;
  status?: 'live' | 'archived';
};
