
import { supabase } from "@/lib/supabase";

// Interface for cost calculation input
export interface CostCalculationInput {
  hourlyRate: number;
  hours: number;
  employmentType: 'hourly' | 'salaried' | 'contractor';
  isFullTimeStudent?: boolean;
}

// Interface for cost calculation results
export interface CostCalculationResult {
  basicPay: number;
  niCost: number;
  pensionCost: number;
  totalCost: number;
}

/**
 * Calculate employer costs including National Insurance and pension
 */
export const calculateEmployerCosts = async (input: CostCalculationInput): Promise<CostCalculationResult> => {
  try {
    // Use Supabase function to calculate costs
    const { data, error } = await supabase.rpc('calculate_employer_costs', {
      wage_rate: input.hourlyRate,
      hours_worked: input.hours,
      employment_type: input.employmentType,
      in_ft_education: input.isFullTimeStudent || false
    });

    if (error) {
      console.error('Error calculating employer costs:', error);
      // Fallback to local calculation
      return fallbackCostCalculation(input);
    }

    return {
      basicPay: data.basic_pay,
      niCost: data.ni_cost,
      pensionCost: data.pension_cost,
      totalCost: data.total_cost
    };
  } catch (error) {
    console.error('Exception calculating employer costs:', error);
    return fallbackCostCalculation(input);
  }
};

/**
 * Fallback calculation if the RPC fails
 */
const fallbackCostCalculation = (input: CostCalculationInput): CostCalculationResult => {
  const { hourlyRate, hours, employmentType, isFullTimeStudent } = input;
  
  // Constants for UK employment costs
  const WEEKLY_NI_THRESHOLD = 175; // National Insurance weekly threshold
  const NI_RATE = 0.138; // Employer NI rate (13.8%)
  const PENSION_RATE = 0.03; // Minimum employer pension contribution (3%)
  
  // Calculate basic pay
  const basicPay = hourlyRate * hours;
  
  // Initialize additional costs
  let niCost = 0;
  let pensionCost = 0;
  
  // Calculate NI and pension only for employees (not contractors)
  // and different calculation if in full time education
  if (employmentType !== 'contractor' && !isFullTimeStudent) {
    // Calculate NI if pay exceeds threshold
    if (basicPay > WEEKLY_NI_THRESHOLD) {
      niCost = (basicPay - WEEKLY_NI_THRESHOLD) * NI_RATE;
    }
    
    // Calculate pension contribution
    pensionCost = basicPay * PENSION_RATE;
  }
  
  // Calculate total cost
  const totalCost = basicPay + niCost + pensionCost;
  
  return {
    basicPay,
    niCost,
    pensionCost,
    totalCost
  };
};

/**
 * Get the corresponding job role ID for a job title based on role mappings
 */
export const getJobRoleIdForJobTitle = async (
  jobTitle: string,
  targetRoleId: string,
  locationId: string
): Promise<string | null> => {
  try {
    // First check if the job title directly maps to the target role
    const { data, error } = await supabase
      .from('job_role_mappings')
      .select('job_role_id')
      .eq('job_title', jobTitle)
      .eq('job_role_id', targetRoleId)
      .eq('location_id', locationId)
      .single();
    
    if (!error && data) {
      return data.job_role_id;
    }
    
    // If no direct match, find any role mapping for this job title
    // sorted by priority to get the best match
    const { data: alternativeData, error: alternativeError } = await supabase
      .from('job_role_mappings')
      .select('job_role_id')
      .eq('job_title', jobTitle)
      .eq('location_id', locationId)
      .order('priority', { ascending: true })
      .limit(1);
    
    if (!alternativeError && alternativeData && alternativeData.length > 0) {
      return alternativeData[0].job_role_id;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding job role for job title:', error);
    return null;
  }
};

/**
 * Calculate hourly cost for a salaried employee
 */
export const calculateHourlyRateFromSalary = (
  annualSalary: number,
  hoursPerWeek: number = 40
): number => {
  const WEEKS_PER_YEAR = 52;
  return annualSalary / (hoursPerWeek * WEEKS_PER_YEAR);
};

/**
 * Generate a formatted cost breakdown for display
 */
export const generateCostBreakdown = (costs: CostCalculationResult): string => {
  return `Basic Pay: £${costs.basicPay.toFixed(2)}
NI: £${costs.niCost.toFixed(2)}
Pension: £${costs.pensionCost.toFixed(2)}
Total: £${costs.totalCost.toFixed(2)}`;
};
