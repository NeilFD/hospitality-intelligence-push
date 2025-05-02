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
  request: any;
  staff: any[];
  jobRoles: any[];
  thresholds: any[];
  location: any;
  shiftRules: any[] = [];
  troughPeriods: any[] = [];
  roleMapping: any[] = [];
  
  // NEW: Configuration for part shifts
  enablePartShifts = true; // Can be turned off via settings
  minPartShiftHours = 3; // Minimum hours for a part shift
  maxPartShiftHours = 5; // Maximum hours for a part shift
  dayShiftLatestStartTime = '12:00:00'; // Latest start for day part shifts
  eveningShiftLatestStartTime = '18:00:00'; // Latest start for evening part shifts
  
  // Track daily allocations of staff to enable multiple shifts per day
  dailyStaffAllocations: Record<string, Record<string, {
    hoursWorked: number;
    shifts: any[];
    // Track if salaried staff has already been paid for this day
    salaryApplied?: boolean;
  }>> = {};

  constructor({ request, staff, jobRoles, thresholds, location }: {
    request: any;
    staff: any[];
    jobRoles: any[];
    thresholds: any[];
    location: any;
  }) {
    this.request = request;
    this.staff = staff;
    this.jobRoles = jobRoles;
    this.thresholds = thresholds || []; // Ensure thresholds is at least an empty array
    this.location = location;
    this.roleMapping = []; // Initialize roleMapping as an empty array
    this.dailyStaffAllocations = {}; // Initialize daily allocations tracking
  }

  /**
   * Set the shift rules to be used in scheduling
   */
  setShiftRules(shiftRules: any[]) {
    this.shiftRules = shiftRules || [];
  }
  
  /**
   * Set the trough periods for scheduling
   */
  setTroughPeriods(troughPeriods: any[]) {
    this.troughPeriods = troughPeriods || [];
  }

  /**
   * Set the role mapping data from job_role_mappings table
   */
  setRoleMapping(roleMapping: any[]) {
    this.roleMapping = roleMapping || [];
    console.log(`Role mapping data loaded: ${roleMapping.length} entries`);
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
    this.enablePartShifts = enable;
    this.minPartShiftHours = minHours;
    this.maxPartShiftHours = maxHours;
    this.dayShiftLatestStartTime = dayLatestStart;
    this.eveningShiftLatestStartTime = eveningLatestStart;
    
    console.log(`Part shift configuration updated: enabled=${enable}, minHours=${minHours}, maxHours=${maxHours}`);
  }

  /**
   * Generate an optimal schedule based on the provided data
   */
  generateSchedule = async () => {
    // Parse the week dates
    const weekStartDate = parseISO(this.request.week_start_date);
    const weekEndDate = parseISO(this.request.week_end_date);
    
    // Get the revenue forecasts for the week
    const revenueForecast = this.request.revenue_forecast || {};
    
    // Create an array of dates for the week
    const dates = [];
    let currentDate = new Date(weekStartDate);
    while (currentDate <= weekEndDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
    
    // IMPROVED: Sort dates by revenue forecast (highest to lowest)
    // This ensures high-revenue days get priority for staffing
    const sortedDates = [...dates].sort((dateA, dateB) => {
      const revenueA = parseFloat(revenueForecast[dateA] || '0');
      const revenueB = parseFloat(revenueForecast[dateB] || '0');
      return revenueB - revenueA; // Sort in descending order
    });
    
    console.log(`Processing ${dates.length} days for scheduling (prioritized by revenue)`);
    console.log("Revenue-prioritized processing order:");
    sortedDates.forEach(date => {
      const dayOfWeek = format(new Date(date), 'EEEE');
      const revenue = parseFloat(revenueForecast[date] || '0');
      console.log(`- ${dayOfWeek} (${date}): £${revenue.toFixed(2)}`);
    });
    
    console.log(`Staff members available: ${this.staff.length}`);
    console.log(`Job roles available: ${this.jobRoles.length}`);
    console.log(`Shift rules available: ${this.shiftRules.length}`);
    console.log(`Role mapping entries: ${this.roleMapping.length}`);

    // FIX: Log detailed staff information including their secondary roles
    this.staff.forEach(staff => {
      const secondaryRoles = Array.isArray(staff.secondary_job_roles) 
        ? staff.secondary_job_roles.join(", ") 
        : "None";
        
      console.log(`Staff: ${staff.first_name} ${staff.last_name}, Role: ${staff.job_title}, Secondary Roles: ${secondaryRoles}, Employment Type: ${staff.employment_type || 'Not set'}, Wage: ${staff.wage_rate || 'Not set'}, Salary: ${staff.annual_salary || 'Not set'}, Available: ${staff.available_for_rota !== false}`);
    });
    
    // Filter available staff - DO NOT set default wage rates
    const availableStaff = this.staff.filter(member => member.available_for_rota !== false)
      .map(staff => {
        // Check for missing wage information
        if (staff.employment_type === 'hourly' && !staff.wage_rate && staff.wage_rate !== 0) {
          console.warn(`Warning: Hourly staff member ${staff.first_name} ${staff.last_name} has no wage rate set`);
        }
        else if (staff.employment_type === 'salaried' && !staff.annual_salary && staff.annual_salary !== 0) {
          console.warn(`Warning: Salaried staff member ${staff.first_name} ${staff.last_name} has no annual salary set`);
        }
        else if (staff.employment_type === 'contractor' && !staff.wage_rate && staff.wage_rate !== 0) {
          console.warn(`Warning: Contractor ${staff.first_name} ${staff.last_name} has no hourly rate set`);
        }
        return staff;
      });
    
    if (availableStaff.length === 0) {
      console.error("No available staff found for scheduling");
      return {
        shifts: [],
        total_cost: 0,
        revenue_forecast: 0,
        cost_percentage: 0
      };
    }
    
    // Sort staff by employment type and hi score - prioritize salaried staff first
    const rankedStaff = [...availableStaff].sort((a, b) => {
      // First prioritize by employment type (salaried first)
      if (a.employment_type === 'salaried' && b.employment_type !== 'salaried') {
        return -1; // a comes first
      }
      if (a.employment_type !== 'salaried' && b.employment_type === 'salaried') {
        return 1; // b comes first
      }
      
      // Then prioritize management roles for multiple shifts
      const aIsManager = this.isManagerRole(a.job_title);
      const bIsManager = this.isManagerRole(b.job_title);
      
      if (aIsManager && !bIsManager) {
        return -1; // a comes first
      }
      if (!aIsManager && bIsManager) {
        return 1; // b comes first
      }
      
      // Then sort by hi score
      return (b.hi_score || 0) - (a.hi_score || 0);
    });
    
    // Track staff allocations for the week to ensure we don't exceed constraints
    const staffWeeklyAllocations: Record<string, {
      hoursWorked: number;
      daysWorked: string[];
      shifts: any[];
    }> = {};
    
    // Initialize staff allocations
    rankedStaff.forEach(staff => {
      staffWeeklyAllocations[staff.id] = {
        hoursWorked: 0,
        daysWorked: [],
        shifts: []
      };
    });
    
    // Initialize daily staff allocations for tracking multiple shifts per day
    dates.forEach(date => {
      this.dailyStaffAllocations[date] = {};
      rankedStaff.forEach(staff => {
        this.dailyStaffAllocations[date][staff.id] = {
          hoursWorked: 0,
          shifts: [],
          salaryApplied: false // Initialize salary tracking for each staff member per day
        };
      });
    });
    
    const shifts: any[] = [];
    let totalCost = 0;
    let totalRevenue = 0;
    
    // Add all revenue to total
    dates.forEach(date => {
      const dayRevenue = parseFloat(revenueForecast[date] || '0');
      totalRevenue += dayRevenue;
    });
    
    // Process each day by revenue priority order
    for (const date of sortedDates) {
      const dayOfWeek = format(new Date(date), 'EEEE').toLowerCase();
      // Fixed mapping that properly converts full day names to day codes
      const dayCodeMap: Record<string, string> = {
        'monday': 'mon',
        'tuesday': 'tue',
        'wednesday': 'wed',
        'thursday': 'thu',
        'friday': 'fri',
        'saturday': 'sat',
        'sunday': 'sun'
      };
      const dayCode = dayCodeMap[dayOfWeek];
      
      // Log the day being processed and the code being used
      const dayRevenue = parseFloat(revenueForecast[date] || '0');
      console.log(`Processing ${dayOfWeek} (${date}) with day code: ${dayCode}, revenue: £${dayRevenue}`);
      
      if (dayRevenue <= 0) {
        console.log(`Skipping ${date} - no revenue forecast`);
        continue; // Skip days with no revenue forecast
      }
      
      // Get all shift rules for this day
      const dayShiftRules = this.getShiftRulesForDay(dayCode);
      
      console.log(`Found ${dayShiftRules.length} shift rules for ${dayOfWeek} with day code ${dayCode}`);
      
      if (dayShiftRules.length > 0) {
        console.log(`Using ${dayShiftRules.length} shift rules for ${dayOfWeek}:`);
        dayShiftRules.forEach((rule, index) => {
          console.log(`Rule ${index + 1}: ${rule.name || 'Unnamed'}, Min Staff: ${rule.min_staff || 0}, Job Role: ${rule.job_roles?.title || 'Unknown'}`);
        });
        
        // Process each shift rule for this day
        for (const rule of dayShiftRules) {
          // Assign staff based on the shift rule
          this.assignShiftRuleStaff({
            date,
            dayOfWeek,
            rule,
            rankedStaff,
            staffWeeklyAllocations,
            shifts,
            totalCost,
            dayRevenue
          });
        }
        
        // After processing all shift rules, check if we need to enforce threshold minimums
        this.enforceThresholdMinimums({
          date,
          dayOfWeek,
          dayRevenue,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost
        });
      } else {
        // Fallback to threshold-based staffing if no shift rules exist
        console.log(`No shift rules found for ${dayOfWeek}, falling back to thresholds`);
        
        // Find applicable threshold based on revenue
        const threshold = this.findThreshold(dayRevenue);
        
        if (!threshold) {
          console.log(`No applicable threshold found for revenue: ${dayRevenue}, using default values`);
          // If no threshold found, use a default threshold
          this.assignStaffWithDefaults(date, dayOfWeek, dayRevenue, rankedStaff, staffWeeklyAllocations, shifts, totalCost);
          continue;
        }
        
        // For logging, use threshold name if available or create a formatted band name
        const thresholdName = threshold.name || 
          `Revenue Band: £${threshold.revenue_min} - £${threshold.revenue_max}`;
        console.log(`Using threshold "${thresholdName}" for ${date} with revenue ${dayRevenue}`);
        
        // Process for day segment
        const daySegment = this.isWeekend(dayOfWeek) ? 'weekend-day' : 'weekday-day';
        
        // Assign FOH staff for this day/segment
        this.assignStaff({
          date,
          dayOfWeek,
          segment: daySegment,
          staffType: 'foh',
          minStaff: threshold.foh_min_staff,
          maxStaff: threshold.foh_max_staff,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue
        });
        
        // Assign kitchen staff
        this.assignStaff({
          date,
          dayOfWeek,
          segment: daySegment,
          staffType: 'kitchen',
          minStaff: threshold.kitchen_min_staff,
          maxStaff: threshold.kitchen_max_staff,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue
        });
        
        // Assign KP staff
        this.assignStaff({
          date,
          dayOfWeek,
          segment: daySegment,
          staffType: 'kp',
          minStaff: threshold.kp_min_staff,
          maxStaff: threshold.kp_max_staff,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue
        });
        
        // Process for evening segment
        const eveningSegment = this.isWeekend(dayOfWeek) ? 'weekend-evening' : 'weekday-evening';
        
        // Assign FOH staff for evening
        this.assignStaff({
          date,
          dayOfWeek,
          segment: eveningSegment,
          staffType: 'foh',
          minStaff: threshold.foh_min_staff,
          maxStaff: threshold.foh_max_staff,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue
        });
        
        // Assign kitchen staff for evening
        this.assignStaff({
          date,
          dayOfWeek,
          segment: eveningSegment,
          staffType: 'kitchen',
          minStaff: threshold.kitchen_min_staff,
          maxStaff: threshold.kitchen_max_staff,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue
        });
        
        // Assign KP staff for evening
        this.assignStaff({
          date,
          dayOfWeek,
          segment: eveningSegment,
          staffType: 'kp',
          minStaff: threshold.kp_min_staff,
          maxStaff: threshold.kp_max_staff,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue
        });
      }
    }
    
    // Calculate cost percentage
    const costPercentage = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
    
    // NEW: After initial scheduling, perform a balancing pass to ensure staff meet minimum hours
    if (shifts.length > 0) {
      console.log("Performing balancing pass to ensure minimum hour requirements are met...");
      this.balanceShiftsForMinimumHours(shifts, staffWeeklyAllocations, rankedStaff, totalCost);
    }
    
    // If no shifts were assigned or very few, provide diagnostic info and create emergency shifts
    if (shifts.length < dates.length) {
      console.warn(`Only ${shifts.length} shifts were created for ${dates.length} days - creating emergency shifts`);
      
      // Create at least one default shift per day to ensure coverage
      for (const date of dates) {
        // Skip days that already have shifts
        if (shifts.some(s => s.date === date)) {
          continue;
        }
        
        const dayOfWeek = format(new Date(date), 'EEEE').toLowerCase();
        const dayRevenue = parseFloat(revenueForecast[date] || '0');
        
        if (dayRevenue <= 0) {
          console.log(`Skipping emergency shift for ${date} - no revenue forecast`);
          continue;
        }
        
        console.log(`Creating emergency default shifts for ${date}`);
        
        // Try to find available staff for this day
        const availableStaffForDay = rankedStaff.filter(staff => {
          const allocation = staffWeeklyAllocations[staff.id];
          if (!allocation) return true; // No allocations yet
          
          // Check if adding a shift would exceed constraints
          const maxHoursPerWeek = staff.max_hours_per_week || 40;
          return (allocation.hoursWorked < maxHoursPerWeek); 
          // Note: Removed restriction preventing multiple shifts on the same day
        });
        
        if (availableStaffForDay.length === 0) {
          console.log(`No available staff for emergency shift on ${date}, using any staff member`);
          // Just use any staff member as emergency
          if (rankedStaff.length > 0) {
            this.createEmergencyShift(date, dayOfWeek, rankedStaff[0], shifts);
            totalCost += shifts[shifts.length - 1].total_cost;
          }
        } else {
          // Use the best available staff member
          this.createEmergencyShift(date, dayOfWeek, availableStaffForDay[0], shifts);
          totalCost += shifts[shifts.length - 1].total_cost;
          
          // Update allocations
          const shift = shifts[shifts.length - 1];
          this.updateStaffAllocations(
            shift.profile_id, 
            date, 
            this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes),
            shift, 
            staffWeeklyAllocations
          );
        }
      }
    }
    
    // Final validation to ensure no shifts have null job_role_id
    const validShifts = shifts.filter(shift => {
      if (!shift.job_role_id) {
        console.error(`Found shift without job_role_id for ${shift.profile_id} on ${shift.date}, removing from final schedule`);
        return false;
      }
      return true;
    });
    
    if (validShifts.length < shifts.length) {
      console.warn(`Removed ${shifts.length - validShifts.length} invalid shifts with null job_role_id values`);
    }
    
    return {
      shifts: validShifts,
      total_cost: totalCost,
      revenue_forecast: totalRevenue,
      cost_percentage: costPercentage
    };
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
    
    // Check primary role match
    if (staff.job_title === jobRole.title) {
      return true;
    }
    
    // Check secondary roles
    if (Array.isArray(staff.secondary_job_roles)) {
      return staff.secondary_job_roles.includes(jobRole.title);
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
    const hours = this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes);
    
    // Update weekly allocations
    if (weeklyAllocations[staffId]) {
      weeklyAllocations[staffId].hoursWorked -= hours;
      
      // Remove shift from the shifts array
      weeklyAllocations[staffId].shifts = weeklyAllocations[staffId].shifts.filter(s => s !== shift);
      
      // Check if this was the only shift for this day
      const shiftsOnThisDay = weeklyAllocations[staffId].shifts.filter(s => s.date === shift.date);
      if (shiftsOnThisDay.length === 0) {
        // Remove day from days worked
        weeklyAllocations[staffId].daysWorked = weeklyAllocations[staffId].daysWorked.filter(d => d !== shift.date);
      }
    }
    
    // Update daily allocations
    if (this.dailyStaffAllocations[shift.date]?.[staffId]) {
      this.dailyStaffAllocations[shift.date][staffId].hoursWorked -= hours;
      this.dailyStaffAllocations[shift.date][staffId].shifts = 
        this.dailyStaffAllocations[shift.date][staffId].shifts.filter(s => s !== shift);
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
    const existingShifts = shifts.filter(s => s.date === date);
    
    // Count by staff type
    const fohStaffCount = this.countStaffByType(existingShifts, 'foh', rankedStaff);
    const kitchenStaffCount = this.countStaffByType(existingShifts, 'kitchen', rankedStaff);
    const kpStaffCount = this.countStaffByType(existingShifts, 'kp', rankedStaff);
    
    console.log(`Staff count check for ${date}: FOH=${fohStaffCount}, Kitchen=${kitchenStaffCount}, KP=${kpStaffCount}`);
    console.log(`Threshold minimums: FOH=${threshold.foh_min_staff}, Kitchen=${threshold.kitchen_min_staff}, KP=${threshold.kp_min_staff}`);
    
    // Check if we need to add kitchen staff to meet minimum
    if (kitchenStaffCount < threshold.kitchen_min_staff) {
      console.log(`Need to add ${threshold.kitchen_min_staff - kitchenStaffCount} more kitchen staff for ${date}`);
      
      // Determine segment based on day of week
      const daySegment = this.isWeekend(dayOfWeek) ? 'weekend-day' : 'weekday-day';
      
      // Assign additional kitchen staff
      this.assignStaff({
        date,
        dayOfWeek,
        segment: daySegment,
        staffType: 'kitchen',
        minStaff: threshold.kitchen_min_staff - kitchenStaffCount,
        maxStaff: threshold.kitchen_max_staff,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
    }
    
    // Check if we need to add KP staff to meet minimum
    if (kpStaffCount < threshold.kp_min_staff) {
      console.log(`Need to add ${threshold.kp_min_staff - kpStaffCount} more kitchen porters for ${date}`);
      
      // Determine segment based on day of week
      const daySegment = this.isWeekend(dayOfWeek) ? 'weekend-day' : 'weekday-day';
      
      // Assign additional KP staff
      this.assignStaff({
        date,
        dayOfWeek,
        segment: daySegment,
        staffType: 'kp',
        minStaff: threshold.kp_min_staff - kpStaffCount,
        maxStaff: threshold.kp_max_staff,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
    }
    
    // Check if we need to add FOH staff to meet minimum
    if (fohStaffCount < threshold.foh_min_staff) {
      console.log(`Need to add ${threshold.foh_min_staff - fohStaffCount} more FOH staff for ${date}`);
      
      // Determine segment based on day of week
      const daySegment = this.isWeekend(dayOfWeek) ? 'weekend-day' : 'weekday-day';
      
      // Assign additional FOH staff
      this.assignStaff({
        date,
        dayOfWeek,
        segment: daySegment,
        staffType: 'foh',
        minStaff: threshold.foh_min_staff - fohStaffCount,
        maxStaff: threshold.foh_max_staff,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
    }
  }
  
  /**
   * Check if a role is a secondary role for a staff member
   */
  isSecondaryRole(staff: any, jobRole: any): boolean {
    // Primary role is not a secondary role
    if (staff.job_title === jobRole.title) {
      return false;
    }
    
    // Check if this role is in the secondary roles list
    if (Array.isArray(staff.secondary_job_roles)) {
      return staff.secondary_job_roles.includes(jobRole.title);
    }
    
    return false;
  }
  
  /**
   * Check if a job title is a management role
   */
  isManagerRole(jobTitle: string): boolean {
    const managerTitles = [
      'manager',
      'head chef',
      'chef manager',
      'supervisor',
      'assistant manager',
      'general manager',
      'deputy manager'
    ];
    
    if (!jobTitle) return false;
    
    // Check if job title contains any of the manager titles (case insensitive)
    return managerTitles.some(title => 
      jobTitle.toLowerCase().includes(title.toLowerCase())
    );
  }
  
  /**
   * Get shift rules for a specific day
   */
  getShiftRulesForDay(dayCode: string): any[] {
    // Filter shift rules that apply to this day
    return this.shiftRules.filter(rule => {
      // Skip rules with no days specified
      if (!rule.days || !Array.isArray(rule.days)) {
        return false;
      }
      
      // Check if this day is included in the rule's days
      return rule.days.includes(dayCode);
    });
  }
  
  /**
   * Assign staff based on a shift rule
   */
  assignShiftRuleStaff({
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
  }) {
    // Get the job role for this rule
    const jobRole = this.jobRoles.find(role => role.id === rule.job_role_id);
    if (!jobRole) {
      console.warn(`No job role found for rule ${rule.name || 'Unnamed'} with ID ${rule.job_role_id}`);
      return;
    }
    
    console.log(`Assigning staff for rule: ${rule.name || 'Unnamed'} (${jobRole.title})`);
    
    // Determine staff type based on job role
    const staffType = jobRole.is_kitchen ? 'kitchen' : 'foh';
    const minStaff = rule.min_staff || 1;
    const maxStaff = rule.max_staff || 1;
    
    // Find eligible staff for this role
    const eligibleStaff = rankedStaff.filter(staff => 
      this.isStaffEligibleForRole(staff, jobRole)
    );
    
    if (eligibleStaff.length === 0) {
      console.warn(`No eligible staff found for role ${jobRole.title}`);
      return;
    }
    
    // Assign staff according to rule constraints
    const staffToAssign = Math.min(eligibleStaff.length, maxStaff);
    console.log(`Assigning ${staffToAssign} staff for ${jobRole.title} role`);
    
    for (let i = 0; i < staffToAssign; i++) {
      const staff = eligibleStaff[i];
      
      // Check staff availability
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) continue;
      
      // Check if adding this shift would exceed weekly constraints
      const maxHoursPerWeek = staff.max_hours_per_week || 40;
      const maxDaysPerWeek = staff.max_days_per_week || 5;
      
      if (allocation.hoursWorked >= maxHoursPerWeek) {
        console.log(`${staff.first_name} already at max hours (${maxHoursPerWeek})`);
        continue;
      }
      
      if (allocation.daysWorked.length >= maxDaysPerWeek && !allocation.daysWorked.includes(date)) {
        console.log(`${staff.first_name} already at max days (${maxDaysPerWeek})`);
        continue;
      }
      
      // Create shift for this staff member
      const shiftHours = this.calculateHours(rule.start_time, rule.end_time, 30); // Assume 30 min break
      const isSecondaryRole = this.isSecondaryRole(staff, jobRole);
      
      // Calculate costs
      const { shiftCost, niCost, pensionCost, totalShiftCost } = 
        this.calculateCosts(staff, shiftHours, date);
        
      const shift = {
        profile_id: staff.id,
        date,
        day_of_week: dayOfWeek,
        start_time: rule.start_time,
        end_time: rule.end_time,
        break_minutes: 30,
        job_role_id: rule.job_role_id || jobRole.id, // Ensure job_role_id is always set
        is_secondary_role: isSecondaryRole,
        hi_score: staff.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost
      };
      
      // Add shift to list
      shifts.push(shift);
      totalCost += totalShiftCost;
      
      // Update staff allocations
      this.updateStaffAllocations(staff.id, date, shiftHours, shift, staffWeeklyAllocations);
      
      console.log(`Assigned ${staff.first_name} ${staff.last_name} to ${jobRole.title} shift on ${date}`);
    }
  }
  
  /**
   * Find the threshold applicable for a given revenue
   */
  findThreshold(revenue: number): any {
    // Look for a threshold where the revenue falls between min and max
    const applicableThreshold = this.thresholds.find(threshold => {
      const minRevenue = Number(threshold.revenue_min) || 0;
      const maxRevenue = Number(threshold.revenue_max) || Infinity;
      
      return revenue >= minRevenue && revenue <= maxRevenue;
    });
    
    return applicableThreshold;
  }
  
  /**
   * Assign staff with default values when no threshold is found
   */
  assignStaffWithDefaults(
    date: string,
    dayOfWeek: string,
    dayRevenue: number,
    rankedStaff: any[],
    staffWeeklyAllocations: Record<string, any>,
    shifts: any[],
    totalCost: number
  ) {
    console.log(`Using default staffing for ${date}`);
    
    // Get default job roles for FOH and Kitchen
    const fohRole = this.jobRoles.find(role => !role.is_kitchen);
    const kitchenRole = this.jobRoles.find(role => role.is_kitchen);
    
    // If no roles found, we can't create shifts
    if (!fohRole && !kitchenRole) {
      console.error("Cannot create default shifts - no job roles found");
      return;
    }
    
    // Create at least one FOH and one kitchen shift
    if (fohRole) {
      const fohStaff = rankedStaff.find(staff => this.isStaffEligibleForRole(staff, fohRole));
      if (fohStaff) {
        this.createDefaultShift(date, dayOfWeek, fohStaff, fohRole.id, shifts, staffWeeklyAllocations);
        totalCost += shifts[shifts.length - 1].total_cost;
      }
    }
    
    if (kitchenRole) {
      const kitchenStaff = rankedStaff.find(staff => this.isStaffEligibleForRole(staff, kitchenRole));
      if (kitchenStaff) {
        this.createDefaultShift(date, dayOfWeek, kitchenStaff, kitchenRole.id, shifts, staffWeeklyAllocations);
        totalCost += shifts[shifts.length - 1].total_cost;
      }
    }
  }
  
  /**
   * Create a default shift for a staff member
   */
  createDefaultShift(
    date: string,
    dayOfWeek: string,
    staffMember: any,
    jobRoleId: string,
    shifts: any[],
    staffWeeklyAllocations: Record<string, any>
  ) {
    // Make sure we have a valid job role ID
    if (!jobRoleId) {
      const defaultJobRole = this.jobRoles.find(r => r.title === staffMember.job_title) || this.jobRoles[0];
      if (!defaultJobRole) {
        console.error(`Cannot create shift - no job role found for ${staffMember.first_name}`);
        return null;
      }
      jobRoleId = defaultJobRole.id;
    }
    
    const shift = {
      profile_id: staffMember.id,
      date: date,
      day_of_week: dayOfWeek,
      start_time: '09:00:00',
      end_time: '17:00:00',
      break_minutes: 30,
      job_role_id: jobRoleId, // Ensure job role ID is set
      is_secondary_role: false,
      hi_score: staffMember.hi_score || 0,
      shift_cost: 0,
      employer_ni_cost: 0,
      employer_pension_cost: 0,
      total_cost: 0,
      is_default_shift: true
    };
    
    // Calculate costs based on employment type
    const shiftHours = this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes);
    const { shiftCost, niCost, pensionCost, totalShiftCost } = this.calculateCosts(staffMember, shiftHours, date);
    
    shift.shift_cost = shiftCost;
    shift.employer_ni_cost = niCost;
    shift.employer_pension_cost = pensionCost;
    shift.total_cost = totalShiftCost;
    
    // Add to shifts array
    shifts.push(shift);
    
    // Update allocations
    this.updateStaffAllocations(staffMember.id, date, shiftHours, shift, staffWeeklyAllocations);
    
    return shift;
  }
  
  /**
   * Count staff of a specific type in existing shifts
   */
  countStaffByType(shifts: any[], staffType: string, rankedStaff: any[]): number {
    // Count unique staff members of a specific type
    const uniqueStaffIds = new Set();
    
    shifts.forEach(shift => {
      // Find the staff member
      const staffMember = rankedStaff.find(staff => staff.id === shift.profile_id);
      if (staffMember) {
        // Check if this staff member is of the specified type
        const isMatchingType = this.getStaffType(staffMember) === staffType;
        if (isMatchingType) {
          uniqueStaffIds.add(staffMember.id);
        }
      }
    });
    
    return uniqueStaffIds.size;
  }
  
  /**
   * Get the staff type based on job role
   */
  getStaffType(staffMember: any): string {
    if (!staffMember || !staffMember.job_title) {
      return 'unknown';
    }
    
    const jobTitle = staffMember.job_title.toLowerCase();
    
    // FOH roles
    if (
      jobTitle.includes('server') ||
      jobTitle.includes('waiter') ||
      jobTitle.includes('waitress') ||
      jobTitle.includes('host') ||
      jobTitle.includes('bartender') ||
      jobTitle.includes('barista') ||
      jobTitle.includes('front of house') ||
      jobTitle.includes('foh')
    ) {
      return 'foh';
    }
    
    // Kitchen porter roles
    if (
      jobTitle.includes('kitchen porter') ||
      jobTitle.includes('kp') ||
      jobTitle.includes('dishwasher') ||
      jobTitle.includes('potwasher')
    ) {
      return 'kp';
    }
    
    // Kitchen/chef roles
    if (
      jobTitle.includes('chef') ||
      jobTitle.includes('cook') ||
      jobTitle.includes('kitchen') ||
      jobTitle.includes('sous') ||
      jobTitle.includes('culinary')
    ) {
      return 'kitchen';
    }
    
    // Default to FOH if unknown
    return 'foh';
  }
  
  /**
   * Check if a day is a weekend day
   */
  isWeekend(dayOfWeek: string): boolean {
    const day = dayOfWeek.toLowerCase();
    return day === 'saturday' || day === 'sunday';
  }
  
  /**
   * Assign staff for a specific segment and staff type
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
    dayRevenue
  }: {
    date: string;
    dayOfWeek: string;
    segment: string;
    staffType: string;
    minStaff: number;
    maxStaff: number;
    rankedStaff: any[];
    staffWeeklyAllocations: Record<string, any>;
    shifts: any[];
    totalCost: number;
    dayRevenue: number;
  }) {
    console.log(`Assigning ${staffType} staff for ${date}, segment: ${segment}`);
    
    // Find eligible staff for this type
    const eligibleStaff = rankedStaff.filter(staff => {
      const type = this.getStaffType(staff);
      return type === staffType;
    });
    
    if (eligibleStaff.length === 0) {
      console.log(`No ${staffType} staff available`);
      return;
    }
    
    // Determine shift times based on segment
    let startTime, endTime;
    if (segment.includes('day')) {
      startTime = '09:00:00';
      endTime = '17:00:00';
    } else { // evening
      startTime = '17:00:00';
      endTime = '23:00:00';
    }
    
    // Find appropriate job role for this staff type
    const findJobRole = () => {
      let jobRoleForType;
      
      if (staffType === 'foh') {
        jobRoleForType = this.jobRoles.find(role => !role.is_kitchen);
      } else if (staffType === 'kitchen') {
        jobRoleForType = this.jobRoles.find(role => 
          role.is_kitchen && 
          !role.title.toLowerCase().includes('porter') && 
          !role.title.toLowerCase().includes('kp')
        );
      } else if (staffType === 'kp') {
        jobRoleForType = this.jobRoles.find(role => 
          role.is_kitchen && 
          (role.title.toLowerCase().includes('porter') || role.title.toLowerCase().includes('kp'))
        );
      }
      
      // If no matching role found, use the first role based on kitchen/non-kitchen
      if (!jobRoleForType) {
        if (staffType === 'foh') {
          jobRoleForType = this.jobRoles.find(role => !role.is_kitchen);
        } else {
          jobRoleForType = this.jobRoles.find(role => role.is_kitchen);
        }
      }
      
      // Last resort: just use the first job role
      return jobRoleForType || this.jobRoles[0];
    };
    
    const jobRole = findJobRole();
    if (!jobRole) {
      console.error(`No suitable job role found for ${staffType} staff`);
      return;
    }
    
    // Assign up to minStaff staff members
    const staffToAssign = Math.min(minStaff, eligibleStaff.length);
    for (let i = 0; i < staffToAssign; i++) {
      const staff = eligibleStaff[i];
      
      // Check staff constraints
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) continue;
      
      // Check if adding this shift would exceed weekly constraints
      const maxHoursPerWeek = staff.max_hours_per_week || 40;
      const maxDaysPerWeek = staff.max_days_per_week || 5;
      
      if (allocation.hoursWorked >= maxHoursPerWeek) {
        console.log(`${staff.first_name} already at max hours (${maxHoursPerWeek})`);
        continue;
      }
      
      if (allocation.daysWorked.length >= maxDaysPerWeek && !allocation.daysWorked.includes(date)) {
        console.log(`${staff.first_name} already at max days (${maxDaysPerWeek})`);
        continue;
      }
      
      // Create shift for this staff member
      const shiftHours = this.calculateHours(startTime, endTime, 30); // Assume 30 min break
      const isSecondaryRole = this.isSecondaryRole(staff, jobRole);
      
      // Calculate costs
      const { shiftCost, niCost, pensionCost, totalShiftCost } = 
        this.calculateCosts(staff, shiftHours, date);
        
      const shift = {
        profile_id: staff.id,
        date,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        break_minutes: 30,
        job_role_id: jobRole.id, // Ensure job_role_id is not null
        is_secondary_role: isSecondaryRole,
        hi_score: staff.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost
      };
      
      // Add shift to list
      shifts.push(shift);
      totalCost += totalShiftCost;
      
      // Update staff allocations
      this.updateStaffAllocations(staff.id, date, shiftHours, shift, staffWeeklyAllocations);
      
      console.log(`Assigned ${staff.first_name} ${staff.last_name} to ${jobRole.title} shift on ${date}`);
    }
  }
  
  /**
   * Create an emergency shift when no other shifts are scheduled
   */
  createEmergencyShift(
    date: string,
    dayOfWeek: string,
    staffMember: any,
    shifts: any[]
  ) {
    console.log(`Creating emergency shift for ${date} with ${staffMember.first_name}`);
    
    // Find a suitable job role ID for this staff member
    let jobRoleId = null;
    
    // First try to find the staff member's primary job role
    const primaryJobRole = this.jobRoles.find(role => role.title === staffMember.job_title);
    if (primaryJobRole) {
      jobRoleId = primaryJobRole.id;
    } 
    // If no primary role, fall back to any job role matched with staff type
    else {
      const staffType = this.getStaffType(staffMember);
      if (staffType === 'foh') {
        const fohRole = this.jobRoles.find(role => !role.is_kitchen);
        if (fohRole) jobRoleId = fohRole.id;
      } else {
        const kitchenRole = this.jobRoles.find(role => role.is_kitchen);
        if (kitchenRole) jobRoleId = kitchenRole.id;
      }
    }
    
    // If still no job role found, use the first available role
    if (!jobRoleId && this.jobRoles.length > 0) {
      jobRoleId = this.jobRoles[0].id;
    }
    
    // If still no job role, log an error
    if (!jobRoleId) {
      console.error("Cannot create emergency shift - no job roles available");
      return null;
    }
    
    // Create a basic shift for this date with standard hours
    const shift = {
      profile_id: staffMember.id,
      date: date,
      day_of_week: dayOfWeek,
      start_time: '09:00:00',
      end_time: '17:00:00',
      break_minutes: 30,
      job_role_id: jobRoleId, // Ensure job_role_id is not null
      is_secondary_role: false,
      hi_score: staffMember.hi_score || 0,
      shift_cost: 0,
      employer_ni_cost: 0,
      employer_pension_cost: 0,
      total_cost: 0,
      is_emergency_shift: true
    };
    
    // Calculate costs based on employment type
    const shiftHours = this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes);
    const { shiftCost, niCost, pensionCost, totalShiftCost } = this.calculateCosts(staffMember, shiftHours, date);
    
    shift.shift_cost = shiftCost;
    shift.employer_ni_cost = niCost;
    shift.employer_pension_cost = pensionCost;
    shift.total_cost = totalShiftCost;
    
    // Add to shifts array
    shifts.push(shift);
    
    return shift;
  }
  
  /**
   * Update staff allocations after assigning a shift
   */
  updateStaffAllocations(
    staffId: string,
    date: string,
    hours: number,
    shift: any,
    staffWeeklyAllocations: Record<string, any>
  ) {
    console.log(`Updating allocations for ${staffId} on ${date}, adding ${hours} hours`);
    
    // Update weekly allocations
    if (!staffWeeklyAllocations[staffId]) {
      staffWeeklyAllocations[staffId] = {
        hoursWorked: 0,
        daysWorked: [],
        shifts: []
      };
    }
    
    // Add hours
    staffWeeklyAllocations[staffId].hoursWorked += hours;
    
    // Add shift to list
    staffWeeklyAllocations[staffId].shifts.push(shift);
    
    // Add day if not already worked
    if (!staffWeeklyAllocations[staffId].daysWorked.includes(date)) {
      staffWeeklyAllocations[staffId].daysWorked.push(date);
    }
    
    // Update daily allocations
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
    this.dailyStaffAllocations[date][staffId].shifts.push(shift);
  }
  
  /**
   * Calculate costs for a shift based on staff member and hours
   */
  calculateCosts(
    staffMember: any,
    hours: number,
    date: string
  ): { shiftCost: number; niCost: number; pensionCost: number; totalShiftCost: number } {
    // Default values
    let shiftCost = 0;
    let niCost = 0;
    let pensionCost = 0;
    
    try {
      const employmentType = staffMember.employment_type?.toLowerCase() || 'hourly';
      
      // Check if we've already applied salary for this staff member today
      const dailyAllocation = this.dailyStaffAllocations[date]?.[staffMember.id];
      const salaryAlreadyApplied = dailyAllocation?.salaryApplied || false;
      
      // Calculate base shift cost based on employment type
      if (employmentType === 'hourly') {
        // Hourly paid staff - use hourly rate * hours
        const hourlyRate = parseFloat(staffMember.wage_rate) || 0;
        shiftCost = hourlyRate * hours;
      } 
      else if (employmentType === 'salaried' || employmentType === 'salary') {
        // Salaried staff - distribute annual salary across days
        if (salaryAlreadyApplied) {
          // If we've already assigned a shift to this salaried staff member today,
          // don't double count their salary cost
          shiftCost = 0;
        } else {
          // Calculate daily rate from annual salary
          const annualSalary = parseFloat(staffMember.annual_salary) || 0;
          const dailyRate = annualSalary / 260; // Assuming 260 working days per year
          shiftCost = dailyRate;
          
          // Mark salary as applied for today
          if (dailyAllocation) {
            this.dailyStaffAllocations[date][staffMember.id].salaryApplied = true;
          }
        }
      } 
      else if (employmentType === 'contractor') {
        // Contractor - use contractor rate * hours
        const contractorRate = parseFloat(staffMember.contractor_rate) || 0;
        shiftCost = contractorRate * hours;
      } 
      else {
        // Unknown employment type - default to zero cost
        shiftCost = 0;
      }
      
      // Calculate employer costs
      if (employmentType === 'hourly' || employmentType === 'salary' || employmentType === 'salaried') {
        // Calculate employer's NI (approximately 13.8% above threshold)
        // This is a simplified calculation
        niCost = shiftCost > 0 ? shiftCost * 0.138 : 0;
        
        // Calculate employer's pension contribution (approximately 3%)
        // This is a simplified calculation
        pensionCost = shiftCost > 0 ? shiftCost * 0.03 : 0;
      }
      
      // Ensure all values are valid numbers
      shiftCost = isNaN(shiftCost) ? 0 : shiftCost;
      niCost = isNaN(niCost) ? 0 : niCost;
      pensionCost = isNaN(pensionCost) ? 0 : pensionCost;
    } 
    catch (error) {
      console.error('Error calculating shift costs:', error);
      // Fall back to zeros if there's an error
      shiftCost = 0;
      niCost = 0;
      pensionCost = 0;
    }
    
    // Total cost is the sum of all components
    const totalShiftCost = shiftCost + niCost + pensionCost;
    
    return { 
      shiftCost, 
      niCost, 
      pensionCost, 
      totalShiftCost 
    };
  }
  
  /**
   * Calculate hours based on start time, end time, and break minutes
   */
  calculateHours(
    startTime: string,
    endTime: string,
    breakMinutes: number = 0
  ): number {
    if (!startTime || !endTime) return 0;
    
    try {
      // Parse hours and minutes from start time
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      // Create date objects for calculation
      const startDate = new Date();
      startDate.setHours(startHours, startMinutes, 0, 0);
      
      const endDate = new Date();
      endDate.setHours(endHours, endMinutes, 0, 0);
      
      // Handle shifts that span midnight
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      
      // Calculate difference in milliseconds
      const diffMs = endDate.getTime() - startDate.getTime();
      
      // Convert to hours and subtract break
      const totalMinutes = diffMs / 60000 - (breakMinutes || 0);
      const hours = totalMinutes / 60;
      
      return Math.max(0, hours); // Ensure we never return negative hours
    } catch (error) {
      console.error('Error calculating shift hours:', error);
      return 0;
    }
  }
}
