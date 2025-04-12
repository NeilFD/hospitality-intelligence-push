
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
}

export type HospitalityFilterOptions = {
  department?: string;
  category?: string;
  archived?: boolean;
};

