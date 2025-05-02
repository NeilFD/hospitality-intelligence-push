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
   * Check if a job title is a management role
   * FIXED: Now uses proper word boundary checking to prevent false matches
   */
  isManagerRole(jobTitle: string): boolean {
    if (!jobTitle) return false;
    
    // Define exact manager keywords with word boundaries
    const managerTitles = [
      'manager',
      'head chef',
      'chef manager',
      'supervisor',
      'assistant manager',
      'general manager',
      'deputy manager'
    ];
    
    const jobTitleLower = jobTitle.toLowerCase();
    
    // Debug logging to help understand role classification
    console.log(`Checking if "${jobTitle}" is a manager role`);
    
    // Use proper word boundary checking to avoid partial matches
    for (const title of managerTitles) {
      // Check if the exact word is in the job title
      const hasManagerTitle = new RegExp(`\\b${title}\\b`, 'i').test(jobTitleLower);
      
      if (hasManagerTitle) {
        console.log(`✅ "${jobTitle}" classified as manager role - matched "${title}"`);
        return true;
      }
    }
    
    console.log(`❌ "${jobTitle}" is NOT a manager role`);
    return false;
  }
  
  /**
   * NEW: Configuration for staff priority weighting
   * This allows adjusting the importance of different factors in staff ranking
   */
  staffPriorityConfig = {
    salariedWeight: 100,  // Base priority for salaried staff
    managerWeight: 50,    // Additional priority for managers
    hiScoreWeight: 1      // Multiplier for hi_score
  };
  
  /**
   * Set staff priority configuration
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
    this.staffPriorityConfig.salariedWeight = salariedWeight;
    this.staffPriorityConfig.managerWeight = managerWeight;
    this.staffPriorityConfig.hiScoreWeight = hiScoreWeight;
    
    console.log(`Staff priority weights updated: salaried=${salariedWeight}, manager=${managerWeight}, hiScore=${hiScoreWeight}`);
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
    
    // Sort staff by employment type and hi score with configurable weights
    const rankedStaff = [...availableStaff].sort((a, b) => {
      // Calculate weighted priority scores
      let scoreA = 0;
      let scoreB = 0;
      
      // Apply salaried weight
      if (a.employment_type === 'salaried') {
        scoreA += this.staffPriorityConfig.salariedWeight;
      }
      if (b.employment_type === 'salaried') {
        scoreB += this.staffPriorityConfig.salariedWeight;
      }
      
      // Apply manager weight - FIXED to use proper manager detection
      const aIsManager = this.isManagerRole(a.job_title);
      const bIsManager = this.isManagerRole(b.job_title);
      
      if (aIsManager) {
        scoreA += this.staffPriorityConfig.managerWeight;
      }
      if (bIsManager) {
        scoreB += this.staffPriorityConfig.managerWeight;
      }
      
      // Apply hi score weight
      scoreA += (a.hi_score || 0) * this.staffPriorityConfig.hiScoreWeight;
      scoreB += (b.hi_score || 0) * this.staffPriorityConfig.hiScoreWeight;
      
      // Log staff ranking for debugging
      console.log(`Staff ranking comparison: 
      ${a.first_name} ${a.last_name} (${a.job_title}): Score=${scoreA} | Salaried: ${a.employment_type === 'salaried'}, Manager: ${aIsManager}, Hi-Score: ${a.hi_score || 0}
      ${b.first_name} ${b.last_name} (${b.job_title}): Score=${scoreB} | Salaried: ${b.employment_type === 'salaried'}, Manager: ${bIsManager}, Hi-Score: ${b.hi_score || 0}
      `);
      
      // Sort by total score (higher scores first)
      return scoreB - scoreA;
    });
    
    console.log("Staff ranking results:");
    rankedStaff.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.first_name} ${staff.last_name} (${staff.job_title}) - ${staff.employment_type} | Manager: ${this.isManagerRole(staff.job_title)} | Hi-Score: ${staff.hi_score || 0}`);
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
      console.log("Performing enhanced balancing pass to ensure minimum hour requirements are met...");
      this.balanceShiftsForMinimumHours(shifts, staffWeeklyAllocations, rankedStaff, totalCost);
      
      // Add an additional pass to rebalance from managers to non-managers if needed
      this.redistributeFromManagersIfNeeded(shifts, staffWeeklyAllocations, rankedStaff, totalCost);
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
    const existingShifts = shifts.filter(shift => shift.date === date);
    
    // Count by job type
    const fohShifts = existingShifts.filter(shift => {
      const role = this.jobRoles.find(r => r.id === shift.job_role_id);
      return role && role.department?.toLowerCase() === 'foh';
    });
    
    const kitchenShifts = existingShifts.filter(shift => {
      const role = this.jobRoles.find(r => r.id === shift.job_role_id);
      return role && role.department?.toLowerCase() === 'kitchen' && 
             role.title?.toLowerCase() !== 'kitchen porter' &&
             role.title?.toLowerCase() !== 'kp';
    });
    
    const kpShifts = existingShifts.filter(shift => {
      const role = this.jobRoles.find(r => r.id === shift.job_role_id);
      return role && (role.title?.toLowerCase() === 'kitchen porter' || 
                      role.title?.toLowerCase() === 'kp');
    });
    
    console.log(`Current staffing for ${date}: FOH=${fohShifts.length}, Kitchen=${kitchenShifts.length}, KP=${kpShifts.length}`);
    
    // Check if we need to add more staff to meet threshold minimums
    const segment = this.isWeekend(dayOfWeek) ? 'weekend-day' : 'weekday-day';
    
    // Check FOH minimums
    if (fohShifts.length < threshold.foh_min_staff) {
      console.log(`Need to add ${threshold.foh_min_staff - fohShifts.length} more FOH staff to meet minimum threshold`);
      
      // Assign additional FOH staff to meet minimum
      this.assignStaff({
        date,
        dayOfWeek,
        segment,
        staffType: 'foh',
        minStaff: threshold.foh_min_staff - fohShifts.length,
        maxStaff: threshold.foh_min_staff - fohShifts.length,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
    }
    
    // Check Kitchen minimums
    if (kitchenShifts.length < threshold.kitchen_min_staff) {
      console.log(`Need to add ${threshold.kitchen_min_staff - kitchenShifts.length} more Kitchen staff to meet minimum threshold`);
      
      // Assign additional Kitchen staff to meet minimum
      this.assignStaff({
        date,
        dayOfWeek,
        segment,
        staffType: 'kitchen',
        minStaff: threshold.kitchen_min_staff - kitchenShifts.length,
        maxStaff: threshold.kitchen_min_staff - kitchenShifts.length,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
    }
    
    // Check KP minimums
    if (kpShifts.length < threshold.kp_min_staff) {
      console.log(`Need to add ${threshold.kp_min_staff - kpShifts.length} more KP staff to meet minimum threshold`);
      
      // Assign additional KP staff to meet minimum
      this.assignStaff({
        date,
        dayOfWeek,
        segment,
        staffType: 'kp',
        minStaff: threshold.kp_min_staff - kpShifts.length,
        maxStaff: threshold.kp_min_staff - kpShifts.length,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue
      });
    }
  }
  
  /**
   * NEW: Redistribute shifts from managers to non-managers if needed
   * This helps ensure regular staff get enough hours and shifts aren't overly concentrated with managers
   */
  redistributeFromManagersIfNeeded(
    shifts: any[],
    staffWeeklyAllocations: Record<string, any>,
    rankedStaff: any[],
    totalCost: number
  ): void {
    console.log("Starting shift redistribution from managers to non-managers...");
    
    // Identify managers with many shifts
    const managerStaff = rankedStaff.filter(staff => this.isManagerRole(staff.job_title));
    
    if (managerStaff.length === 0) {
      console.log("No manager staff found for redistribution.");
      return;
    }
    
    const managerWithHours = managerStaff
      .filter(manager => {
        const allocation = staffWeeklyAllocations[manager.id];
        return allocation && allocation.hoursWorked > 0;
      })
      .map(manager => ({
        ...manager,
        hours: staffWeeklyAllocations[manager.id].hoursWorked,
        minHours: manager.min_hours_per_week || 0
      }))
      .filter(manager => manager.hours > manager.minHours + 5); // Only consider managers who have 5+ hours over their minimum
    
    if (managerWithHours.length === 0) {
      console.log("No managers have excess hours for redistribution.");
      return;
    }
    
    // Sort by most excess hours
    managerWithHours.sort((a, b) => {
      const aExcess = a.hours - a.minHours;
      const bExcess = b.hours - b.minHours;
      return bExcess - aExcess;
    });
    
    console.log(`Found ${managerWithHours.length} managers with excess hours for potential redistribution:`);
    managerWithHours.forEach(manager => {
      const excess = manager.hours - manager.minHours;
      console.log(`- ${manager.first_name} ${manager.last_name}: ${manager.hours.toFixed(1)}h (${excess.toFixed(1)}h over minimum)`);
    });
    
    // Find eligible non-manager staff who need more hours
    const nonManagerStaff = rankedStaff.filter(staff => 
      !this.isManagerRole(staff.job_title) && 
      staff.employment_type !== 'salaried' && // Don't redistribute to salaried staff
      (staff.min_hours_per_week || 0) > 0
    );
    
    if (nonManagerStaff.length === 0) {
      console.log("No eligible non-manager staff found for hour redistribution.");
      return;
    }
    
    // Calculate hour deficits for non-manager staff
    const nonManagersWithDeficits = nonManagerStaff
      .map(staff => {
        const allocation = staffWeeklyAllocations[staff.id];
        const currentHours = allocation ? allocation.hoursWorked : 0;
        const minHours = staff.min_hours_per_week || 0;
        const deficit = minHours > 0 ? minHours - currentHours : 0;
        
        return {
          ...staff,
          hours: currentHours,
          minHours,
          deficit
        };
      })
      .filter(staff => staff.deficit > 2); // Only consider significant deficits
    
    if (nonManagersWithDeficits.length === 0) {
      console.log("No non-manager staff have significant hour deficits for redistribution.");
      return;
    }
    
    // Sort by largest deficit
    nonManagersWithDeficits.sort((a, b) => b.deficit - a.deficit);
    
    console.log(`Found ${nonManagersWithDeficits.length} non-manager staff with hour deficits:`);
    nonManagersWithDeficits.forEach(staff => {
      console.log(`- ${staff.first_name} ${staff.last_name}: ${staff.hours.toFixed(1)}h (needs ${staff.deficit.toFixed(1)}h more)`);
    });
    
    // Attempt to redistribute shifts
    for (const nonManager of nonManagersWithDeficits) {
      if (nonManager.deficit <= 2) continue; // Skip if deficit is now minimal
      
      console.log(`Attempting to find shifts for ${nonManager.first_name} ${nonManager.last_name} who needs ${nonManager.deficit.toFixed(1)}h more`);
      
      // Check each manager with excess hours
      for (const manager of managerWithHours) {
        const managerExcess = manager.hours - manager.minHours;
        if (managerExcess <= 2) continue; // Skip if not much excess left
        
        // Get shifts for this manager
        const managerShifts = shifts.filter(shift => 
          shift.profile_id === manager.id && 
          !shift.is_balanced_shift // Don't redistribute already balanced shifts
        );
        
        // Sort by shortest first - easier to reallocate
        managerShifts.sort((a, b) => {
          const aHours = this.calculateHours(a.start_time, a.end_time, a.break_minutes);
          const bHours = this.calculateHours(b.start_time, b.end_time, b.break_minutes);
          return aHours - bHours;
        });
        
        // Try to find an eligible shift
        for (const shift of managerShifts) {
          // Check if the non-manager is eligible for this role
          const jobRole = this.jobRoles.find(r => r.id === shift.job_role_id);
          if (!jobRole) continue;
          
          const isEligible = this.isStaffEligibleForRole(nonManager, jobRole);
          if (!isEligible) continue;
          
          // Check if adding this shift respects the non-manager's constraints
          const shiftHours = this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes);
          
          // Get current allocation for this day
          const allocation = staffWeeklyAllocations[nonManager.id];
          const isAlreadyWorkingThatDay = allocation.daysWorked.includes(shift.date);
          const currentDays = allocation.daysWorked.length;
          const maxDays = nonManager.max_days_per_week || 5;
          
          // Skip if adding a new work day would exceed max days
          if (!isAlreadyWorkingThatDay && currentDays >= maxDays) {
            continue;
          }
          
          // Check daily hour constraints
          if (isAlreadyWorkingThatDay) {
            const dailyAlloc = this.dailyStaffAllocations[shift.date]?.[nonManager.id];
            const currentDailyHours = dailyAlloc ? dailyAlloc.hoursWorked : 0;
            const maxHoursPerDay = nonManager.max_hours_per_day || 12;
            
            if (currentDailyHours + shiftHours > maxHoursPerDay) {
              continue; // Skip if this would exceed max daily hours
            }
          }
          
          // This shift is suitable for redistribution
          console.log(`Redistributing shift on ${shift.date} (${shiftHours.toFixed(1)}h) from ${manager.first_name} to ${nonManager.first_name}`);
          
          // Remove the shift from the manager
          this.removeShiftAllocation(manager.id, shift, staffWeeklyAllocations);
          
          // Update manager's tracked hours
          manager.hours -= shiftHours;
          
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
          shift.is_redistributed_shift = true; // Mark as a redistributed shift
          
          // Add the shift to the non-manager
          this.updateStaffAllocations(nonManager.id, shift.date, shiftHours, shift, staffWeeklyAllocations);
          
          // Update non-manager's tracked hours and deficit
          nonManager.hours += shiftHours;
          nonManager.deficit -= shiftHours;
          
          // Break if deficit has been adequately addressed
          if (nonManager.deficit <= 2) {
            console.log(`${nonManager.first_name}'s hour deficit has been addressed.`);
            break;
          }
        }
        
        // Break manager loop if deficit resolved
        if (nonManager.deficit <= 2) break;
      }
    }
    
    console.log("Manager shift redistribution completed.");
  }
  
  /**
   * Check if a role is a secondary role for a staff member
   */
  isSecondaryRole(staff: any, jobRole: any): boolean {
    if (!staff || !jobRole || !jobRole.title) return false;
    
    // Check if the job role matches the staff's primary job title
    if (staff.job_title === jobRole.title) {
      return false; // Not a secondary role
    }
    
    // Check if the role is in the staff's secondary roles array
    if (Array.isArray(staff.secondary_job_roles) && 
        staff.secondary_job_roles.includes(jobRole.title)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate shift costs based on staff member's employment type and rates
   */
  calculateCosts(staff: any, hours: number, date: string): {
    shiftCost: number;
    niCost: number;
    pensionCost: number;
    totalShiftCost: number;
  } {
    // Default values
    let shiftCost = 0;
    let niCost = 0;
    let pensionCost = 0;
    
    if (staff.employment_type === 'hourly') {
      // For hourly staff, calculate based on wage rate and hours
      const hourlyRate = staff.wage_rate || 0;
      shiftCost = hourlyRate * hours;
      
      // Calculate employer NI and pension contributions (approximate)
      niCost = shiftCost * 0.138; // 13.8% employer NI (simplified)
      pensionCost = shiftCost * 0.03; // 3% employer pension (simplified)
    }
    else if (staff.employment_type === 'salaried') {
      // For salaried staff, check if we've already applied their salary for this day
      const dailyAllocation = this.dailyStaffAllocations[date]?.[staff.id];
      
      if (dailyAllocation && !dailyAllocation.salaryApplied) {
        // Calculate daily cost as annual salary / 260 (approximate working days per year)
        const annualSalary = staff.annual_salary || 0;
        const dailySalary = annualSalary / 260;
        
        shiftCost = dailySalary;
        
        // Calculate employer NI and pension contributions (approximate)
        niCost = dailySalary * 0.138;
        pensionCost = dailySalary * 0.05; // Higher pension % for salaried staff
        
        // Mark this day's salary as applied to avoid double-counting
        if (dailyAllocation) {
          dailyAllocation.salaryApplied = true;
        }
      }
      // If salary already applied today, no additional cost
    }
    else if (staff.employment_type === 'contractor') {
      // For contractors, use their hourly rate with no additional costs
      const contractorRate = staff.wage_rate || 0;
      shiftCost = contractorRate * hours;
      // No employer NI or pension for contractors
    }
    
    const totalShiftCost = shiftCost + niCost + pensionCost;
    
    return {
      shiftCost,
      niCost,
      pensionCost,
      totalShiftCost
    };
  }
  
  /**
   * Calculate hours between start and end times, accounting for breaks
   */
  calculateHours(start: string, end: string, breakMinutes: number = 0): number {
    // Parse times as hours and minutes
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    // Convert to total minutes
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    // Calculate shift duration in minutes, accounting for breaks
    const shiftMinutes = endTotalMinutes - startTotalMinutes - breakMinutes;
    
    // Convert minutes to hours
    return Math.max(0, shiftMinutes / 60);
  }
  
  /**
   * Update staff allocations when assigning a shift
   */
  updateStaffAllocations(
    staffId: string,
    date: string,
    hours: number,
    shift: any,
    weeklyAllocations: Record<string, any>
  ): void {
    // Update weekly allocations
    if (weeklyAllocations[staffId]) {
      weeklyAllocations[staffId].hoursWorked += hours;
      weeklyAllocations[staffId].shifts.push(shift);
      
      // Add day to days worked if not already there
      if (!weeklyAllocations[staffId].daysWorked.includes(date)) {
        weeklyAllocations[staffId].daysWorked.push(date);
      }
    }
    
    // Update daily allocations
    if (this.dailyStaffAllocations[date]?.[staffId]) {
      this.dailyStaffAllocations[date][staffId].hoursWorked += hours;
      this.dailyStaffAllocations[date][staffId].shifts.push(shift);
    }
  }
  
  /**
   * Check if a day is a weekend day
   */
  isWeekend(day: string): boolean {
    const lowerDay = day.toLowerCase();
    return lowerDay === 'saturday' || lowerDay === 'sunday';
  }
  
  /**
   * Find the applicable threshold based on revenue amount
   */
  findThreshold(revenue: number): any {
    return this.thresholds.find(t => 
      revenue >= (t.revenue_min || 0) && 
      revenue <= (t.revenue_max || Number.MAX_SAFE_INTEGER)
    );
  }
  
  /**
   * Get all shift rules applicable for a specific day
   */
  getShiftRulesForDay(dayCode: string): any[] {
    return this.shiftRules.filter(rule => {
      // Check if the rule applies to this day
      if (!rule.days || !Array.isArray(rule.days)) return false;
      
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
    // Implementation would go here...
    // Placeholder for complete implementation
    console.log(`Assigning staff based on shift rule for ${date}`);
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
    // Implementation would go here...
    // Placeholder for complete implementation
    console.log(`Assigning staff with default values for ${date}`);
  }
  
  /**
   * Assign staff based on type and segment
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
    staffType: 'foh' | 'kitchen' | 'kp';
    minStaff: number;
    maxStaff: number;
    rankedStaff: any[];
    staffWeeklyAllocations: Record<string, any>;
    shifts: any[];
    totalCost: number;
    dayRevenue: number;
  }) {
    // Implementation would go here...
    // Placeholder for complete implementation
    console.log(`Assigning ${staffType} staff for ${date}, segment: ${segment}`);
  }
}
