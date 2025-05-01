
import { supabase } from "@/lib/supabase";

// Interface for cost calculation input
export interface CostCalculationInput {
  hourlyRate: number;
  hours: number;
  employmentType: 'hourly' | 'salaried' | 'salary' | 'contractor';
  isFullTimeStudent?: boolean;
  annualSalary?: number;
  contractorRate?: number;
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
    // Normalize employment type to handle both 'salary' and 'salaried'
    const normalizedEmploymentType = input.employmentType === 'salary' ? 'salaried' : input.employmentType;
    
    // Use Supabase function to calculate costs
    const { data, error } = await supabase.rpc('calculate_employer_costs', {
      wage_rate: normalizedEmploymentType === 'contractor' ? (input.contractorRate || 0) : input.hourlyRate,
      hours_worked: input.hours,
      employment_type: normalizedEmploymentType,
      in_ft_education: input.isFullTimeStudent || false,
      annual_salary: input.annualSalary || 0
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
  const { hourlyRate, hours, employmentType, isFullTimeStudent, annualSalary, contractorRate } = input;
  
  // Constants for UK employment costs
  const WEEKLY_NI_THRESHOLD = 175; // National Insurance weekly threshold
  const NI_RATE = 0.138; // Employer NI rate (13.8%)
  const PENSION_RATE = 0.03; // Minimum employer pension contribution (3%)
  const WORKING_DAYS_PER_YEAR = 261; // 365 days - (52 weeks * 2 days off)
  
  // Initialize costs
  let basicPay = 0;
  let niCost = 0;
  let pensionCost = 0;
  
  // Normalize employment type to handle both 'salary' and 'salaried'
  const isSalaried = employmentType === 'salaried' || employmentType === 'salary';
  
  // Calculate basic pay based on employment type
  if (isSalaried && annualSalary) {
    // For salaried staff: Calculate daily rate based on annual salary
    const dailyRate = annualSalary / WORKING_DAYS_PER_YEAR;
    // Convert daily rate to hours worked for this shift
    basicPay = (dailyRate / 8) * hours; // Assuming 8-hour standard workday
    console.log(`Salaried staff cost calculation (${employmentType}): annual=${annualSalary}, daily=${dailyRate}, hours=${hours}, basicPay=${basicPay}`);
  } else if (employmentType === 'contractor') {
    // For contractors: Use contractor_rate instead of hourly rate
    const rate = contractorRate || 0;
    basicPay = rate * hours;
    console.log(`Contractor cost calculation: rate=${rate}, hours=${hours}, basicPay=${basicPay}`);
    // No NI or pension for contractors
  } else {
    // For hourly staff: Hourly rate * hours
    basicPay = hourlyRate * hours;
  }
  
  // Calculate NI and pension only if applicable:
  // - Not for contractors
  // - Not for full-time students
  if (employmentType !== 'contractor' && !isFullTimeStudent) {
    // Calculate NI if pay exceeds threshold
    if (basicPay > WEEKLY_NI_THRESHOLD) {
      niCost = (basicPay - WEEKLY_NI_THRESHOLD) * NI_RATE;
    }
    
    // Calculate pension contribution (only for eligible employees)
    pensionCost = basicPay * PENSION_RATE;
  }
  
  // Calculate total cost
  const totalCost = basicPay + niCost + pensionCost;

  // Debug logging
  console.log(`Cost calculation result for ${employmentType}:`, {
    basicPay, niCost, pensionCost, totalCost, 
    details: { hourlyRate, hours, isFullTimeStudent, annualSalary, contractorRate }
  });
  
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
 * Calculate daily cost for a salaried employee
 * Using 261 working days per year (365 days - 2 days off per week)
 */
export const calculateHourlyRateFromSalary = (
  annualSalary: number,
  hoursPerDay: number = 8
): number => {
  const WORKING_DAYS_PER_YEAR = 261; // 365 days - (52 weeks * 2 days off)
  const dailyRate = annualSalary / WORKING_DAYS_PER_YEAR;
  return dailyRate / hoursPerDay;
};

/**
 * Calculate shift cost based on staff profile and shift hours
 * This is a helper function to use in the rota scheduling components
 */
export const calculateShiftCost = (
  staffMember: any, 
  shiftHours: number
): CostCalculationResult => {
  // Ensure we have valid staff data
  if (!staffMember) {
    console.error('No staff member provided for cost calculation');
    return { basicPay: 0, niCost: 0, pensionCost: 0, totalCost: 0 };
  }

  // Extract relevant information from staff member profile
  const employmentType = staffMember.employment_type || 'hourly';
  const isFullTimeStudent = staffMember.is_full_time_student || false;
  
  // Use the correct rate field based on employment type
  let hourlyRate = 0;
  let annualSalary = 0;
  let contractorRate = 0;
  
  // Normalize employment type check to handle both 'salary' and 'salaried'
  const isSalaried = employmentType === 'salaried' || employmentType === 'salary';
  
  if (isSalaried) {
    annualSalary = staffMember.annual_salary || 0;
  } else if (employmentType === 'hourly') {
    hourlyRate = staffMember.wage_rate || 0;
  } else if (employmentType === 'contractor') {
    contractorRate = staffMember.contractor_rate || 0;
  }

  console.log(`Calculating shift cost for ${staffMember.first_name} ${staffMember.last_name}:`, {
    employmentType,
    isSalaried,
    isFullTimeStudent,
    hourlyRate,
    annualSalary,
    contractorRate,
    shiftHours
  });

  // Create input for calculation
  const input: CostCalculationInput = {
    hourlyRate,
    hours: shiftHours,
    employmentType,
    isFullTimeStudent,
    annualSalary,
    contractorRate
  };

  // Use local calculation instead of async Supabase RPC
  return fallbackCostCalculation(input);
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
