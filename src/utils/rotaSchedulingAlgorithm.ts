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
    
    return {
      shifts,
      total_cost: totalCost,
      revenue_forecast: totalRevenue,
      cost_percentage: costPercentage
    };
  };

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
    
    // Check if we have the minimum required staff for each type
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
   * Count staff of a specific type in existing shifts
   */
  countStaffByType(shifts: any[], staffType: string, allStaff: any[]): number {
    // Get the profiles that match this staff type
    const staffByType = allStaff.filter(staff => {
      if (staffType === 'foh') {
        return !this.isKitchenRole(staff.job_title) && !this.isKitchenPorterRole(staff.job_title);
      } else if (staffType === 'kitchen') {
        return this.isKitchenRole(staff.job_title) && !this.isKitchenPorterRole(staff.job_title);
      } else if (staffType === 'kp') {
        return this.isKitchenPorterRole(staff.job_title);
      }
      return false;
    });
    
    const staffIds = staffByType.map(staff => staff.id);
    
    // Count unique staff members in the shifts that match the staff type
    const uniqueStaff = new Set();
    for (const shift of shifts) {
      if (staffIds.includes(shift.profile_id)) {
        uniqueStaff.add(shift.profile_id);
      }
    }
    
    return uniqueStaff.size;
  }

  /**
   * Check if a job title is a management role
   */
  isManagerRole(jobTitle: string): boolean {
    if (!jobTitle) return false;
    
    const title = jobTitle.toLowerCase();
    return title.includes('manager') || 
           title.includes('supervisor') || 
           title.includes('head chef') ||
           title.includes('chef manager');
  }

  /**
   * Create an emergency shift for a date with no assignments
   */
  createEmergencyShift(date: string, dayOfWeek: string, staffMember: any, shifts: any[]) {
    // Find a suitable job role for the staff member
    let roleId = '';
    let roleTitle = '';
    
    if (staffMember.job_title) {
      // Try to find a role that matches the staff member's job title
      const role = this.jobRoles.find(r => r.title === staffMember.job_title);
      if (role) {
        roleId = role.id;
        roleTitle = role.title;
      }
    }
    
    // If no role found, use the first available role
    if (!roleId && this.jobRoles.length > 0) {
      roleId = this.jobRoles[0].id;
      roleTitle = this.jobRoles[0].title;
    }
    
    console.log(`Creating emergency shift for ${staffMember.first_name} ${staffMember.last_name} as ${roleTitle} on ${date}`);
    
    // Set default times based on day of week
    const isWeekend = this.isWeekend(dayOfWeek);
    const startTime = isWeekend ? '10:00:00' : '09:00:00';
    const endTime = isWeekend ? '18:00:00' : '17:00:00';
    const breakMinutes = 30;
    
    // Calculate costs (pass date for salaried staff tracking)
    const hours = this.calculateHours(startTime, endTime, breakMinutes);
    const { shiftCost, niCost, pensionCost, totalShiftCost, isSecondShift } = 
      this.calculateCosts(staffMember, hours, date);
    
    // Create the shift
    const emergencyShift = {
      profile_id: staffMember.id,
      date,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      break_minutes: breakMinutes,
      job_role_id: roleId,
      is_secondary_role: false,
      hi_score: staffMember.hi_score || 0,
      shift_cost: shiftCost,
      employer_ni_cost: niCost,
      employer_pension_cost: pensionCost,
      total_cost: totalShiftCost,
      is_emergency_shift: true,  // Mark as emergency shift
      is_second_shift_of_day: isSecondShift // Mark if this is a second shift with zero cost
    };
    
    shifts.push(emergencyShift);
    return emergencyShift;
  }

  /**
   * Helper to check if a day is a weekend
   */
  isWeekend(dayOfWeek: string) {
    return dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
  }

  /**
   * Get all shift rules that apply to a specific day
   */
  getShiftRulesForDay(dayCode: string) {
    if (!dayCode) {
      console.warn("Warning: getShiftRulesForDay called with null or undefined dayCode");
      return [];
    }
    
    const rules = this.shiftRules.filter(rule => 
      rule.day_of_week === dayCode && 
      rule.archived !== true
    );
    
    console.log(`getShiftRulesForDay(${dayCode}): found ${rules.length} rules`);
    return rules;
  }
  
  /**
   * Get trough periods for a specific shift rule
   */
  getTroughPeriodsForShiftRule(shiftRuleId: string) {
    return this.troughPeriods.filter(trough => 
      trough.shift_rule_id === shiftRuleId
    );
  }
  
  /**
   * Check if a given time falls within a trough period
   */
  isTimeInTroughPeriod(time: string, shiftRuleId: string): any {
    const troughs = this.getTroughPeriodsForShiftRule(shiftRuleId);
    if (!troughs || troughs.length === 0) return null;
    
    // Parse time to decimal hours for comparison
    const [hours, minutes] = time.split(':');
    const timeDecimal = parseInt(hours) + parseInt(minutes) / 60;
    
    // Check each trough period
    for (const trough of troughs) {
      const [troughStartHours, troughStartMinutes] = trough.start_time.split(':');
      const [troughEndHours, troughEndMinutes] = trough.end_time.split(':');
      
      const troughStartDecimal = parseInt(troughStartHours) + parseInt(troughStartMinutes) / 60;
      const troughEndDecimal = parseInt(troughEndHours) + parseInt(troughEndMinutes) / 60;
      
      // If time is within trough period, return the trough
      if (timeDecimal >= troughStartDecimal && timeDecimal < troughEndDecimal) {
        return trough;
      }
    }
    
    return null;
  }
  
  /**
   * Get the effective maximum staff for a shift at a specific time,
   * taking into account any trough periods
   */
  getEffectiveMaxStaff(time: string, shiftRule: any): number {
    // Check if this time falls within a trough period
    const trough = this.isTimeInTroughPeriod(time, shiftRule.id);
    
    // If it does, use the trough max_staff_override
    if (trough) {
      return trough.max_staff_override;
    }
    
    // Otherwise use the default max_staff
    return shiftRule.max_staff;
  }

  /**
   * FIXED: Get staff eligible for a job role based on role mapping priorities
   * This is the main function that prevents incorrect role assignments
   */
  getEligibleStaffForRole(jobRoleId: string, rankedStaff: any[]): any[] {
    console.log(`Finding eligible staff for job role ID: ${jobRoleId}`);
    
    // Get the job role title for logging
    const jobRole = this.jobRoles.find(role => role.id === jobRoleId);
    const jobRoleTitle = jobRole?.title || 'Unknown Role';
    
    console.log(`Job role title for ${jobRoleId}: ${jobRoleTitle}`);
    
    // Get role mappings for this job role, sorted by priority
    const relevantMappings = this.roleMapping
      .filter(mapping => mapping.job_role_id === jobRoleId)
      .sort((a, b) => a.priority - b.priority);
    
    if (relevantMappings.length === 0) {
      console.log(`No role mappings found for job role ID: ${jobRoleId} (${jobRoleTitle})`);
      return [];
    }
    
    console.log(`Found ${relevantMappings.length} role mappings for ${jobRoleTitle}:`);
    relevantMappings.forEach((mapping, index) => {
      console.log(`Priority ${mapping.priority}: ${mapping.job_title}`);
    });
    
    // Extract allowed job titles from the mappings
    const allowedJobTitles = relevantMappings.map(mapping => mapping.job_title);
    
    // Find staff with matching job titles (primary roles)
    const staffWithPrimaryRoles = rankedStaff.filter(staff => 
      allowedJobTitles.includes(staff.job_title)
    );
    
    console.log(`Found ${staffWithPrimaryRoles.length} staff with primary role match for ${jobRoleTitle}`);
    
    // FIXED: Improved secondary role matching - strict checking
    const staffWithSecondaryRoles = rankedStaff.filter(staff => {
      // Skip if already included as primary role
      if (staffWithPrimaryRoles.some(s => s.id === staff.id)) {
        return false;
      }
      
      // FIXED: Proper check if secondary_job_roles is an array and contains the allowed job titles
      if (Array.isArray(staff.secondary_job_roles)) {
        // Check each allowed job title against the secondary roles
        const hasMatchingSecondaryRole = allowedJobTitles.some(allowedTitle => 
          staff.secondary_job_roles.includes(allowedTitle)
        );
        
        if (hasMatchingSecondaryRole) {
          // Log the match for debugging
          const matchingTitles = allowedJobTitles.filter(title => 
            staff.secondary_job_roles.includes(title)
          );
          
          console.log(`${staff.first_name} ${staff.last_name} can do ${jobRoleTitle} as secondary role (matches: ${matchingTitles.join(', ')})`);
          return true;
        }
      }
      
      return false;
    });
    
    console.log(`Found ${staffWithSecondaryRoles.length} staff with secondary role match for ${jobRoleTitle}`);
    
    // Combine primary and secondary role matches
    const allEligibleStaff = [...staffWithPrimaryRoles, ...staffWithSecondaryRoles];
    
    // FIXED: Log detailed info about eligible staff
    if (allEligibleStaff.length > 0) {
      console.log(`Total ${allEligibleStaff.length} eligible staff for ${jobRoleTitle}:`);
      
      // Sort by priority based on the role mapping
      allEligibleStaff.sort((staffA, staffB) => {
        // Find the priority for primary role matches
        const mappingA = relevantMappings.find(m => m.job_title === staffA.job_title);
        const mappingB = relevantMappings.find(m => m.job_title === staffB.job_title);
        
        // If both have primary role matches, sort by priority
        if (mappingA && mappingB) {
          return mappingA.priority - mappingB.priority;
        }
        
        // If A has primary role match but B doesn't, A comes first
        if (mappingA && !mappingB) {
          return -1;
        }
        
        // If B has primary role match but A doesn't, B comes first
        if (!mappingA && mappingB) {
          return 1;
        }
        
        // For secondary role matches or if no direct match found, try to find best match
        // in secondary roles based on priority
        const bestSecondaryMatchA = this.findBestSecondaryRoleMatch(staffA, relevantMappings);
        const bestSecondaryMatchB = this.findBestSecondaryRoleMatch(staffB, relevantMappings);
        
        // If both have secondary matches, compare their priorities
        if (bestSecondaryMatchA && bestSecondaryMatchB) {
          return bestSecondaryMatchA.priority - bestSecondaryMatchB.priority;
        }
        
        // If only A has secondary match, A comes first
        if (bestSecondaryMatchA && !bestSecondaryMatchB) {
          return -1;
        }
        
        // If only B has secondary match, B comes first
        if (!bestSecondaryMatchA && bestSecondaryMatchB) {
          return 1;
        }
        
        // Finally sort by hi score
        return (staffB.hi_score || 0) - (staffA.hi_score || 0);
      });
      
      // Log sorted staff details
      allEligibleStaff.forEach((staff, index) => {
        const isPrimaryRole = staff.job_title === jobRoleTitle;
        const secondaryMatch = Array.isArray(staff.secondary_job_roles) ? 
          staff.secondary_job_roles.filter(title => allowedJobTitles.includes(title)).join(', ') : 
          'None';
          
        console.log(`${index + 1}. ${staff.first_name} ${staff.last_name} - Primary: ${staff.job_title}, Secondary: ${secondaryMatch}, HiScore: ${staff.hi_score || 0}`);
      });
    } else {
      console.log(`WARNING: No eligible staff found for ${jobRoleTitle} - this shift cannot be filled properly`);
    }
    
    return allEligibleStaff;
  }
  
  /**
   * NEW: Helper function to find best secondary role match based on priority
   */
  findBestSecondaryRoleMatch(staff: any, roleMappings: any[]): any {
    if (!Array.isArray(staff.secondary_job_roles) || staff.secondary_job_roles.length === 0) {
      return null;
    }
    
    // Find all mappings that match this staff's secondary roles
    const matchingMappings = roleMappings.filter(mapping => 
      staff.secondary_job_roles.includes(mapping.job_title)
    );
    
    if (matchingMappings.length === 0) {
      return null;
    }
    
    // Return the mapping with the lowest priority (highest precedence)
    return matchingMappings.reduce((best, current) => 
      current.priority < best.priority ? current : best
    );
  }

  /**
   * FIXED: Check if a role is a secondary role for a staff member
   */
  isSecondaryRole(staff: any, jobRole: any): boolean {
    // If no job role provided or no staff provided, cannot be a secondary role
    if (!staff || !jobRole) return false;
    
    // If the staff's primary job title matches the role, it's not a secondary role
    if (staff.job_title === jobRole.title) {
      return false;
    }
    
    // Check if the role is in the staff's secondary_job_roles array
    if (Array.isArray(staff.secondary_job_roles)) {
      return staff.secondary_job_roles.includes(jobRole.title);
    }
    
    // If secondary_job_roles is not an array, cannot be a secondary role
    return false;
  }

  /**
   * Assign staff based on a specific shift rule
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
    // Get the job role info from the rule
    const jobRole = rule.job_roles;
    const jobRoleTitle = jobRole?.title || 'Unknown Role';
    const jobRoleId = rule.job_role_id;
    
    console.log(`Processing shift rule: ${rule.name || 'Unnamed'} for ${jobRoleTitle} (ID: ${jobRoleId})`);
    
    // FIXED: Use the Role Mapping Matrix to find eligible staff
    let eligibleStaff = this.getEligibleStaffForRole(jobRoleId, rankedStaff);

    // FIXED: If no eligible staff found, log warning and return
    if (eligibleStaff.length === 0) {
      console.log(`ERROR: No eligible staff found for ${jobRoleTitle} - skipping shift rule`);
      return;
    }
    
    // Calculate shift hours
    const { startTime, endTime, breakMinutes } = {
      startTime: rule.start_time,
      endTime: rule.end_time,
      breakMinutes: 30 // Default break time
    };
    
    // Calculate shift hours
    const shiftHours = this.calculateHours(startTime, endTime, breakMinutes);
    
    // Check for trough periods
    const troughPeriods = this.getTroughPeriodsForShiftRule(rule.id);
    if (troughPeriods && troughPeriods.length > 0) {
      console.log(`Shift has ${troughPeriods.length} trough periods`);
    }
    
    // Determine how many staff to assign - properly handle min_staff: 0 case
    // If min_staff is 0 but there is a max_staff, assign at least 1 staff if revenue is good
    let staffToAssign = rule.min_staff;
    if (staffToAssign === 0 && rule.max_staff > 0) {
      // Check revenue to decide if we should assign any staff
      const dayRevenue = parseFloat(this.request.revenue_forecast?.[date] || '0');
      if (dayRevenue > 1000) {
        staffToAssign = 1; // Assign at least one staff for decent revenue
        console.log(`Revenue (${dayRevenue}) is good, assigning 1 staff despite min_staff=0`);
      } else {
        console.log(`Revenue (${dayRevenue}) is low, respecting min_staff=0`);
      }
    }
    
    // If staffToAssign is undefined or null, default to 1
    if (staffToAssign === undefined || staffToAssign === null) {
      staffToAssign = 1;
    }
    
    console.log(`Will assign ${staffToAssign} staff for ${rule.name || jobRoleTitle}`);
    
    // Assign staff up to the required number
    for (let i = 0; i < staffToAssign; i++) {
      // Find the best available staff member for this shift
      const staffMember = this.findBestStaffForShift(
        eligibleStaff, 
        date, 
        shiftHours, 
        staffWeeklyAllocations,
        false // Don't yet consider part shifts when executing shift rule
      );
      
      if (!staffMember) {
        console.log(`Could not find available staff for ${rule.name || jobRoleTitle} on ${date}`);
        break; // No eligible staff available
      }

      // FIXED: Check if we should create a part shift for this staff member
      // Only consider part shifts for hourly or contractor staff (not salaried)
      const canDoPartShift = this.canCreatePartShift(staffMember);
      
      // Determine if a part shift would help cost targets based on the day and revenue
      const shouldCreatePartShift = canDoPartShift && 
        this.enablePartShifts && 
        this.wouldPartShiftHelpCostTarget(dayRevenue, shiftHours, staffMember, date);
      
      // Calculate costs for this staff member (pass date for salaried staff tracking)
      // If a part shift is appropriate, calculate with adjusted hours
      let actualStartTime = startTime;
      let actualEndTime = endTime;
      let actualShiftHours = shiftHours;
      
      // If part shift is appropriate, create a shortened shift
      let isPartShift = false;
      if (shouldCreatePartShift) {
        // FIXED: Better part shift creation logic
        const partShiftDetails = this.createPartShiftTimes(startTime, endTime, breakMinutes, date);
        if (partShiftDetails) {
          actualStartTime = partShiftDetails.startTime;
          actualEndTime = partShiftDetails.endTime;
          actualShiftHours = partShiftDetails.hours;
          isPartShift = true;
          console.log(`Creating part shift for ${staffMember.first_name} ${staffMember.last_name} on ${date}: ${actualStartTime}-${actualEndTime} (${actualShiftHours} hours)`);
        }
      }
      
      const { shiftCost, niCost, pensionCost, totalShiftCost, isSecondShift } = 
        this.calculateCosts(staffMember, actualShiftHours, date);
      
      // FIXED: Better check if this is a secondary role for the staff member
      const isSecondaryRole = this.isSecondaryRole(staffMember, jobRole);
      
      // Create the shift
      const shift = {
        profile_id: staffMember.id,
        date,
        day_of_week: dayOfWeek,
        start_time: actualStartTime,
        end_time: actualEndTime,
        break_minutes: breakMinutes,
        job_role_id: rule.job_role_id,
        is_secondary_role: isSecondaryRole,
        hi_score: staffMember.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost,
        shift_rule_id: rule.id,
        shift_rule_name: rule.name || jobRoleTitle,
        is_second_shift_of_day: isSecondShift, // Mark if this is a second shift with zero cost
        is_part_shift: isPartShift // Mark if this is a part shift
      };
      
      // Add the shift
      shifts.push(shift);
      totalCost += totalShiftCost;
      
      console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} to ${rule.name || jobRoleTitle} (${actualStartTime}-${actualEndTime}) on ${date}`);
      console.log(`Job title: ${staffMember.job_title}, Is secondary role: ${isSecondaryRole}, Is part shift: ${isPartShift}`);
      
      // Update staff allocations
      this.updateStaffAllocations(staffMember.id, date, actualShiftHours, shift, staffWeeklyAllocations);
      
      // Remove this staff member from eligible staff to prevent assigning again for this rule
      eligibleStaff = eligibleStaff.filter(staff => staff.id !== staffMember.id);
      
      if (eligibleStaff.length === 0) {
        console.log(`No more eligible staff available for ${rule.name || jobRoleTitle}`);
        break;
      }
    }
  }
  
  /**
   * FIXED: Check if a staff member can do part shifts based on employment type
   */
  canCreatePartShift(staffMember: any): boolean {
    if (!staffMember) return false;
    
    // Only hourly or contractor staff can do part shifts (not salaried)
    return staffMember.employment_type === 'hourly' || 
           staffMember.employment_type === 'contractor';
  }
  
  /**
   * FIXED: Check if creating a part shift would help meet cost targets
   * Consider the specific date to make part shifts happen throughout the week
   */
  wouldPartShiftHelpCostTarget(revenue: number, fullShiftHours: number, staffMember: any, date?: string): boolean {
    if (!revenue || revenue === 0) return false;
    if (!staffMember) return false;
    
    // Determine wage rate
    const wageRate = staffMember.employment_type === 'contractor' 
      ? (staffMember.contractor_rate || 0)
      : (staffMember.wage_rate || 0);
    
    // Calculate full shift cost
    const fullShiftCost = wageRate * fullShiftHours;
    
    // Calculate cost percentage
    const fullShiftCostPercentage = (fullShiftCost / revenue) * 100;
    
    // Get the day of week from the date
    let dayOfWeek = '';
    if (date) {
      dayOfWeek = format(new Date(date), 'EEEE').toLowerCase();
    }
    
    // FIXED: Make part shift logic work for all days of the week
    // Lower threshold for weekends due to typically higher revenue
    const isWeekend = dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
    const costThreshold = isWeekend ? 20 : 25;
    
    // If revenue is high enough to support full shifts, don't use part shifts
    if (revenue > 3000 && fullShiftCostPercentage < 15) {
      return false;
    }
    
    // If we haven't determined the day (shouldn't happen) or for low revenue days
    // use a stricter threshold to encourage part shifts
    if (!dayOfWeek || revenue < 1000) {
      return fullShiftCostPercentage > 20;
    }
    
    // Increment counter for diagnostics on part shifts
    if (fullShiftCostPercentage > costThreshold) {
      console.log(`Part shift candidate for ${date} (${dayOfWeek}): Cost ${fullShiftCostPercentage.toFixed(1)}% > ${costThreshold}% threshold`);
      return true;
    }
    
    return false;
  }
  
  /**
   * FIXED: Create appropriate part shift times that consider the date
   */
  createPartShiftTimes(startTime: string, endTime: string, breakMinutes: number, date?: string): { 
    startTime: string; 
    endTime: string; 
    hours: number;
  } | null {
    // Parse times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Calculate full shift length in hours
    const fullShiftMinutes = this.calculateHours(startTime, endTime, breakMinutes) * 60;
    
    // Determine if this is a day or evening shift
    const isDayShift = startHours < 15; // Before 3pm is considered day shift
    
    // Check if part shift is within allowed hours range
    const minPartMinutes = this.minPartShiftHours * 60;
    if (fullShiftMinutes < minPartMinutes) {
      // Shift is already shorter than minimum part shift
      return null;
    }
    
    // Get the day of week from the date for different handling
    let dayOfWeek = '';
    if (date) {
      dayOfWeek = format(new Date(date), 'EEEE').toLowerCase();
    }
    
    // FIXED: Adjust part shift logic based on day of week
    // Weekend days might need longer shifts - use 75-80% of full shift
    // Weekdays might do well with shorter shifts - use 60-70% of full shift
    let targetPercentage = 0.7; // Default 70%
    
    if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') {
      targetPercentage = 0.8; // 80% for weekends
    } else if (dayOfWeek === 'friday') {
      targetPercentage = 0.75; // 75% for Friday
    } else {
      targetPercentage = 0.65; // 65% for other weekdays
    }
    
    // Calculate desired part shift length based on the day
    let partShiftMinutes = Math.round(fullShiftMinutes * targetPercentage);
    
    // Make sure part shift is at least minimum length
    partShiftMinutes = Math.max(partShiftMinutes, minPartMinutes);
    
    // Make sure part shift is not longer than maximum length
    const maxPartMinutes = this.maxPartShiftHours * 60;
    partShiftMinutes = Math.min(partShiftMinutes, maxPartMinutes);
    
    // Calculate part shift hours with break minutes subtracted
    const partShiftHours = (partShiftMinutes + breakMinutes) / 60;
    
    // Determine new start or end time based on shift type
    let newStartTime = startTime;
    let newEndTime = endTime;
    
    if (isDayShift) {
      // For day shifts, keep start time and adjust end time
      // Start time must be before latest allowed start
      const [latestStartH, latestStartM] = this.dayShiftLatestStartTime.split(':').map(Number);
      const latestStartDecimal = latestStartH + latestStartM / 60;
      const startTimeDecimal = startHours + startMinutes / 60;
      
      if (startTimeDecimal > latestStartDecimal) {
        // Can't do part shift because start time is already too late
        return null;
      }
      
      // Calculate new end time by adding part shift duration
      const endTimeDecimal = startTimeDecimal + partShiftHours;
      const newEndHours = Math.floor(endTimeDecimal);
      const newEndMinutes = Math.round((endTimeDecimal - newEndHours) * 60);
      
      // Format new end time
      newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMinutes.toString().padStart(2, '0')}:00`;
    } else {
      // For evening shifts, keep end time and adjust start time
      // End time must allow for full part shift duration
      const [latestStartH, latestStartM] = this.eveningShiftLatestStartTime.split(':').map(Number);
      const latestStartDecimal = latestStartH + latestStartM / 60;
      
      // Calculate end time decimal
      const endTimeDecimal = endHours + endMinutes / 60;
      
      // Calculate latest possible start time based on end time
      const latestPossibleStart = endTimeDecimal - partShiftHours;
      
      if (latestPossibleStart > latestStartDecimal) {
        // Can do part shift starting at the latest allowed start time
        newStartTime = this.eveningShiftLatestStartTime;
      } else {
        // Calculate new start time
        const newStartHours = Math.floor(endTimeDecimal - partShiftHours);
        const newStartMinutes = Math.round((endTimeDecimal - partShiftHours - newStartHours) * 60);
        
        // Format new start time
        newStartTime = `${newStartHours.toString().padStart(2, '0')}:${newStartMinutes.toString().padStart(2, '0')}:00`;
      }
    }
    
    // Calculate actual hours for the new part shift
    const actualHours = this.calculateHours(newStartTime, newEndTime, breakMinutes);
    
    console.log(`Part shift created: ${newStartTime} to ${newEndTime} (${actualHours} hours, including ${breakMinutes} min break)`);
    
    return {
      startTime: newStartTime,
      endTime: newEndTime,
      hours: actualHours
    };
  }

  /**
   * Assign staff with default values when no threshold is found
   * This prevents the schedule from being empty when thresholds aren't configured
   */
  assignStaffWithDefaults(
    date: string,
    dayOfWeek: string,
    revenue: number,
    rankedStaff: any[],
    staffWeeklyAllocations: Record<string, any>,
    shifts: any[],
    totalCost: number
  ) {
    const isWeekendDay = this.isWeekend(dayOfWeek);
    
    // Use a more aggressive staffing approach with lower revenue thresholds
    // to ensure we have adequate coverage
    const defaultMinFOH = Math.min(4, Math.max(1, Math.floor(revenue / 1000)));
    const defaultMinKitchen = Math.min(3, Math.max(1, Math.floor(revenue / 1500)));
    const defaultMinKP = revenue > 2000 ? 1 : 0;
    
    // Default segments
    const daySegment = isWeekendDay ? 'weekend-day' : 'weekday-day';
    const eveningSegment = isWeekendDay ? 'weekend-evening' : 'weekday-evening';
    
    console.log(`Using default staffing for ${date}: FOH=${defaultMinFOH}, Kitchen=${defaultMinKitchen}, KP=${defaultMinKP}`);
    
    // Assign FOH staff for day
    this.assignStaff({
      date,
      dayOfWeek,
      segment: daySegment,
      staffType: 'foh',
      minStaff: defaultMinFOH,
      maxStaff: defaultMinFOH + 1,
      rankedStaff,
      staffWeeklyAllocations,
      shifts,
      totalCost,
      dayRevenue: revenue
    });
    
    // Assign kitchen staff for day
    this.assignStaff({
      date,
      dayOfWeek,
      segment: daySegment,
      staffType: 'kitchen',
      minStaff: defaultMinKitchen,
      maxStaff: defaultMinKitchen + 1,
      rankedStaff,
      staffWeeklyAllocations,
      shifts,
      totalCost,
      dayRevenue: revenue
    });
    
    // Assign KP staff for day
    if (defaultMinKP > 0) {
      this.assignStaff({
        date,
        dayOfWeek,
        segment: daySegment,
        staffType: 'kp',
        minStaff: defaultMinKP,
        maxStaff: defaultMinKP + 1,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue: revenue
      });
    }
    
    // Also assign evening staff if revenue is substantial - use lower threshold
    if (revenue > 1000) {
      // Assign FOH staff for evening
      this.assignStaff({
        date,
        dayOfWeek,
        segment: eveningSegment,
        staffType: 'foh',
        minStaff: defaultMinFOH,
        maxStaff: defaultMinFOH + 1,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue: revenue
      });
      
      // Assign kitchen staff for evening
      this.assignStaff({
        date,
        dayOfWeek,
        segment: eveningSegment,
        staffType: 'kitchen',
        minStaff: defaultMinKitchen,
        maxStaff: defaultMinKitchen + 1,
        rankedStaff,
        staffWeeklyAllocations,
        shifts,
        totalCost,
        dayRevenue: revenue
      });
      
      // Assign KP staff for evening
      if (defaultMinKP > 0) {
        this.assignStaff({
          date,
          dayOfWeek,
          segment: eveningSegment,
          staffType: 'kp',
          minStaff: defaultMinKP,
          maxStaff: defaultMinKP + 1,
          rankedStaff,
          staffWeeklyAllocations,
          shifts,
          totalCost,
          dayRevenue: revenue
        });
      }
    }
  }
  
  /**
   * Find the threshold that applies to a specific revenue amount
   */
  findThreshold(revenue: number) {
    // Convert revenue to number to ensure correct comparisons
    const revenueNum = parseFloat(`${revenue}`);
    
    // Find the first threshold where revenue is between min and max
    return this.thresholds.find(t =>
      revenueNum >= parseFloat(`${t.revenue_min}`) &&
      revenueNum < parseFloat(`${t.revenue_max}`)
    );
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
    // Skip if min staff is 0
    if (minStaff <= 0) return;
    
    // Determine shift times based on segment
    const { startTime, endTime } = this.getSegmentTimes(segment);
    const breakMinutes = 30; // Default break time
    
    // Calculate shift hours
    const shiftHours = this.calculateHours(startTime, endTime, breakMinutes);
    
    // Get staff for this staff type
    const eligibleStaff = this.getStaffForStaffType(rankedStaff, staffType);
    
    if (eligibleStaff.length === 0) {
      console.log(`No eligible ${staffType} staff found for ${segment} on ${date}`);
      return;
    }
    
    // Determine number of staff to assign (between min and max)
    const staffToAssign = Math.min(maxStaff, Math.max(minStaff, eligibleStaff.length));
    
    console.log(`Assigning ${staffToAssign} ${staffType} staff for ${segment} on ${date}`);
    
    // Find job roles for this staff type
    const jobRolesForStaffType = this.getJobRolesForStaffType(staffType);
    
    if (jobRolesForStaffType.length === 0) {
      console.log(`No job roles found for staff type ${staffType}`);
      return;
    }
    
    // Create assignments for each staff
    for (let i = 0; i < staffToAssign; i++) {
      // Find the best available staff member for this shift
      const staffMember = this.findBestStaffForShift(
        eligibleStaff, 
        date, 
        shiftHours, 
        staffWeeklyAllocations,
        true // Consider part shifts for threshold-based assignments
      );
      
      if (!staffMember) {
        console.log(`Could not find available staff for ${staffType} on ${date} (${segment})`);
        break;
      }
      
      // Find the best job role for this staff member
      const bestRole = this.findBestJobRoleForStaff(staffMember, jobRolesForStaffType);
      
      if (!bestRole) {
        console.log(`Could not find appropriate job role for ${staffMember.first_name} ${staffMember.last_name}`);
        continue;
      }
      
      // NEW: Check if we should create a part shift for this staff member
      // Only consider part shifts for hourly or contractor staff
      const canDoPartShift = this.canCreatePartShift(staffMember);
      const shouldCreatePartShift = canDoPartShift && 
        this.enablePartShifts && 
        this.wouldPartShiftHelpCostTarget(dayRevenue, shiftHours, staffMember, date);
      
      // If part shift is appropriate, create a shortened shift
      let actualStartTime = startTime;
      let actualEndTime = endTime;
      let actualShiftHours = shiftHours;
      let isPartShift = false;
      
      if (shouldCreatePartShift) {
        const partShiftDetails = this.createPartShiftTimes(startTime, endTime, breakMinutes, date);
        if (partShiftDetails) {
          actualStartTime = partShiftDetails.startTime;
          actualEndTime = partShiftDetails.endTime;
          actualShiftHours = partShiftDetails.hours;
          isPartShift = true;
          console.log(`Creating part shift for ${staffMember.first_name} ${staffMember.last_name}: ${actualStartTime}-${actualEndTime} (${actualShiftHours} hours)`);
        }
      }
      
      // Calculate costs (pass date for salaried staff tracking)
      const { shiftCost, niCost, pensionCost, totalShiftCost, isSecondShift } = 
        this.calculateCosts(staffMember, actualShiftHours, date);
      
      // Check if this is a secondary role
      const isSecondaryRole = staffMember.job_title !== bestRole.title && 
        Array.isArray(staffMember.secondary_job_roles) && 
        staffMember.secondary_job_roles.includes(bestRole.title);
      
      // Create shift
      const shift = {
        profile_id: staffMember.id,
        date,
        day_of_week: dayOfWeek,
        start_time: actualStartTime,
        end_time: actualEndTime,
        break_minutes: breakMinutes,
        job_role_id: bestRole.id,
        is_secondary_role: isSecondaryRole,
        hi_score: staffMember.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost,
        is_second_shift_of_day: isSecondShift, // Mark if this is a second shift with zero cost
        is_part_shift: isPartShift // NEW: Mark if this is a part shift
      };
      
      // Add the shift
      shifts.push(shift);
      totalCost += totalShiftCost;
      
      console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} to ${bestRole.title} (${actualStartTime}-${actualEndTime}) on ${date} (${segment})`);
      
      // Update weekly allocations for this staff member
      this.updateStaffAllocations(staffMember.id, date, actualShiftHours, shift, staffWeeklyAllocations);
      
      // Remove staff member from eligible staff to prevent assigning them twice in same segment
      const staffIndex = eligibleStaff.findIndex(s => s.id === staffMember.id);
      if (staffIndex !== -1) {
        eligibleStaff.splice(staffIndex, 1);
      }
    }
  }
  
  /**
   * FIXED: Find the best available staff for a shift based on eligibility
   */
  findBestStaffForShift(
    eligibleStaff: any[],
    date: string,
    hours: number,
    staffWeeklyAllocations: Record<string, any>,
    considerPartShift: boolean = false
  ): any {
    if (eligibleStaff.length === 0) {
      return null;
    }
    
    // Create a copy of eligible staff to sort
    const sortedStaff = [...eligibleStaff];
    
    // Sort by employment type and constraints
    sortedStaff.sort((a, b) => {
      // Get weekly allocations
      const allocA = staffWeeklyAllocations[a.id] || { hoursWorked: 0, daysWorked: [] };
      const allocB = staffWeeklyAllocations[b.id] || { hoursWorked: 0, daysWorked: [] };
      
      // Get daily allocations for this date
      const dailyAllocA = this.dailyStaffAllocations[date]?.[a.id] || { hoursWorked: 0, shifts: [] };
      const dailyAllocB = this.dailyStaffAllocations[date]?.[b.id] || { hoursWorked: 0, shifts: [] };
      
      // First, prioritize salaried staff who haven't been scheduled on this day
      // This ensures salaried staff are used efficiently
      if (a.employment_type === 'salaried' && b.employment_type !== 'salaried') {
        // If A is salaried and B is not, prioritize A
        if (dailyAllocA.hoursWorked === 0 && dailyAllocA.shifts.length === 0) {
          return -1; // Prioritize unscheduled salaried staff
        }
      }
      else if (a.employment_type !== 'salaried' && b.employment_type === 'salaried') {
        // If B is salaried and A is not, prioritize B
        if (dailyAllocB.hoursWorked === 0 && dailyAllocB.shifts.length === 0) {
          return 1; // Prioritize unscheduled salaried staff
        }
      }
      
      // If both salaried, prioritize the one who has worked less days this week
      if (a.employment_type === 'salaried' && b.employment_type === 'salaried') {
        return allocA.daysWorked.length - allocB.daysWorked.length;
      }
      
      // Next, check for days already worked and min/max days per week
      const aHasReachedMaxDays = a.max_days_per_week && 
        allocA.daysWorked.length >= a.max_days_per_week;
      
      const bHasReachedMaxDays = b.max_days_per_week && 
        allocB.daysWorked.length >= b.max_days_per_week;
      
      if (aHasReachedMaxDays && !bHasReachedMaxDays) {
        return 1; // B is preferred
      }
      
      if (!aHasReachedMaxDays && bHasReachedMaxDays) {
        return -1; // A is preferred
      }
      
      // If A already has shifts on this day but B doesn't, prioritize B
      if (dailyAllocA.shifts.length > 0 && dailyAllocB.shifts.length === 0) {
        return 1;
      }
      
      // If B already has shifts on this day but A doesn't, prioritize A
      if (dailyAllocA.shifts.length === 0 && dailyAllocB.shifts.length > 0) {
        return -1;
      }
      
      // If we're considering part shifts and hours matter, check who is closest to their target
      if (considerPartShift) {
        const aPercentWorked = a.min_hours_per_week > 0 ? 
          allocA.hoursWorked / a.min_hours_per_week : 0;
        
        const bPercentWorked = b.min_hours_per_week > 0 ? 
          allocB.hoursWorked / b.min_hours_per_week : 0;
          
        // Prioritize staff who are further from their minimum hours
        if (aPercentWorked < bPercentWorked) {
          return -1;
        }
        
        if (aPercentWorked > bPercentWorked) {
          return 1;
        }
      }
      
      // Final tiebreaker: use hi score
      return (b.hi_score || 0) - (a.hi_score || 0);
    });
    
    // Check each staff member to find the best match
    for (const staff of sortedStaff) {
      // Get allocation
      const allocation = staffWeeklyAllocations[staff.id] || { hoursWorked: 0, daysWorked: [] };
      
      // Check weekly constraints
      const maxHoursPerWeek = staff.max_hours_per_week || 40;
      if (allocation.hoursWorked + hours > maxHoursPerWeek) {
        console.log(`${staff.first_name} ${staff.last_name} would exceed max weekly hours (${maxHoursPerWeek})`);
        continue;
      }
      
      // Check if already at max days per week
      const maxDaysPerWeek = staff.max_days_per_week || 5;
      if (allocation.daysWorked.length >= maxDaysPerWeek && 
          !allocation.daysWorked.includes(date)) {
        console.log(`${staff.first_name} ${staff.last_name} would exceed max days per week (${maxDaysPerWeek})`);
        continue;
      }
      
      // Check daily constraints
      const dailyAllocation = this.dailyStaffAllocations[date]?.[staff.id] || { hoursWorked: 0, shifts: [] };
      const maxHoursPerDay = staff.max_hours_per_day || 12;
      if (dailyAllocation.hoursWorked + hours > maxHoursPerDay) {
        console.log(`${staff.first_name} ${staff.last_name} would exceed max daily hours (${maxHoursPerDay})`);
        continue;
      }
      
      console.log(`Selected ${staff.first_name} ${staff.last_name} for shift on ${date}`);
      return staff;
    }
    
    console.log(`Could not find suitable staff for shift on ${date}`);
    return null;
  }

  /**
   * FIXED: Update staff allocations to track time worked per day and week
   */
  updateStaffAllocations(
    staffId: string,
    date: string,
    hours: number,
    shift: any,
    weeklyAllocations: Record<string, any>
  ): void {
    // Update weekly allocations
    if (!weeklyAllocations[staffId]) {
      weeklyAllocations[staffId] = {
        hoursWorked: 0,
        daysWorked: [],
        shifts: []
      };
    }
    
    // Add hours
    weeklyAllocations[staffId].hoursWorked += hours;
    
    // Add day if not already included
    if (!weeklyAllocations[staffId].daysWorked.includes(date)) {
      weeklyAllocations[staffId].daysWorked.push(date);
    }
    
    // Add shift
    weeklyAllocations[staffId].shifts.push(shift);
    
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
    
    // Add hours and shift to daily allocation
    this.dailyStaffAllocations[date][staffId].hoursWorked += hours;
    this.dailyStaffAllocations[date][staffId].shifts.push(shift);
  }

  /**
   * Calculate hours for a shift
   */
  calculateHours(startTime: string, endTime: string, breakMinutes: number): number {
    // Parse start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    
    // Parse end time
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Calculate start and end in decimal hours
    const startDecimal = startHours + startMinutes / 60;
    const endDecimal = endHours + endMinutes / 60;
    
    // Calculate total hours, including break
    let totalHours = endDecimal - startDecimal;
    
    // Subtract break time (convert to hours)
    totalHours -= breakMinutes / 60;
    
    // Ensure non-negative result
    return Math.max(totalHours, 0);
  }

  /**
   * Calculate costs for a shift
   */
  calculateCosts(staffMember: any, hours: number, date: string): {
    shiftCost: number;
    niCost: number;
    pensionCost: number;
    totalShiftCost: number;
    isSecondShift: boolean;
  } {
    // Track if this is a second shift of the day (for salaried staff)
    let isSecondShift = false;
    
    // Default values
    let shiftCost = 0;
    const niRate = 0.138; // Employer's NI rate
    const pensionRate = 0.03; // Employer's pension contribution
    
    if (staffMember.employment_type === 'hourly') {
      // Hourly staff - simple hourly rate
      shiftCost = (staffMember.wage_rate || 0) * hours;
    }
    else if (staffMember.employment_type === 'contractor') {
      // Contractor - use contractor rate
      shiftCost = (staffMember.contractor_rate || 0) * hours;
    }
    else if (staffMember.employment_type === 'salaried') {
      // For salaried staff, we only count their salary once per day
      // Check if we've already applied salary for this day
      if (this.dailyStaffAllocations[date]?.[staffMember.id]?.salaryApplied) {
        // Already charged salary for this day, this shift is "free"
        shiftCost = 0;
        isSecondShift = true;
        console.log(`${staffMember.first_name} ${staffMember.last_name} is salaried and already counted for ${date}`);
      }
      else {
        // First shift of the day for this salaried staff
        // Calculate daily rate from annual salary (assuming 5 days per week, 52 weeks)
        const annualSalary = staffMember.annual_salary || 0;
        const dailyRate = annualSalary / (5 * 52);
        
        shiftCost = dailyRate;
        
        // Mark salary as applied for this day
        if (this.dailyStaffAllocations[date]?.[staffMember.id]) {
          this.dailyStaffAllocations[date][staffMember.id].salaryApplied = true;
        }
      }
    }
    
    // Calculate employer costs (NI and pension)
    // Only apply to non-second shifts
    const niCost = isSecondShift ? 0 : shiftCost * niRate;
    const pensionCost = isSecondShift ? 0 : shiftCost * pensionRate;
    
    // Calculate total cost
    const totalShiftCost = shiftCost + niCost + pensionCost;
    
    return {
      shiftCost,
      niCost,
      pensionCost,
      totalShiftCost,
      isSecondShift
    };
  }

  /**
   * Check if a job title is a kitchen role
   */
  isKitchenRole(jobTitle: string): boolean {
    if (!jobTitle) return false;
    const title = jobTitle.toLowerCase();
    
    return title.includes('chef') || 
           title.includes('cook') || 
           title.includes('kitchen') ||
           title === 'kp';
  }
  
  /**
   * Check if a job title is a kitchen porter role
   */
  isKitchenPorterRole(jobTitle: string): boolean {
    if (!jobTitle) return false;
    const title = jobTitle.toLowerCase();
    
    return title === 'kp' || 
           title.includes('kitchen porter') || 
           title.includes('kitchen assistant') ||
           title.includes('kitchen hand');
  }

  /**
   * Find the best job role for a staff member
   */
  findBestJobRoleForStaff(staff: any, jobRoles: any[]): any {
    // First look for a perfect match with primary job title
    const primaryRoleMatch = jobRoles.find(role => role.title === staff.job_title);
    if (primaryRoleMatch) {
      console.log(`Found primary role match for ${staff.first_name}: ${primaryRoleMatch.title}`);
      return primaryRoleMatch;
    }
    
    // Then check for secondary roles
    if (Array.isArray(staff.secondary_job_roles) && staff.secondary_job_roles.length > 0) {
      for (const secondaryRole of staff.secondary_job_roles) {
        const roleMatch = jobRoles.find(role => role.title === secondaryRole);
        if (roleMatch) {
          console.log(`Found secondary role match for ${staff.first_name}: ${roleMatch.title}`);
          return roleMatch;
        }
      }
    }
    
    // If no direct match, find compatible roles
    if (this.isKitchenPorterRole(staff.job_title)) {
      // KP can only do KP roles
      const kpRole = jobRoles.find(role => this.isKitchenPorterRole(role.title));
      if (kpRole) return kpRole;
    }
    else if (this.isKitchenRole(staff.job_title)) {
      // Kitchen staff can do kitchen roles
      const kitchenRole = jobRoles.find(role => this.isKitchenRole(role.title) && !this.isKitchenPorterRole(role.title));
      if (kitchenRole) return kitchenRole;
    }
    else {
      // FOH staff can do FOH roles
      const fohRole = jobRoles.find(role => !this.isKitchenRole(role.title) && !this.isKitchenPorterRole(role.title));
      if (fohRole) return fohRole;
    }
    
    // If still no match, just return the first role
    console.log(`No suitable role found for ${staff.first_name}`);
    return jobRoles.length > 0 ? jobRoles[0] : null;
  }

  /**
   * Get appropriate staff for a particular staff type
   */
  getStaffForStaffType(staff: any[], staffType: string): any[] {
    if (staffType === 'foh') {
      // FOH staff = not kitchen and not KP
      return staff.filter(s => !this.isKitchenRole(s.job_title));
    }
    else if (staffType === 'kitchen') {
      // Kitchen staff = kitchen but not KP
      return staff.filter(s => 
        this.isKitchenRole(s.job_title) && !this.isKitchenPorterRole(s.job_title)
      );
    }
    else if (staffType === 'kp') {
      // KP staff = KP roles only
      return staff.filter(s => this.isKitchenPorterRole(s.job_title));
    }
    
    return [];
  }

  /**
   * Get job roles appropriate for a staff type
   */
  getJobRolesForStaffType(staffType: string): any[] {
    if (staffType === 'foh') {
      // FOH roles = roles with is_kitchen = false
      return this.jobRoles.filter(role => !role.is_kitchen);
    }
    else if (staffType === 'kitchen') {
      // Kitchen roles = roles with is_kitchen = true and not KP
      return this.jobRoles.filter(role => 
        role.is_kitchen && !this.isKitchenPorterRole(role.title)
      );
    }
    else if (staffType === 'kp') {
      // KP roles = roles with KP in title
      return this.jobRoles.filter(role => this.isKitchenPorterRole(role.title));
    }
    
    return [];
  }
  
  /**
   * Get segment times based on the segment name
   */
  getSegmentTimes(segment: string): { startTime: string; endTime: string } {
    if (segment === 'weekday-day') {
      return {
        startTime: '09:00:00',
        endTime: '17:00:00'
      };
    }
    else if (segment === 'weekday-evening') {
      return {
        startTime: '17:00:00',
        endTime: '23:00:00'
      };
    }
    else if (segment === 'weekend-day') {
      return {
        startTime: '10:00:00',
        endTime: '17:00:00'
      };
    }
    else if (segment === 'weekend-evening') {
      return {
        startTime: '17:00:00',
        endTime: '23:00:00'
      };
    }
    
    // Default
    return {
      startTime: '09:00:00',
      endTime: '17:00:00'
    };
  }
}
