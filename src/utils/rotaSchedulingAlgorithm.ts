import { format, parseISO } from 'date-fns';

/**
 * This algorithm generates optimal staff schedules based on:
 * 1. Revenue forecasts
 * 2. Staff Hi Scores for skill rankings
 * 3. Labor cost targets
 * 4. UK employment regulations
 * 5. Existing shift rules
 * 6. Staffing troughs for quiet periods
 */
export class RotaSchedulingAlgorithm {
  private request: any;
  private staff: any[];
  private jobRoles: any[];
  private thresholds: any[];
  private location: any;
  private shiftRules: any[] = [];
  private troughPeriods: any[] = [];
  private roleMapping: any[] = [];
  private dailyStaffAllocations: Record<string, Record<string, any>> = {};
  private partShiftConfig = {
    enable: true,
    minHours: 3,
    maxHours: 5,
    dayLatestStart: '12:00:00',
    eveningLatestStart: '18:00:00'
  };
  private salariedWeight = 100; // Priority weight for salaried staff
  private managerWeight = 50;   // Priority weight for managers
  private hiScoreWeight = 1;    // Priority multiplier for HiScore

  constructor({ 
    request, 
    staff, 
    jobRoles, 
    thresholds, 
    location 
  }: { 
    request: any; 
    staff: any[]; 
    jobRoles: any[]; 
    thresholds: any[]; 
    location: any; 
  }) {
    this.request = request;
    this.staff = staff;
    this.jobRoles = jobRoles;
    this.thresholds = thresholds;
    this.location = location;
  }

  /**
   * Set the shift rules to be used in scheduling
   */
  setShiftRules(shiftRules: any[]) {
    this.shiftRules = shiftRules || [];
    console.log(`Set ${this.shiftRules.length} shift rules for scheduling`);
  }
  
  /**
   * Set the trough periods for scheduling
   */
  setTroughPeriods(troughPeriods: any[]) {
    this.troughPeriods = troughPeriods || [];
    console.log(`Set ${this.troughPeriods.length} trough periods for scheduling`);
  }

  /**
   * Set the role mapping data from job_role_mappings table
   */
  setRoleMapping(roleMapping: any[]) {
    this.roleMapping = roleMapping || [];
    console.log(`Set ${this.roleMapping.length} role mappings for scheduling`);
  }
  
  /**
   * NEW: Set part shift configuration options
   */
  setPartShiftConfig({
    enable = true,
    minHours = 3,
    maxHours = 5,
    dayLatestStart = '12:00:00',
    eveningLatestStart = '18:00:00'
  }: {
    enable?: boolean;
    minHours?: number;
    maxHours?: number;
    dayLatestStart?: string;
    eveningLatestStart?: string;
  }) {
    this.partShiftConfig = {
      enable,
      minHours,
      maxHours,
      dayLatestStart,
      eveningLatestStart
    };
    console.log(`Part shift config updated: enabled=${enable}, min=${minHours}h, max=${maxHours}h`);
  }

  /**
   * Check if a job title is a management role
   * FIXED: Now uses proper word boundary checking to prevent false matches
   */
  isManagerRole(jobTitle: string): boolean {
    if (!jobTitle) return false;
    
    const lowerTitle = jobTitle.toLowerCase();
    
    // Check for management keywords with word boundaries
    return /\b(manager|head chef|supervisor|gm|general manager)\b/i.test(lowerTitle);
  }
  
  /**
   * Set staff priority configuration
   * FIX: Ensure all parameters are properly typed as numbers
   */
  setStaffPriorityConfig({
    salariedWeight = 100,
    managerWeight = 50,
    hiScoreWeight = 1
  }: {
    salariedWeight?: number;
    managerWeight?: number;
    hiScoreWeight?: number;
  }) {
    // FIX: Ensure parameters are numbers before assigning
    this.salariedWeight = salariedWeight;
    this.managerWeight = managerWeight;
    this.hiScoreWeight = hiScoreWeight;
    
    console.log(`Staff priority weights updated: salaried=${salariedWeight}, manager=${managerWeight}, hiScore=${hiScoreWeight}`);
  }

  /**
   * Generate a complete schedule based on the configuration
   */
  async generateSchedule() {
    console.log('Starting schedule generation');
    
    // Log the entire request object to troubleshoot
    console.log('Request object:', this.request);
    
    // Get dates from request or generate them if not provided
    const dates = this.request.dates || [];
    console.log(`Processing ${dates.length} dates for scheduling`);
    
    if (!dates.length) {
      console.error('No dates provided in request');
      // If no dates are provided, try to generate them from start and end dates
      if (this.request.week_start_date && this.request.week_end_date) {
        const startDate = new Date(this.request.week_start_date);
        const endDate = new Date(this.request.week_end_date);
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          dates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`Generated dates array from week bounds: ${dates.join(', ')}`);
      } else {
        return {
          shifts: [],
          total_cost: 0,
          revenue_forecast: 0,
          cost_percentage: 0
        };
      }
    }
    
    // Initialize result object
    const result = {
      request_id: this.request.id,
      location_id: this.location.id,
      week_start_date: this.request.week_start_date,
      week_end_date: this.request.week_end_date,
      revenue_forecast: 0,
      total_cost: 0,
      cost_percentage: 0,
      shifts: [] as any[]
    };
    
    // Initialize daily staff allocations
    this.dailyStaffAllocations = {};
    
    // Calculate total revenue forecast
    const totalRevenueForecast = this.calculateTotalRevenue(this.request.revenue_forecast);
    result.revenue_forecast = totalRevenueForecast;
    
    console.log(`Total revenue forecast: £${totalRevenueForecast}`);
    
    // Rank staff by priority
    const rankedStaff = this.rankStaffByPriority();
    console.log(`Ranked ${rankedStaff.length} staff members by priority`);
    
    // Initialize weekly staff allocations
    const staffWeeklyAllocations: Record<string, any> = {};
    rankedStaff.forEach(staff => {
      staffWeeklyAllocations[staff.id] = {
        hoursWorked: 0,
        daysWorked: [],
        shifts: []
      };
    });
    
    // Initialize daily staff allocations for each date
    dates.forEach(date => {
      this.dailyStaffAllocations[date] = {};
      rankedStaff.forEach(staff => {
        this.dailyStaffAllocations[date][staff.id] = {
          hoursWorked: 0,
          shifts: [],
          salaryApplied: false
        };
      });
    });
    
    // Process each date
    let totalCost = 0;
    for (const date of dates) {
      const dayOfWeek = format(parseISO(date), 'EEEE').toLowerCase();
      const dayRevenue = this.safelyGetRevenue(date);
      
      console.log(`\nProcessing ${dayOfWeek} ${date} - Revenue: £${dayRevenue}`);
      
      // Get shift rules for this day
      const dayRules = this.getShiftRulesForDay(dayOfWeek);
      console.log(`Found ${dayRules.length} shift rules for ${dayOfWeek}`);
      
      // Apply shift rules first
      for (const rule of dayRules) {
        await this.assignShiftRuleStaff({
          date,
          dayOfWeek,
          rule,
          rankedStaff,
          staffWeeklyAllocations,
          shifts: result.shifts,
          totalCost,
          dayRevenue
        });
      }
      
      // Find applicable threshold based on revenue
      const threshold = this.findThreshold(dayRevenue);
      
      if (threshold) {
        console.log(`Using threshold for revenue £${dayRevenue}: ${threshold.name || 'Unnamed threshold'}`);
        
        // Enforce minimum staffing levels from thresholds
        this.enforceThresholdMinimums({
          date,
          dayOfWeek,
          dayRevenue,
          rankedStaff,
          staffWeeklyAllocations,
          shifts: result.shifts,
          totalCost
        });
      } else {
        console.log(`No threshold found for revenue £${dayRevenue}, using defaults`);
        
        // Use default staffing values
        this.assignStaffWithDefaults(
          date,
          dayOfWeek,
          dayRevenue,
          rankedStaff,
          staffWeeklyAllocations,
          result.shifts,
          totalCost
        );
      }
    }
    
    // Balance shifts to ensure staff meet their minimum hour requirements
    this.balanceShiftsForMinimumHours(
      result.shifts,
      staffWeeklyAllocations,
      rankedStaff,
      totalCost
    );
    
    // Redistribute hours from managers to non-managers if needed
    this.redistributeFromManagersIfNeeded(
      result.shifts,
      staffWeeklyAllocations,
      rankedStaff,
      totalCost
    );
    
    // Calculate final total cost
    result.total_cost = result.shifts.reduce((sum, shift) => sum + (shift.total_cost || 0), 0);
    
    // Calculate cost percentage
    if (totalRevenueForecast > 0) {
      result.cost_percentage = (result.total_cost / totalRevenueForecast) * 100;
    }
    
    console.log(`\nSchedule generation complete:`);
    console.log(`- Total shifts: ${result.shifts.length}`);
    console.log(`- Total cost: £${result.total_cost.toFixed(2)}`);
    console.log(`- Cost percentage: ${result.cost_percentage.toFixed(1)}%`);
    
    return result;
  };
  
  /**
   * NEW: Balance shifts to ensure staff meet their minimum hour requirements
   * This function attempts to reassign shifts from staff with no minimums to those with unmet minimums
   */
  balanceShiftsForMinimumHours(
    shifts: any[],
    staffWeeklyAllocations: Record<string, any>,
    rankedStaff: any[],
    totalCost: number
  ): void {
    console.log("Starting shift balancing for minimum hours...");
    
    // First, identify staff who are below their minimum hours
    const staffBelowMinimumHours = rankedStaff.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      const minHoursPerWeek = staff.min_hours_per_week || 0;
      
      if (minHoursPerWeek <= 0) return false; // Skip staff with no minimum
      
      const currentHours = allocation ? allocation.hoursWorked : 0;
      const hourDeficit = minHoursPerWeek - currentHours;
      
      if (hourDeficit > 2) { // Only consider significant deficits (more than 2 hours)
        console.log(`${staff.first_name} ${staff.last_name} is ${hourDeficit.toFixed(1)} hours below minimum (${minHoursPerWeek}h): currently ${currentHours.toFixed(1)}h`);
        return true;
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by largest deficit percentage first
      const aAllocation = staffWeeklyAllocations[a.id];
      const bAllocation = staffWeeklyAllocations[b.id];
      
      const aMinHours = a.min_hours_per_week || 0;
      const bMinHours = b.min_hours_per_week || 0;
      
      const aCurrentHours = aAllocation ? aAllocation.hoursWorked : 0;
      const bCurrentHours = bAllocation ? bAllocation.hoursWorked : 0;
      
      // Calculate percentage of minimum hours met
      const aPercentMet = aMinHours > 0 ? (aCurrentHours / aMinHours) * 100 : 100;
      const bPercentMet = bMinHours > 0 ? (bCurrentHours / bMinHours) * 100 : 100;
      
      // Sort ascending by percentage met (lowest percentage first)
      return aPercentMet - bPercentMet;
    });
    
    if (staffBelowMinimumHours.length === 0) {
      console.log("No staff significantly below minimum hours found.");
      return;
    }
    
    console.log(`Found ${staffBelowMinimumHours.length} staff significantly below minimum hours`);
    
    // Identify staff who have no minimum hours but have been assigned shifts
    const staffWithNoMinimums = rankedStaff.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      const minHoursPerWeek = staff.min_hours_per_week || 0;
      
      // Staff with no minimum hours who have been allocated shifts
      return minHoursPerWeek === 0 && allocation && allocation.hoursWorked > 0;
    }).sort((a, b) => {
      // Sort by most hours allocated first
      const aHours = staffWeeklyAllocations[a.id].hoursWorked;
      const bHours = staffWeeklyAllocations[b.id].hoursWorked;
      
      // Sort descending (most hours first)
      return bHours - aHours;
    });
    
    console.log(`Found ${staffWithNoMinimums.length} staff with no minimums but assigned shifts`);
    
    // Group shifts by day and role to find potential swaps
    const shiftsByDayAndRole: Record<string, Record<string, any[]>> = {};
    
    shifts.forEach(shift => {
      const key = `${shift.date}`;
      if (!shiftsByDayAndRole[key]) {
        shiftsByDayAndRole[key] = {};
      }
      
      const roleKey = shift.job_role_id;
      if (!shiftsByDayAndRole[key][roleKey]) {
        shiftsByDayAndRole[key][roleKey] = [];
      }
      
      shiftsByDayAndRole[key][roleKey].push(shift);
    });
    
    // For each staff member below minimum hours, try to find swaps or add shifts
    for (const staffMember of staffBelowMinimumHours) {
      const allocation = staffWeeklyAllocations[staffMember.id];
      const minHoursPerWeek = staffMember.min_hours_per_week || 0;
      const currentHours = allocation ? allocation.hoursWorked : 0;
      // Changed from const to let since we'll be modifying this value
      let hourDeficit = minHoursPerWeek - currentHours;
      
      console.log(`Attempting to balance hours for ${staffMember.first_name} ${staffMember.last_name}: needs ${hourDeficit.toFixed(1)} more hours`);
      
      // Check if eligible for additional days
      const currentDays = allocation.daysWorked.length;
      const maxDays = staffMember.max_days_per_week || 5;
      const canAddMoreDays = currentDays < maxDays;
      
      // Try to swap shifts - look at shifts assigned to staff with no minimums
      for (const noMinStaff of staffWithNoMinimums) {
        const noMinAllocation = staffWeeklyAllocations[noMinStaff.id];
        
        // Skip if staff with no minimums has fewer hours than our deficit
        if (noMinAllocation.hoursWorked < hourDeficit) {
          continue;
        }
        
        // Get shifts assigned to this staff member with no minimums
        const candidateShifts = shifts.filter(shift => 
          shift.profile_id === noMinStaff.id
        ).sort((a, b) => {
          // Prefer longer shifts for swapping
          const aHours = this.calculateHours(a.start_time, a.end_time, a.break_minutes);
          const bHours = this.calculateHours(b.start_time, b.end_time, b.break_minutes);
          
          // Sort descending (longest first)
          return bHours - aHours;
        });
        
        // Try to swap suitable shifts
        for (const shift of candidateShifts) {
          // Check if the understaffed person is eligible for this role
          const jobRole = this.jobRoles.find(r => r.id === shift.job_role_id);
          if (!jobRole) continue;
          
          const isEligible = this.isStaffEligibleForRole(staffMember, jobRole);
          if (!isEligible) {
            console.log(`${staffMember.first_name} not eligible for ${jobRole.title} role, cannot swap`);
            continue;
          }
          
          // Check if day is already worked - can only add more hours if already working that day
          const isAlreadyWorkingThatDay = allocation.daysWorked.includes(shift.date);
          
          if (!isAlreadyWorkingThatDay && !canAddMoreDays) {
            // Skip if already at max days and not working this day
            continue;
          }
          
          const shiftHours = this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes);
          
          // Check if adding this shift would put them over max daily hours
          if (isAlreadyWorkingThatDay) {
            const dailyAlloc = this.dailyStaffAllocations[shift.date]?.[staffMember.id];
            const currentDailyHours = dailyAlloc ? dailyAlloc.hoursWorked : 0;
            const maxHoursPerDay = staffMember.max_hours_per_day || 12;
            
            if (currentDailyHours + shiftHours > maxHoursPerDay) {
              console.log(`Cannot swap - would exceed max daily hours on ${shift.date}`);
              continue;
            }
          }
          
          console.log(`Found suitable shift swap: ${shift.date} ${shift.start_time}-${shift.end_time} (${shiftHours}h) from ${noMinStaff.first_name} to ${staffMember.first_name}`);
          
          // Perform the swap - update the shift and allocations
          
          // First, remove hours from the original staff member
          this.removeShiftAllocation(noMinStaff.id, shift, staffWeeklyAllocations);
          
          // Check if this role is a secondary role for the new staff member
          const isSecondaryRole = this.isSecondaryRole(staffMember, jobRole);
          
          // Calculate costs for the new staff member
          const { shiftCost, niCost, pensionCost, totalShiftCost } = 
            this.calculateCosts(staffMember, shiftHours, shift.date);
          
          // Update the shift with new staff details
          shift.profile_id = staffMember.id;
          shift.is_secondary_role = isSecondaryRole;
          shift.hi_score = staffMember.hi_score || 0;
          shift.shift_cost = shiftCost;
          shift.employer_ni_cost = niCost;
          shift.employer_pension_cost = pensionCost;
          shift.total_cost = totalShiftCost;
          shift.is_balanced_shift = true; // Mark as a balanced shift
          
          // Add hours to the new staff member
          this.updateStaffAllocations(staffMember.id, shift.date, shiftHours, shift, staffWeeklyAllocations);
          
          // Adjust the running hour deficit
          hourDeficit -= shiftHours;
          
          // If we've met the minimum hours, stop looking for more shifts
          if (hourDeficit <= 2) {
            console.log(`${staffMember.first_name}'s hour deficit resolved or now minimal: ${hourDeficit.toFixed(1)}h`);
            break;
          }
        }
        
        // If the deficit is resolved, stop processing this staff member
        if (hourDeficit <= 2) {
          break;
        }
      }
      
      // Log the final status after balancing attempts
      const updatedAllocation = staffWeeklyAllocations[staffMember.id];
      const updatedHours = updatedAllocation ? updatedAllocation.hoursWorked : 0;
      const remainingDeficit = minHoursPerWeek - updatedHours;
      
      if (remainingDeficit > 2) {
        console.log(`⚠️ Could not fully resolve hour deficit for ${staffMember.first_name}: still needs ${remainingDeficit.toFixed(1)} more hours`);
      } else {
        console.log(`✓ Successfully balanced hours for ${staffMember.first_name}: now at ${updatedHours.toFixed(1)}h (min: ${minHoursPerWeek}h)`);
      }
    }
    
    console.log("Shift balancing completed.");
  }

  /**
   * NEW: Check if a staff member is eligible for a specific role
   * This consolidates role eligibility checking into a single function
   */
  isStaffEligibleForRole(staff: any, jobRole: any): boolean {
    if (!staff || !jobRole) return false;
    
    // Check if this is their primary role
    if (staff.job_title === jobRole.title) {
      return true;
    }
    
    // Check if this is one of their secondary roles
    if (Array.isArray(staff.secondary_job_roles) && 
        staff.secondary_job_roles.includes(jobRole.title)) {
      return true;
    }
    
    // Check role mappings if available
    if (this.roleMapping && this.roleMapping.length > 0) {
      // Find mapping for this staff member's primary role
      const mapping = this.roleMapping.find(m => 
        m.primary_role === staff.job_title && 
        m.can_work_as === jobRole.title
      );
      
      if (mapping) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * NEW: Remove hours from a staff allocation (for shift swapping)
   */
  removeShiftAllocation(
    staffId: string,
    shift: any,
    weeklyAllocations: Record<string, any>
  ): void {
    if (!staffId || !shift || !weeklyAllocations[staffId]) return;
    
    const hours = this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes);
    
    // Update weekly allocation
    weeklyAllocations[staffId].hoursWorked -= hours;
    
    // Remove shift from weekly allocation
    weeklyAllocations[staffId].shifts = weeklyAllocations[staffId].shifts.filter((s: any) => 
      !(s.date === shift.date && s.start_time === shift.start_time)
    );
    
    // Check if staff still has any shifts on this date
    const hasOtherShiftsOnDate = weeklyAllocations[staffId].shifts.some((s: any) => s.date === shift.date);
    
    if (!hasOtherShiftsOnDate) {
      // Remove date from days worked
      weeklyAllocations[staffId].daysWorked = weeklyAllocations[staffId].daysWorked.filter(
        (d: string) => d !== shift.date
      );
    }
    
    // Update daily allocation
    if (this.dailyStaffAllocations[shift.date]?.[staffId]) {
      this.dailyStaffAllocations[shift.date][staffId].hoursWorked -= hours;
      
      // Remove shift from daily allocation
      this.dailyStaffAllocations[shift.date][staffId].shifts = 
        this.dailyStaffAllocations[shift.date][staffId].shifts.filter((s: any) => 
          !(s.start_time === shift.start_time)
        );
    }
  }

  /**
   * Enforce minimum staff counts from thresholds if not met by shift rules
   */
  enforceThresholdMinimums({
    date,
    dayOfWeek,
    dayRevenue,
    rankedStaff,
    staffWeeklyAllocations,
    shifts,
    totalCost
  }: {
    date: string;
    dayOfWeek: string;
    dayRevenue: number;
    rankedStaff: any[];
    staffWeeklyAllocations: Record<string, any>;
    shifts: any[];
    totalCost: number;
  }) {
    // Find applicable threshold based on revenue
    const threshold = this.findThreshold(dayRevenue);
    if (!threshold) return;
    
    // Count existing shifts by type for this date
    const existingShifts = shifts.filter(shift => shift.date === date);
    
    // Count how many of each staff type we already have
    const fohStaffCount = existingShifts.filter(shift => {
      const role = this.jobRoles.find(r => r.id === shift.job_role_id);
      return role && !role.is_kitchen;
    }).length;
    
    const kitchenStaffCount = existingShifts.filter(shift => {
      const role = this.jobRoles.find(r => r.id === shift.job_role_id);
      return role && role.is_kitchen && role.title !== 'KP';
    }).length;
    
    const kpStaffCount = existingShifts.filter(shift => {
      const role = this.jobRoles.find(r => r.id === shift.job_role_id);
      return role && role.title === 'KP';
    }).length;
    
    console.log(`Current staff counts for ${date}: FOH=${fohStaffCount}, Kitchen=${kitchenStaffCount}, KP=${kpStaffCount}`);
    
    // Check if minimum thresholds are met, and add more staff if needed
    const daySegment = this.isWeekend(dayOfWeek) ? 'weekend-day' : 'weekday-day';
    const eveningSegment = this.isWeekend(dayOfWeek) ? 'weekend-evening' : 'weekday-evening';
    
    // Check FOH minimum
    if (fohStaffCount < threshold.foh_min_staff) {
      const additionalFohNeeded = threshold.foh_min_staff - fohStaffCount;
      console.log(`Need to add ${additionalFohNeeded} more FOH staff to meet minimum threshold`);
      
      // Add day shift
      if (additionalFohNeeded > 0) {
        this.assignStaff({
          date,
          dayOfWeek,
          segment: daySegment,
          staffType: 'foh',
          minStaff: additionalFohNeeded,
          maxStaff: additionalFohNeeded,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue,
          enforcementMode: true
        });
      }
    }
    
    // Check kitchen minimum
    if (kitchenStaffCount < threshold.kitchen_min_staff) {
      const additionalKitchenNeeded = threshold.kitchen_min_staff - kitchenStaffCount;
      console.log(`Need to add ${additionalKitchenNeeded} more kitchen staff to meet minimum threshold`);
      
      // Add day shift
      if (additionalKitchenNeeded > 0) {
        this.assignStaff({
          date,
          dayOfWeek,
          segment: daySegment,
          staffType: 'kitchen',
          minStaff: additionalKitchenNeeded,
          maxStaff: additionalKitchenNeeded,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue,
          enforcementMode: true
        });
      }
    }
    
    // Check KP minimum
    if (kpStaffCount < threshold.kp_min_staff) {
      const additionalKpNeeded = threshold.kp_min_staff - kpStaffCount;
      console.log(`Need to add ${additionalKpNeeded} more KP staff to meet minimum threshold`);
      
      // Add day shift
      if (additionalKpNeeded > 0) {
        this.assignStaff({
          date,
          dayOfWeek,
          segment: daySegment,
          staffType: 'kp',
          minStaff: additionalKpNeeded,
          maxStaff: additionalKpNeeded,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue,
          enforcementMode: true
        });
      }
    }
  }
  
  /**
   * NEW: Redistribute hours from managers to non-managers if needed
   */
  redistributeFromManagersIfNeeded(
    shifts: any[],
    staffWeeklyAllocations: Record<string, any>,
    rankedStaff: any[],
    totalCost: number
  ): void {
    console.log("Checking if redistribution from managers to non-managers is needed...");
    
    // Step 1: Identify non-manager staff with low hour allocations
    const nonManagersWithLowHours = rankedStaff.filter(staff => {
      // Skip if staff is a manager
      if (this.isManagerRole(staff.job_title)) return false;
      
      const allocation = staffWeeklyAllocations[staff.id];
      const minHoursPerWeek = typeof staff.min_hours_per_week === 'number' ? staff.min_hours_per_week : 0;
      
      // Only consider staff with minimum hour requirements
      if (minHoursPerWeek <= 0) return false;
      
      const currentHours = allocation ? allocation.hoursWorked : 0;
      // FIX: Ensure numeric comparison
      return currentHours < (minHoursPerWeek * 0.75);
    }).sort((a, b) => {
      // Sort by percentage of minimum hours met (lowest first)
      const aAlloc = staffWeeklyAllocations[a.id];
      const bAlloc = staffWeeklyAllocations[b.id];
      
      const aMinHours = a.min_hours_per_week || 1;
      const bMinHours = b.min_hours_per_week || 1;
      
      const aCurrentHours = aAlloc ? aAlloc.hoursWorked : 0;
      const bCurrentHours = bAlloc ? bAlloc.hoursWorked : 0;
      
      const aPercentMet = (aCurrentHours / aMinHours) * 100;
      const bPercentMet = (bCurrentHours / bMinHours) * 100;
      
      return aPercentMet - bPercentMet;
    });
    
    if (nonManagersWithLowHours.length === 0) {
      console.log("No non-manager staff with low hours found - no redistribution needed");
      return;
    }
    
    console.log(`Found ${nonManagersWithLowHours.length} non-manager staff with low hours`);
    
    // Step 2: Identify manager staff with high allocation of hours
    const managersWithHighHours = rankedStaff.filter(staff => {
      // Must be a manager
      if (!this.isManagerRole(staff.job_title)) return false;
      
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return false;
      
      // Managers with more than 35 hours (typical full time)
      return Number(allocation.hoursWorked) > 35;
    }).sort((a, b) => {
      // Sort by most hours first
      const aHours = Number(staffWeeklyAllocations[a.id].hoursWorked);
      const bHours = Number(staffWeeklyAllocations[b.id].hoursWorked);
      return bHours - aHours;
    });
    
    if (managersWithHighHours.length === 0) {
      console.log("No managers with high hours found - no redistribution needed");
      return;
    }
    
    console.log(`Found ${managersWithHighHours.length} managers with high hours that could be redistributed`);
    
    // Step 3: Attempt to redistribute hours
    for (const nonManager of nonManagersWithLowHours) {
      const allocation = staffWeeklyAllocations[nonManager.id];
      const minHoursPerWeek = typeof nonManager.min_hours_per_week === 'number' ? nonManager.min_hours_per_week : 0;
      const currentHours = allocation ? allocation.hoursWorked : 0;
      const targetHours = minHoursPerWeek * 0.8; // Target at least 80% of minimum
      // Using let instead of const since we'll modify this value
      let hoursNeeded = targetHours - currentHours;
      
      if (hoursNeeded <= 0) continue;
      
      console.log(`${nonManager.first_name} ${nonManager.last_name} needs ~${hoursNeeded.toFixed(1)} more hours (has: ${currentHours.toFixed(1)}, min: ${minHoursPerWeek})`);
      
      // Check if we can get hours from managers
      for (const manager of managersWithHighHours) {
        const managerAlloc = staffWeeklyAllocations[manager.id];
        const managerHours = managerAlloc ? Number(managerAlloc.hoursWorked) : 0;
        
        // Don't reduce managers below 35 hours if they have minimum hours
        const managerMinHours = Number(manager.min_hours_per_week) || 0;
        const managerMinimum = managerMinHours > 35 ? managerMinHours : 35;
        
        if (managerHours <= managerMinimum) {
          continue; // Skip if manager doesn't have excess hours
        }
        
        // Find shifts that could potentially be reassigned
        const managerShifts = shifts.filter(shift => 
          shift.profile_id === manager.id
        ).sort((a, b) => {
          // Prefer shorter shifts for redistribution
          const aHours = this.calculateHours(a.start_time, a.end_time, a.break_minutes);
          const bHours = this.calculateHours(b.start_time, b.end_time, b.break_minutes);
          return aHours - bHours; // Sort ascending (shortest first)
        });
        
        for (const shift of managerShifts) {
          const jobRole = this.jobRoles.find(r => r.id === shift.job_role_id);
          if (!jobRole) continue;
          
          // Check if non-manager can do this role
          const isEligible = this.isStaffEligibleForRole(nonManager, jobRole);
          if (!isEligible) continue;
          
          // Check if day is already worked - can only add more hours if already working that day
          const isAlreadyWorkingThatDay = allocation.daysWorked.includes(shift.date);
          
          // Check if adding another work day would exceed max days
          const currentDays = allocation.daysWorked.length;
          const maxDays = nonManager.max_days_per_week || 5;
          
          if (!isAlreadyWorkingThatDay && currentDays >= maxDays) {
            // Skip if this would exceed max days per week
            continue;
          }
          
          const shiftHours = this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes);
          
          // Check if adding this shift would exceed max daily hours
          if (isAlreadyWorkingThatDay) {
            const dailyAlloc = this.dailyStaffAllocations[shift.date]?.[nonManager.id];
            const currentDailyHours = dailyAlloc ? dailyAlloc.hoursWorked : 0;
            const maxHoursPerDay = nonManager.max_hours_per_day || 12;
            
            if (currentDailyHours + shiftHours > maxHoursPerDay) {
              // Skip if this would exceed max daily hours
              continue;
            }
          }
          
          console.log(`Redistributing shift on ${shift.date} (${shift.start_time}-${shift.end_time}, ${shiftHours}h) from ${manager.first_name} to ${nonManager.first_name}`);
          
          // Remove hours from manager allocation
          this.removeShiftAllocation(manager.id, shift, staffWeeklyAllocations);
          
          // Check if this is a secondary role for the non-manager
          const isSecondaryRole = this.isSecondaryRole(nonManager, jobRole);
          
          // Calculate costs for the new staff member
          const { shiftCost, niCost, pensionCost, totalShiftCost } = 
            this.calculateCosts(nonManager, shiftHours, shift.date);
          
          // Update the shift with new staff details
          shift.profile_id = nonManager.id;
          shift.is_secondary_role = isSecondaryRole;
          shift.hi_score = nonManager.hi_score || 0;
          shift.shift_cost = shiftCost;
          shift.employer_ni_cost = niCost;
          shift.employer_pension_cost = pensionCost;
          shift.total_cost = totalShiftCost;
          shift.is_redistributed_shift = true;
          
          // Add hours to the non-manager allocation
          this.updateStaffAllocations(nonManager.id, shift.date, shiftHours, shift, staffWeeklyAllocations);
          
          // Update hours needed
          hoursNeeded -= shiftHours;
          
          if (hoursNeeded <= 2) {
            // We've met our target, stop looking for shifts
            break;
          }
        }
        
        if (hoursNeeded <= 2) {
          break; // We've met our target, stop processing managers
        }
      }
      
      // Log the final status
      const updatedAllocation = staffWeeklyAllocations[nonManager.id];
      const updatedHours = updatedAllocation ? updatedAllocation.hoursWorked : 0;
      const remainingDeficit = minHoursPerWeek - updatedHours;
      
      if (remainingDeficit > 2) {
        console.log(`⚠️ Could not fully redistribute hours to ${nonManager.first_name}: still ${remainingDeficit.toFixed(1)}h below minimum`);
      } else {
        console.log(`✓ Successfully redistributed hours to ${nonManager.first_name}: now at ${updatedHours.toFixed(1)}h (min: ${minHoursPerWeek}h)`);
      }
    }
    
    console.log("Hour redistribution completed");
  }

  /**
   * NEW: Check if a job role is a secondary role for a staff member
   */
  isSecondaryRole(staff: any, jobRole: any): boolean {
    // Not primary role but eligible
    return staff.job_title !== jobRole.title && this.isStaffEligibleForRole(staff, jobRole);
  }
  
  /**
   * NEW: Calculate shift costs for a staff member
   */
  calculateCosts(staff: any, hours: number, date: string): {
    shiftCost: number;
    niCost: number;
    pensionCost: number;
    totalShiftCost: number;
  } {
    const hourlyRate = Number(staff.hourly_rate) || 11.50; // Default UK minimum wage as fallback
    const shiftCost = hourlyRate * hours;
    
    // Calculate employer National Insurance (13.8% above threshold)
    // This is a simplified calculation for demo purposes
    const niRate = 0.138; // 13.8%
    const niThreshold = 175 / 5; // Weekly threshold / days per week (simplified)
    const niCost = Math.max(0, (shiftCost - niThreshold) * niRate);
    
    // Calculate employer pension contribution (3% minimum)
    // This is a simplified calculation for demo purposes
    const pensionRate = staff.is_pension_enrolled ? 0.03 : 0;
    const pensionCost = shiftCost * pensionRate;
    
    const totalShiftCost = shiftCost + niCost + pensionCost;
    
    return {
      shiftCost,
      niCost,
      pensionCost,
      totalShiftCost
    };
  }
  
  /**
   * Calculate hours between two time strings, accounting for breaks
   */
  calculateHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
    
    // Subtract break time and convert to hours
    return (totalMinutes - breakMinutes) / 60;
  }
  
  /**
   * Update staff allocations when a shift is assigned
   */
  updateStaffAllocations(
    staffId: string,
    date: string,
    hours: number,
    shift: any,
    weeklyAllocations: Record<string, any>
  ): void {
    if (!staffId || !date || !weeklyAllocations[staffId]) return;
    
    // Update weekly allocation
    weeklyAllocations[staffId].hoursWorked += hours;
    
    // Add shift to weekly allocation
    weeklyAllocations[staffId].shifts.push({
      date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      hours
    });
    
    // Add date to days worked if not already there
    if (!weeklyAllocations[staffId].daysWorked.includes(date)) {
      weeklyAllocations[staffId].daysWorked.push(date);
    }
    
    // Update daily allocation
    if (!this.dailyStaffAllocations[date]) {
      this.dailyStaffAllocations[date] = {};
    }
    
    if (!this.dailyStaffAllocations[date][staffId]) {
      this.dailyStaffAllocations[date][staffId] = {
        hoursWorked: 0,
        shifts: [],
        salaryApplied: false
      };
    }
    
    this.dailyStaffAllocations[date][staffId].hoursWorked += hours;
    this.dailyStaffAllocations[date][staffId].shifts.push({
      start_time: shift.start_time,
      end_time: shift.end_time,
      hours
    });
  }

  /**
   * Calculate total revenue from daily forecast
   */
  calculateTotalRevenue(revenueForecast: Record<string, number>): number {
    if (!revenueForecast) return 0;
    
    return Object.values(revenueForecast).reduce((sum, daily) => sum + (Number(daily) || 0), 0);
  }
  
  /**
   * Safely get revenue for a specific date
   */
  safelyGetRevenue(date: string): number {
    if (!this.request.revenue_forecast || !this.request.revenue_forecast[date]) {
      return 0;
    }
    
    return Number(this.request.revenue_forecast[date]) || 0;
  }
  
  /**
   * Find appropriate threshold based on revenue
   */
  findThreshold(revenue: number): any {
    if (!this.thresholds || !this.thresholds.length) {
      return null;
    }
    
    // Find the threshold with the highest revenue that's still below the target revenue
    const eligibleThresholds = this.thresholds.filter(t => 
      Number(t.revenue_min) <= revenue && Number(t.revenue_max) >= revenue
    );
    
    if (!eligibleThresholds.length) {
      return null;
    }
    
    // If multiple thresholds match, use the one with the highest minimum revenue
    return eligibleThresholds.reduce((highest, current) => {
      return Number(current.revenue_min) > Number(highest.revenue_min) ? current : highest;
    }, eligibleThresholds[0]);
  }
  
  /**
   * Check if a day is a weekend
   */
  isWeekend(dayOfWeek: string): boolean {
    return dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
  }
  
  /**
   * Get shift rules for a specific day of the week
   */
  getShiftRulesForDay(dayOfWeek: string): any[] {
    if (!this.shiftRules || !this.shiftRules.length) {
      return [];
    }
    
    // Get rules where days array includes this day
    return this.shiftRules.filter(rule => 
      rule.days && rule.days.includes(dayOfWeek)
    );
  }
  
  /**
   * Rank staff by priority based on various factors
   */
  rankStaffByPriority(): any[] {
    if (!this.staff || !this.staff.length) {
      return [];
    }
    
    return [...this.staff].sort((a, b) => {
      // Calculate priority scores
      const aScore = this.calculateStaffPriorityScore(a);
      const bScore = this.calculateStaffPriorityScore(b);
      
      // Sort descending by priority score
      return bScore - aScore;
    });
  }
  
  /**
   * Calculate priority score for a staff member
   */
  calculateStaffPriorityScore(staff: any): number {
    let score = 0;
    
    // Salaried staff get highest priority
    if (staff.is_salaried) {
      score += this.salariedWeight;
    }
    
    // Managers get high priority
    if (this.isManagerRole(staff.job_title)) {
      score += this.managerWeight;
    }
    
    // Hi Score adds to priority
    const hiScore = staff.hi_score || 0;
    score += hiScore * this.hiScoreWeight;
    
    // Contracted hours factor
    const contracted = staff.min_hours_per_week || 0;
    score += contracted * 0.5; // Small boost for each contracted hour
    
    return score;
  }
  
  /**
   * Assign staff based on a shift rule
   */
  async assignShiftRuleStaff({
    date,
    dayOfWeek,
    rule,
    rankedStaff,
    staffWeeklyAllocations,
    shifts,
    totalCost,
    dayRevenue
  }: {
    date: string;
    dayOfWeek: string;
    rule: any;
    rankedStaff: any[];
    staffWeeklyAllocations: Record<string, any>;
    shifts: any[];
    totalCost: number;
    dayRevenue: number;
  }): Promise<void> {
    if (!rule) return;
    
    console.log(`Processing shift rule: ${rule.name || 'Unnamed rule'} for ${date}`);
    
    const jobRole = this.jobRoles.find(role => role.id === rule.job_role_id);
    
    if (!jobRole) {
      console.error(`❌ Job role not found for rule: ${rule.name}`);
      return;
    }
    
    // Get staff type based on job role
    let staffType: 'foh' | 'kitchen' | 'kp' = 'foh';
    
    if (jobRole.is_kitchen) {
      staffType = jobRole.title === 'KP' ? 'kp' : 'kitchen';
    }
    
    // Find staff eligible for this role, prioritizing those who have it as primary role
    const eligibleStaff = rankedStaff.filter(staff => this.isStaffEligibleForRole(staff, jobRole));
    
    if (eligibleStaff.length === 0) {
      console.log(`❌ No eligible staff found for ${jobRole.title} on ${date}`);
      return;
    }
    
    // Get time details from rule
    const { start_time, end_time, break_minutes } = rule;
    
    // Create a shift for the staff member
    const assignedStaff = this.assignStaffToRole({
      date,
      staffType,
      jobRole,
      eligibleStaff,
      startTime: start_time,
      endTime: end_time,
      breakMinutes: break_minutes || 0,
      staffWeeklyAllocations,
      isShiftRule: true,
      ruleName: rule.name
    });
    
    if (assignedStaff) {
      console.log(`✓ Assigned ${assignedStaff.first_name} ${assignedStaff.last_name} to ${jobRole.title} shift (${start_time}-${end_time}) on ${date}`);
      
      // Calculate shift cost
      const hours = this.calculateHours(start_time, end_time, break_minutes || 0);
      const { shiftCost, niCost, pensionCost, totalShiftCost } = 
        this.calculateCosts(assignedStaff, hours, date);
      
      // Create shift object
      const shift = {
        date,
        job_role_id: jobRole.id,
        profile_id: assignedStaff.id,
        start_time,
        end_time,
        break_minutes: break_minutes || 0,
        is_secondary_role: assignedStaff.job_title !== jobRole.title,
        hi_score: assignedStaff.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost,
        from_shift_rule: true,
        shift_rule_name: rule.name || 'Unknown rule'
      };
      
      // Add shift to list
      shifts.push(shift);
      
      // Update staff allocations
      this.updateStaffAllocations(assignedStaff.id, date, hours, shift, staffWeeklyAllocations);
      
      // Update total cost
      totalCost += totalShiftCost;
    } else {
      console.log(`❌ Could not assign staff for ${jobRole.title} shift (${start_time}-${end_time}) on ${date}`);
    }
  }
  
  /**
   * Assign staff with default values when no specific rules are available
   */
  assignStaffWithDefaults(
    date: string,
    dayOfWeek: string,
    dayRevenue: number,
    rankedStaff: any[],
    staffWeeklyAllocations: Record<string, any>,
    shifts: any[],
    totalCost: number
  ): void {
    console.log(`Using default staffing for ${dayOfWeek} ${date} with revenue £${dayRevenue}`);
    
    // Determine minimum staff counts based on revenue tiers
    let fohMinStaff = 1;  // Always have at least 1 FOH
    let kitchenMinStaff = 1;  // Always have at least 1 kitchen staff
    let kpMinStaff = 0;  // KP is based on revenue
    
    // Scale staff based on revenue
    if (dayRevenue > 3000) {
      // High revenue day
      fohMinStaff = 3;
      kitchenMinStaff = 2;
      kpMinStaff = 1;
    } else if (dayRevenue > 1500) {
      // Medium revenue day
      fohMinStaff = 2;
      kitchenMinStaff = 1;
      kpMinStaff = 1; 
    }
    
    // Weekend adjustment
    if (this.isWeekend(dayOfWeek)) {
      fohMinStaff = Math.max(2, fohMinStaff);
    }
    
    const segment = this.isWeekend(dayOfWeek) ? 'weekend-day' : 'weekday-day';
    
    // Assign FOH staff
    this.assignStaff({
      date,
      dayOfWeek,
      segment,
      staffType: 'foh',
      minStaff: fohMinStaff,
      maxStaff: fohMinStaff,
      rankedStaff,
      staffWeeklyAllocations,
      shifts,
      totalCost,
      dayRevenue
    });
    
    // Assign Kitchen staff
    this.assignStaff({
      date,
      dayOfWeek,
      segment,
      staffType: 'kitchen',
      minStaff: kitchenMinStaff,
      maxStaff: kitchenMinStaff,
      rankedStaff,
      staffWeeklyAllocations,
      shifts,
      totalCost,
      dayRevenue
    });
    
    // Assign KP if needed
    if (kpMinStaff > 0) {
      this.assignStaff({
        date,
        dayOfWeek,
        segment,
        staffType: 'kp',
        minStaff: kpMinStaff,
        maxStaff: kpMinStaff,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
    }
    
    // If revenue is high enough, add evening staff too
    if (dayRevenue > 2000) {
      const eveningSegment = this.isWeekend(dayOfWeek) ? 'weekend-evening' : 'weekday-evening';
      
      // Add evening FOH
      this.assignStaff({
        date,
        dayOfWeek,
        segment: eveningSegment,
        staffType: 'foh',
        minStaff: 1,
        maxStaff: 2,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
      
      // Add evening kitchen
      this.assignStaff({
        date,
        dayOfWeek,
        segment: eveningSegment,
        staffType: 'kitchen',
        minStaff: 1,
        maxStaff: 1,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
    }
  }
  
  /**
   * Assign staff for a specific segment and type
   */
  assignStaff({
    date,
    dayOfWeek,
    segment,
    staffType,
    minStaff,
    maxStaff,
    rankedStaff,
    staffWeeklyAllocations,
    shifts,
    totalCost,
    dayRevenue,
    enforcementMode = false
  }: {
    date: string;
    dayOfWeek: string;
    segment: string;
    staffType: 'foh' | 'kitchen' | 'kp';
    minStaff: number;
    maxStaff: number;
    rankedStaff: any[];
    staffWeeklyAllocations: Record<string, any>;
    shifts: any[];
    totalCost: number;
    dayRevenue: number;
    enforcementMode?: boolean;
  }): void {
    if (minStaff <= 0) return;
    
    console.log(`Assigning ${minStaff}-${maxStaff} ${staffType.toUpperCase()} staff for ${segment} on ${date}`);
    
    // Find eligible job roles for this staff type
    const eligibleRoles = this.jobRoles.filter(role => {
      if (staffType === 'foh') return !role.is_kitchen;
      if (staffType === 'kitchen') return role.is_kitchen && role.title !== 'KP';
      if (staffType === 'kp') return role.title === 'KP';
      return false;
    });
    
    if (eligibleRoles.length === 0) {
      console.log(`❌ No eligible roles found for ${staffType}`);
      return;
    }
    
    // Set shift times based on segment
    let startTime, endTime, breakMinutes;
    
    if (segment.endsWith('-day')) {
      startTime = '10:00:00';
      endTime = '17:00:00';
      breakMinutes = 30;
    } else {
      startTime = '17:00:00';
      endTime = '23:00:00';
      breakMinutes = 30;
    }
    
    // Create shifts for each required staff member
    let staffAssigned = 0;
    
    for (const role of eligibleRoles) {
      // Skip if we've assigned enough staff
      if (staffAssigned >= minStaff) break;
      
      // Find eligible staff for this role
      const eligibleStaff = rankedStaff.filter(staff => 
        this.isStaffEligibleForRole(staff, role)
      );
      
      if (eligibleStaff.length === 0) {
        console.log(`No eligible staff found for ${role.title}`);
        continue;
      }
      
      // Try to assign staff to this role
      const assignedStaff = this.assignStaffToRole({
        date,
        staffType,
        jobRole: role,
        eligibleStaff,
        startTime,
        endTime,
        breakMinutes,
        staffWeeklyAllocations
      });
      
      if (assignedStaff) {
        console.log(`✓ Assigned ${assignedStaff.first_name} ${assignedStaff.last_name} to ${role.title} shift (${startTime}-${endTime}) on ${date}`);
        staffAssigned++;
        
        // Calculate shift cost
        const hours = this.calculateHours(startTime, endTime, breakMinutes);
        const { shiftCost, niCost, pensionCost, totalShiftCost } = 
          this.calculateCosts(assignedStaff, hours, date);
        
        // Create shift object
        const shift = {
          date,
          job_role_id: role.id,
          profile_id: assignedStaff.id,
          start_time: startTime,
          end_time: endTime,
          break_minutes: breakMinutes,
          is_secondary_role: assignedStaff.job_title !== role.title,
          hi_score: assignedStaff.hi_score || 0,
          shift_cost: shiftCost,
          employer_ni_cost: niCost,
          employer_pension_cost: pensionCost,
          total_cost: totalShiftCost,
          enforcement_mode: enforcementMode
        };
        
        // Add shift to list
        shifts.push(shift);
        
        // Update staff allocations
        this.updateStaffAllocations(assignedStaff.id, date, hours, shift, staffWeeklyAllocations);
        
        // Update total cost
        totalCost += totalShiftCost;
        
        // Try creating part shifts if enabled and still need more staff
        if (this.partShiftConfig.enable && staffAssigned < minStaff) {
          const partShiftAssigned = this.tryCreatePartShifts({
            date,
            dayOfWeek,
            segment,
            role,
            rankedStaff,
            staffWeeklyAllocations,
            shifts,
            totalCost
          });
          
          if (partShiftAssigned) {
            staffAssigned++;
          }
        }
      }
    }
    
    if (staffAssigned < minStaff) {
      console.log(`⚠️ Only assigned ${staffAssigned}/${minStaff} ${staffType.toUpperCase()} staff for ${segment} on ${date}`);
    }
  }

  /**
   * Try to create part shifts to fill staffing needs
   */
  tryCreatePartShifts({
    date,
    dayOfWeek,
    segment,
    role,
    rankedStaff,
    staffWeeklyAllocations,
    shifts,
    totalCost
  }: {
    date: string;
    dayOfWeek: string;
    segment: string;
    role: any;
    rankedStaff: any[];
    staffWeeklyAllocations: Record<string, any>;
    shifts: any[];
    totalCost: number;
  }): boolean {
    if (!this.partShiftConfig.enable) return false;
    
    console.log(`Trying to create part shift for ${role.title} on ${date}`);
    
    // Determine part shift times based on segment
    let startTime, endTime, breakMinutes;
    
    if (segment.endsWith('-day')) {
      // Morning part shift: 10:00-14:00
      startTime = '10:00:00';
      endTime = '14:00:00';
      breakMinutes = 0; // No break for short shifts
    } else {
      // Evening part shift: 18:00-22:00
      startTime = '18:00:00';
      endTime = '22:00:00';
      breakMinutes = 0; // No break for short shifts
    }
    
    // Find eligible staff who aren't already working this day
    const eligibleStaff = rankedStaff.filter(staff => {
      // Must be eligible for this role
      if (!this.isStaffEligibleForRole(staff, role)) return false;
      
      // Check if already working this day
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return true; // No allocation yet, eligible
      
      const alreadyWorking = allocation.daysWorked.includes(date);
      
      // Part shifts can be added to days where staff are already working
      // if they have capacity, or as new shifts on other days
      return !alreadyWorking || this.canAddMoreHoursOnDay(staff, date);
    });
    
    if (eligibleStaff.length === 0) {
      console.log(`No eligible staff for part shift on ${date}`);
      return false;
    }
    
    // Try to assign a staff member to this part shift
    const assignedStaff = this.assignStaffToRole({
      date,
      staffType: role.is_kitchen ? (role.title === 'KP' ? 'kp' : 'kitchen') : 'foh',
      jobRole: role,
      eligibleStaff,
      startTime,
      endTime,
      breakMinutes,
      staffWeeklyAllocations,
      isPartShift: true
    });
    
    if (assignedStaff) {
      console.log(`✓ Assigned ${assignedStaff.first_name} to part shift (${startTime}-${endTime}) on ${date}`);
      
      // Calculate shift cost
      const hours = this.calculateHours(startTime, endTime, breakMinutes);
      const { shiftCost, niCost, pensionCost, totalShiftCost } = 
        this.calculateCosts(assignedStaff, hours, date);
      
      // Create shift object
      const shift = {
        date,
        job_role_id: role.id,
        profile_id: assignedStaff.id,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMinutes,
        is_secondary_role: assignedStaff.job_title !== role.title,
        hi_score: assignedStaff.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost,
        is_part_shift: true
      };
      
      // Add shift to list
      shifts.push(shift);
      
      // Update staff allocations
      this.updateStaffAllocations(assignedStaff.id, date, hours, shift, staffWeeklyAllocations);
      
      // Update total cost
      totalCost += totalShiftCost;
      
      return true;
    }
    
    return false;
  }

  /**
   * Check if staff can work more hours on a specific day
   */
  canAddMoreHoursOnDay(staff: any, date: string): boolean {
    const dailyAlloc = this.dailyStaffAllocations[date]?.[staff.id];
    if (!dailyAlloc) return true; // No allocation yet
    
    const currentHours = dailyAlloc.hoursWorked;
    const maxHoursPerDay = staff.max_hours_per_day || 12;
    
    // Allow at least 3 more hours
    return currentHours + 3 <= maxHoursPerDay;
  }

  /**
   * Assign a specific staff member to a role
   */
  assignStaffToRole({
    date,
    staffType,
    jobRole,
    eligibleStaff,
    startTime,
    endTime,
    breakMinutes,
    staffWeeklyAllocations,
    isShiftRule = false,
    ruleName = '',
    isPartShift = false
  }: {
    date: string;
    staffType: 'foh' | 'kitchen' | 'kp';
    jobRole: any;
    eligibleStaff: any[];
    startTime: string;
    endTime: string;
    breakMinutes: number;
    staffWeeklyAllocations: Record<string, any>;
    isShiftRule?: boolean;
    ruleName?: string;
    isPartShift?: boolean;
  }): any {
    if (eligibleStaff.length === 0) return null;
    
    const shiftHours = this.calculateHours(startTime, endTime, breakMinutes);
    
    // Find staff who can work this shift
    const availableStaff = eligibleStaff.filter(staff => {
      // Check if this would exceed max days per week
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return true; // No allocation yet, available
      
      const currentDays = allocation.daysWorked.length;
      const maxDaysPerWeek = staff.max_days_per_week || 5;
      
      // If already at max days, check if already working this day
      if (currentDays >= maxDaysPerWeek && !allocation.daysWorked.includes(date)) {
        return false;
      }
      
      // Check if already working this day and would exceed max hours
      if (allocation.daysWorked.includes(date)) {
        const dailyAlloc = this.dailyStaffAllocations[date]?.[staff.id];
        if (!dailyAlloc) return true;
        
        const currentDailyHours = dailyAlloc.hoursWorked;
        const maxHoursPerDay = staff.max_hours_per_day || 12;
        
        if (currentDailyHours + shiftHours > maxHoursPerDay) {
          return false;
        }
      }
      
      // Check if this would exceed max hours per week
      const currentWeeklyHours = allocation.hoursWorked;
      const maxHoursPerWeek = staff.max_hours_per_week || 40;
      
      if (currentWeeklyHours + shiftHours > maxHoursPerWeek) {
        return false;
      }
      
      return true;
    });
    
    if (availableStaff.length === 0) {
      console.log(`No available staff for ${jobRole.title} shift on ${date}`);
      return null;
    }
    
    // Prioritize staff with this as their primary role
    const primaryRoleStaff = availableStaff.filter(s => s.job_title === jobRole.title);
    
    // Select best staff member for this role
    const selectedStaff = primaryRoleStaff.length > 0 ? primaryRoleStaff[0] : availableStaff[0];
    
    return selectedStaff;
  }
}
