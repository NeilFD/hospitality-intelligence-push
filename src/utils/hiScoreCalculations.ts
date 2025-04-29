
// Calculation logic for Hi Score weighted averages
export const calculateWeightedScore = (
  scores: { [category: string]: number },
  weights: { [category: string]: number }
): number => {
  const totalWeighted = Object.keys(scores).reduce((sum, key) => {
    return sum + scores[key] * weights[key];
  }, 0);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return +(totalWeighted / totalWeight).toFixed(2);
};

// FOH weights
export const FOH_WEIGHTS = {
  hospitality: 0.4, // 40%
  friendliness: 0.2, // 20%
  internalTeamSkills: 0.2, // 20%
  serviceSkills: 0.1, // 10%
  fohKnowledge: 0.1, // 10%
};

// Kitchen weights
export const KITCHEN_WEIGHTS = {
  workEthic: 0.35, // 35%
  teamPlayer: 0.25, // 25%
  adaptability: 0.2, // 20%
  cookingSkills: 0.1, // 10%
  foodKnowledge: 0.1, // 10%
};

// Define types for our score objects
export type FohScores = {
  hospitality: number;
  friendliness: number;
  internalTeamSkills: number;
  serviceSkills: number;
  fohKnowledge: number;
};

export type KitchenScores = {
  workEthic: number;
  teamPlayer: number;
  adaptability: number;
  cookingSkills: number;
  foodKnowledge: number;
};

export type ScoreType = FohScores | KitchenScores;

// Helper function to initialize an empty score object
export const getEmptyScores = (roleType: 'foh' | 'kitchen'): ScoreType => {
  if (roleType === 'foh') {
    return {
      hospitality: 0,
      friendliness: 0,
      internalTeamSkills: 0,
      serviceSkills: 0,
      fohKnowledge: 0,
    };
  } else {
    return {
      workEthic: 0,
      teamPlayer: 0,
      adaptability: 0,
      cookingSkills: 0,
      foodKnowledge: 0,
    };
  }
};
