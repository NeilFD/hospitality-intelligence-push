
export interface HospitalityGuide {
  id: string;
  name: string;
  category: string;
  description?: string;
  timeToCompleteMinutes: number;
  steps: HospitalityStep[];
  detailedProcedure?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  postedToNoticeboard: boolean;
}

export interface HospitalityStep {
  id: string;
  name: string;
}

export interface HospitalityFilterOptions {
  searchTerm: string;
  category: string;
  letter: string | null;
  status?: 'live' | 'archived';
}
