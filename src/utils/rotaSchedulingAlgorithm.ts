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
  roleMappings: Record<string, any[]> = {}; // Added role mappings property

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
   * Set the role mappings to be used for job role assignments
   */
  setRoleMappings(roleMappings: Record<string, any[]>) {
    this.roleMappings = roleMappings || {};
    console.log(`Role mappings set for ${Object.keys(this.roleMappings).length} job roles`);
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
    
    console.log(`Processing ${dates.length} days for scheduling`);
    console.log(`Staff members available: ${this.staff.length}`);
    console.log(`Job roles available: ${this.jobRoles.length}`);
    console.log(`Shift rules available: ${this.shiftRules.length}`);

    // Log staff details for debugging
    this.staff.forEach(staff => {
      console.log(`Staff: ${staff.first_name} ${staff.last_name}, Role: ${staff.job_title}, Wage: ${staff.wage_rate || 'Not set'}, Available: ${staff.available_for_rota !== false}`);
    });
    
    // Filter available staff and initialize with default wage rate if missing
    const availableStaff = this.staff.filter(member => member.available_for_rota !== false)
      .map(staff => {
        // Ensure wage_rate is set to a default if not defined
        if (!staff.wage_rate && staff.wage_rate !== 0) {
          const jobRole = this.jobRoles.find(role => role.title === staff.job_title);
          staff.wage_rate = jobRole?.default_wage_rate || 10.50; // UK minimum wage fallback
          console.log(`Set default wage rate ${staff.wage_rate} for ${staff.first_name} ${staff.last_name}`);
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
    
    // Sort staff by hi score (descending)
    const rankedStaff = [...availableStaff].sort((a, b) => (b.hi_score || 0) - (a.hi_score || 0));
    
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
    
    const shifts: any[] = [];
    let totalCost = 0;
    let totalRevenue = 0;
    
    // Process each day
    for (const date of dates) {
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
      console.log(`Processing ${dayOfWeek} (${date}) with day code: ${dayCode}`);
      
      const dayRevenue = parseFloat(revenueForecast[date] || '0');
      totalRevenue += dayRevenue;
      
      console.log(`Day revenue for ${dayOfWeek} (${date}): ${dayRevenue}`);
      
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
            totalCost
          });
        }
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
          totalCost
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
          totalCost
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
          totalCost
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
          totalCost
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
          totalCost
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
          totalCost
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
          return (allocation.hoursWorked < maxHoursPerWeek) && 
                 (!allocation.daysWorked.includes(date));
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
    
    // Calculate costs
    const hours = this.calculateHours(startTime, endTime, breakMinutes);
    const { shiftCost, niCost, pensionCost, totalShiftCost } = this.calculateCosts(staffMember, hours);
    
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
      is_emergency_shift: true  // Mark as emergency shift
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
   * Assign staff based on a specific shift rule
   */
  assignShiftRuleStaff({
    date,
    dayOfWeek,
    rule,
    rankedStaff,
    staffWeeklyAllocations,
    shifts,
    totalCost
  }: {
    date: string;
    dayOfWeek: string;
    rule: any;
    rankedStaff: any[];
    staffWeeklyAllocations: Record<string, any>;
    shifts: any[];
    totalCost: number;
  }) {
    // Get the job role info from the rule
    const jobRole = rule.job_roles;
    const roleId = jobRole?.id;
    const jobRoleTitle = jobRole?.title || 'Unknown Role';
    
    console.log(`Processing shift rule: ${rule.name || 'Unnamed'} for ${jobRoleTitle} (role ID: ${roleId})`);
    
    if (!roleId) {
      console.log(`Error: Cannot find role ID for role ${jobRoleTitle}`);
      return;
    }
    
    // Get the list of allowed job titles for this role from the role mapping matrix
    const allowedJobTitles = this.getAllowedJobTitlesForRole(roleId);
    
    // If no allowed job titles found, log a warning and skip this rule
    if (allowedJobTitles.length === 0) {
      console.log(`Warning: No allowed job titles for ${jobRoleTitle}, cannot assign staff`);
      return;
    }
    
    // Filter staff by the allowed job titles for this role
    let eligibleStaff = rankedStaff.filter(staff => {
      // Check primary role - must be in the allowed job titles list
      const primaryMatch = staff.job_title && allowedJobTitles.includes(staff.job_title);
      
      // Check secondary roles - must be in the allowed job titles list
      let secondaryMatch = false;
      if (Array.isArray(staff.secondary_job_roles)) {
        secondaryMatch = staff.secondary_job_roles.some((jobTitle: string) => 
          allowedJobTitles.includes(jobTitle));
      }
      
      return primaryMatch || secondaryMatch;
    });

    // If no eligible staff found, log error but DO NOT use any available staff
    if (eligibleStaff.length === 0) {
      console.log(`No eligible staff found for ${jobRoleTitle} based on role mapping matrix. Cannot assign this shift.`);
      return; // Exit without assigning anyone to this shift
    } else {
      console.log(`Found ${eligibleStaff.length} eligible staff for ${jobRoleTitle} based on role mapping matrix`);
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
        staffWeeklyAllocations
      );
      
      if (!staffMember) {
        console.log(`Could not find available staff for ${rule.name || jobRoleTitle} on ${date}`);
        break; // No eligible staff available
      }
      
      // Calculate costs for this staff member
      const { shiftCost, niCost, pensionCost, totalShiftCost } = 
        this.calculateCosts(staffMember, shiftHours);
      
      // Determine if this is a secondary role for the staff member
      const isSecondaryRole = this.isSecondaryRoleForStaff(staffMember, allowedJobTitles);
      
      // Create the shift
      const shift = {
        profile_id: staffMember.id,
        date,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMinutes,
        job_role_id: rule.job_role_id,
        is_secondary_role: isSecondaryRole,
        hi_score: staffMember.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost,
        shift_rule_id: rule.id,
        shift_rule_name: rule.name || jobRoleTitle
      };
      
      // Add the shift
      shifts.push(shift);
      totalCost += totalShiftCost;
      
      console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} to ${rule.name || jobRoleTitle} (${startTime}-${endTime}) on ${date}`);
      
      // Update staff allocations
      this.updateStaffAllocations(staffMember.id, date, shiftHours, shift, staffWeeklyAllocations);
      
      // Remove this staff member from eligible staff to prevent assigning again for this rule
      eligibleStaff = eligibleStaff.filter(staff => staff.id !== staffMember.id);
      
      if (eligibleStaff.length === 0) {
        console.log(`No more eligible staff available for ${rule.name || jobRoleTitle}`);
        break;
      }
    }
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
      totalCost
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
      totalCost
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
        totalCost
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
        totalCost
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
        totalCost
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
          totalCost
        });
      }
    }
  }
  
  /**
   * Assign staff based on a role type
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
    totalCost
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
  }) {
    // Skip assignment if minStaff is 0
    if (minStaff <= 0) {
      console.log(`Skipping ${staffType} staff assignment for ${segment} on ${date} (minStaff=${minStaff})`);
      return;
    }
    
    // Find the relevant job role ID
    const roleIdentifier = this.findJobRole(staffType);
    if (!roleIdentifier) {
      console.log(`No job role found for ${staffType}, skipping assignment`);
      return;
    }
    
    // Get default shift times based on segment
    const { startTime, endTime, breakMinutes } = this.getSegmentTimes(segment);
    
    // Calculate shift hours
    const shiftHours = this.calculateHours(startTime, endTime, breakMinutes);
    
    // Filter staff by role
    let staffForRole = rankedStaff.filter(staff => {
      // Check if primary role matches
      const primaryMatch = staff.job_title && staff.job_title.toLowerCase().includes(staffType);
      
      // Check if a secondary role matches
      let secondaryMatch = false;
      if (Array.isArray(staff.secondary_job_roles)) {
        secondaryMatch = staff.secondary_job_roles.some((role: string) => 
          role.toLowerCase().includes(staffType));
      }
      
      return primaryMatch || secondaryMatch;
    });
    
    // If no exact matches, use role type to find compatible staff
    if (staffForRole.length === 0) {
      console.log(`No exact staff matches for ${staffType}, looking for compatible roles`);
      
      if (staffType === 'foh') {
        // FOH compatible roles include: server, host, bartender, waiter, waitress
        staffForRole = rankedStaff.filter(staff => 
          staff.job_title?.toLowerCase().includes('server') || 
          staff.job_title?.toLowerCase().includes('host') ||
          staff.job_title?.toLowerCase().includes('bartender') ||
          staff.job_title?.toLowerCase().includes('waiter') ||
          staff.job_title?.toLowerCase().includes('waitress')
        );
      } else if (staffType === 'kitchen') {
        // Kitchen compatible roles include: chef, cook
        staffForRole = rankedStaff.filter(staff => 
          staff.job_title?.toLowerCase().includes('chef') ||
          staff.job_title?.toLowerCase().includes('cook')
        );
      } else if (staffType === 'kp') {
        // KP compatible roles include: porter, kitchen assistant
        staffForRole = rankedStaff.filter(staff => 
          staff.job_title?.toLowerCase().includes('porter') ||
          staff.job_title?.toLowerCase().includes('kitchen assistant')
        );
      }
    }
    
    if (staffForRole.length === 0) {
      console.log(`No compatible staff found for ${staffType}, using any available staff`);
      staffForRole = rankedStaff; // As last resort, use any staff
    }
    
    console.log(`Assigning ${minStaff}-${maxStaff} ${staffType} staff for ${segment} on ${date}, found ${staffForRole.length} eligible staff`);
    
    // Assign staff up to the minimum required
    let assignedCount = 0;
    for (let i = 0; i < minStaff && staffForRole.length > 0; i++) {
      const staffMember = this.findBestStaffForShift(
        staffForRole, 
        date,
        shiftHours,
        staffWeeklyAllocations
      );
      
      if (!staffMember) {
        console.log(`Could not find available ${staffType} staff for position ${i+1}`);
        break;
      }
      
      // Calculate costs for this staff member
      const { shiftCost, niCost, pensionCost, totalShiftCost } = 
        this.calculateCosts(staffMember, shiftHours);
      
      // Create the shift
      const shift = {
        profile_id: staffMember.id,
        date,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMinutes,
        job_role_id: roleIdentifier.id,
        is_secondary_role: !this.isPrimaryRole(staffMember, staffType),
        hi_score: staffMember.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost
      };
      
      // Add the shift
      shifts.push(shift);
      totalCost += totalShiftCost;
      assignedCount++;
      
      console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} (${staffMember.job_title}) to ${staffType} shift on ${date}`);
      
      // Update staff allocations
      this.updateStaffAllocations(staffMember.id, date, shiftHours, shift, staffWeeklyAllocations);
      
      // Remove this staff member from staffForRole
      staffForRole = staffForRole.filter(staff => staff.id !== staffMember.id);
    }
    
    if (assignedCount < minStaff) {
      console.log(`Warning: Could only assign ${assignedCount} of ${minStaff} required ${staffType} staff for ${date}`);
    }
  }
  
  /**
   * Find the job role ID for a given role type
   */
  findJobRole(staffType: string) {
    // Normalize staffType to lowercase
    const normalizedType = staffType.toLowerCase();
    
    let roleIdentifier = null;
    
    // Try direct role matching based on role type
    if (normalizedType === 'foh') {
      roleIdentifier = this.jobRoles.find(role => 
        role.title?.toLowerCase().includes('server') ||
        role.title?.toLowerCase().includes('waiter') ||
        role.title?.toLowerCase().includes('host')
      );
    }
    else if (normalizedType === 'kitchen') {
      roleIdentifier = this.jobRoles.find(role => 
        role.title?.toLowerCase().includes('chef') ||
        role.title?.toLowerCase().includes('cook')  
      );
    }
    else if (normalizedType === 'kp') {
      roleIdentifier = this.jobRoles.find(role => 
        role.title?.toLowerCase().includes('porter') ||
        role.title?.toLowerCase().includes('kitchen assistant')
      );
    }
    
    // If no exact match, try to find the closest match by title
    if (!roleIdentifier) {
      roleIdentifier = this.jobRoles.find(role => 
        role.title?.toLowerCase().includes(normalizedType)
      );
    }
    
    // If still no match, use the first role that matches is_kitchen for kitchen/kp roles
    if (!roleIdentifier) {
      if (normalizedType === 'kitchen' || normalizedType === 'kp') {
        roleIdentifier = this.jobRoles.find(role => role.is_kitchen === true);
      } else {
        roleIdentifier = this.jobRoles.find(role => role.is_kitchen === false);
      }
    }
    
    // Last resort: just use any role
    if (!roleIdentifier && this.jobRoles.length > 0) {
      roleIdentifier = this.jobRoles[0];
    }
    
    return roleIdentifier;
  }
  
  /**
   * Check if a staff member's primary role matches the role type
   */
  isPrimaryRole(staff: any, roleType: string) {
    if (!staff.job_title) return false;
    
    const jobTitle = staff.job_title.toLowerCase();
    const roleTypeLower = roleType.toLowerCase();
    
    if (roleTypeLower === 'foh') {
      return jobTitle.includes('server') || 
             jobTitle.includes('host') || 
             jobTitle.includes('bartender') ||
             jobTitle.includes('waiter') ||
             jobTitle.includes('waitress');
    }
    
    if (roleTypeLower === 'kitchen') {
      return jobTitle.includes('chef') || 
             jobTitle.includes('cook');
    }
    
    if (roleTypeLower === 'kp') {
      return jobTitle.includes('porter') || 
             jobTitle.includes('kitchen assistant');
    }
    
    return jobTitle.includes(roleTypeLower);
  }
  
  /**
   * Check if a role is secondary for a staff member
   */
  isSecondaryRole(staff: any, jobRole: any) {
    // If job titles match exactly, it's a primary role
    if (staff.job_title === jobRole?.title) {
      return false;
    }
    
    // If staff has this role in secondary_job_roles array, it's a secondary role
    if (Array.isArray(staff.secondary_job_roles) && 
        jobRole?.title && 
        staff.secondary_job_roles.includes(jobRole.title)) {
      return true;
    }
    
    // Default: if job title doesn't match and it's not in secondary roles, consider secondary
    // This is a fallback for when we're assigning staff to roles they're not explicitly qualified for
    return staff.job_title !== jobRole?.title;
  }
  
  /**
   * Check if a role is a secondary role for a staff member
   * based on the allowed job titles list
   */
  isSecondaryRoleForStaff(staff: any, allowedJobTitles: string[]): boolean {
    // If staff's primary job title is in the allowed list, it's not a secondary role
    if (staff.job_title && allowedJobTitles.includes(staff.job_title)) {
      return false;
    }
    
    // If staff's secondary job titles include one from the allowed list, it's a secondary role
    if (Array.isArray(staff.secondary_job_roles)) {
      const hasAllowedSecondary = staff.secondary_job_roles.some((jobTitle: string) => 
        allowedJobTitles.includes(jobTitle));
      if (hasAllowedSecondary) {
        return true;
      }
    }
    
    // This should not happen since we've already filtered staff based on allowed job titles,
    // but we'll return true as a fallback (treating it as a secondary role)
    return true;
  }
  
  /**
   * Update staff allocations to track hours worked and shifts
   */
  updateStaffAllocations(
    staffId: string, 
    date: string, 
    hoursWorked: number, 
    shift: any,
    staffWeeklyAllocations: Record<string, any>
  ) {
    if (!staffWeeklyAllocations[staffId]) {
      staffWeeklyAllocations[staffId] = {
        hoursWorked: 0,
        daysWorked: [],
        shifts: []
      };
    }
    
    staffWeeklyAllocations[staffId].hoursWorked += hoursWorked;
    
    if (!staffWeeklyAllocations[staffId].daysWorked.includes(date)) {
      staffWeeklyAllocations[staffId].daysWorked.push(date);
    }
    
    staffWeeklyAllocations[staffId].shifts.push(shift);
  }
  
  /**
   * Find the best staff member for a shift based on availability and hi score
   */
  findBestStaffForShift(
    eligibleStaff: any[], 
    date: string,
    shiftHours: number,
    staffWeeklyAllocations: Record<string, any>
  ) {
    // If no eligible staff, return null immediately
    if (!eligibleStaff || eligibleStaff.length === 0) {
      console.log("No eligible staff provided to findBestStaffForShift");
      return null;
    }
    
    // Start with all eligible staff
    let availableStaff = [...eligibleStaff];
    
    // Filter out staff who are already working this day
    availableStaff = availableStaff.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return true; // No allocations yet
      
      // Check if already working this day
      return !allocation.daysWorked.includes(date);
    });
    
    // If no one is available without working twice in one day, 
    // try to find someone who won't exceed daily hour limits
    if (availableStaff.length === 0) {
      console.log("No staff available without working twice in one day, checking hour limits");
      availableStaff = eligibleStaff.filter(staff => {
        const allocation = staffWeeklyAllocations[staff.id];
        if (!allocation) return true; // No allocations yet
        
        // Check if adding this shift would exceed max daily hours
        // But only check for current day shifts
        if (allocation.daysWorked.includes(date)) {
          // Calculate hours already worked this day
          const dayShifts = allocation.shifts.filter((s: any) => s.date === date);
          const dayHours = dayShifts.reduce((total: number, shift: any) => {
            return total + this.calculateHours(shift.start_time, shift.end_time, shift.break_minutes);
          }, 0);
          
          // Check if adding this shift would exceed max hours
          const maxHoursPerDay = staff.max_hours_per_day || 12; // Default 12 if not specified
          return (dayHours + shiftHours) <= maxHoursPerDay;
        }
        
        return true; // Not working this day yet
      });
    }
    
    // Still no available staff? Try relaxing constraints for weekly hours
    if (availableStaff.length === 0) {
      console.log("Still no staff available, relaxing weekly hour constraints");
      return null; // No staff available after all attempts
    }
    
    // Filter out staff who would exceed weekly hour limits
    const staffWithinHourLimits = availableStaff.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return true; // No allocations yet
      
      // Check weekly hours
      const maxHoursPerWeek = staff.max_hours_per_week || 40; // Default 40 if not specified
      return (allocation.hoursWorked + shiftHours) <= maxHoursPerWeek;
    });
    
    // If we have staff within hour limits, use them, otherwise use any available staff
    const finalCandidates = staffWithinHourLimits.length > 0 ? staffWithinHourLimits : availableStaff;
    
    // Filter out staff who would exceed consecutive days
    const staffWithinDayLimits = finalCandidates.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return true; // No allocations yet
      
      // Check consecutive days (simplified approach)
      const maxConsecutiveDays = staff.max_consecutive_days || 6; // Default 6 if not specified
      return allocation.daysWorked.length < maxConsecutiveDays; 
    });
    
    // If no one is available after all constraints, return null
    if (staffWithinDayLimits.length === 0) {
      console.log("No staff available after checking all constraints");
      return null;
    }
    
    // Sort by hi score (descending) to get best staff first
    staffWithinDayLimits.sort((a, b) => (b.hi_score || 0) - (a.hi_score || 0));
    
    // Return the best available staff member
    return staffWithinDayLimits[0];
  }
  
  /**
   * Get allowed job titles for a specific job role based on the role mapping matrix
   */
  getAllowedJobTitlesForRole(roleId: string): string[] {
    // Get mappings for this role
    const mappings = this.roleMappings[roleId] || [];
    
    if (mappings.length === 0) {
      console.log(`Warning: No role mappings found for role ID ${roleId}`);
      return [];
    }
    
    // Extract job titles from mappings
    const jobTitles = mappings.map(mapping => mapping.job_title);
    console.log(`Found ${jobTitles.length} allowed job titles for role ID ${roleId}: ${jobTitles.join(', ')}`);
    return jobTitles;
  }
  
  /**
   * Calculate the number of work hours for a shift
   */
  calculateHours(startTime: string, endTime: string, breakMinutes: number = 0) {
    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDecimal = startHour + (startMinute / 60);
    
    // Parse end time
    const [endHour, endMinute] = endTime.split(':').map(Number);
    let endDecimal = endHour + (endMinute / 60);
    
    // Handle overnight shifts (e.g. 22:00 to 02:00)
    if (endDecimal < startDecimal) {
      endDecimal += 24; 
    }
    
    // Calculate hours worked (subtracting break time)
    const totalHours = endDecimal - startDecimal;
    const breakHours = breakMinutes / 60;
    
    return Math.max(0, totalHours - breakHours);
  }
  
  /**
   * Calculate the costs for a shift (basic pay, NI, pension, total)
   */
  calculateCosts(staffMember: any, hours: number) {
    // Get the staff pay rate
    const wageRate = staffMember.wage_rate || 10.50; // Default to minimum wage if not set
    
    // Calculate basic pay
    const shiftCost = wageRate * hours;
    
    // Calculate employer NI (simplified)
    const weeklyThreshold = 175; // Weekly threshold
    const niRate = 0.138; // 13.8%
    
    // Simplified estimate - assume this shift contributes proportionally to weekly pay
    const niCost = Math.max(0, (shiftCost - (weeklyThreshold * hours / 40)) * niRate);
    
    // Calculate pension (simplified)
    const pensionRate = 0.03; // 3% employer contribution
    const pensionCost = shiftCost * pensionRate;
    
    // Total cost
    const totalShiftCost = shiftCost + niCost + pensionCost;
    
    return {
      shiftCost,
      niCost,
      pensionCost,
      totalShiftCost
    };
  }
  
  /**
   * Get default times for different day segments
   */
  getSegmentTimes(segment: string): { startTime: string, endTime: string, breakMinutes: number } {
    switch (segment) {
      case 'weekday-day':
        return {
          startTime: '09:00:00',
          endTime: '17:00:00',
          breakMinutes: 30
        };
      case 'weekday-evening': 
        return {
          startTime: '17:00:00',
          endTime: '23:00:00',
          breakMinutes: 30
        };
      case 'weekend-day':
        return {
          startTime: '10:00:00',
          endTime: '18:00:00',
          breakMinutes: 30
        };
      case 'weekend-evening':
        return {
          startTime: '18:00:00',
          endTime: '00:00:00',
          breakMinutes: 30
        };
      default:
        return {
          startTime: '09:00:00', 
          endTime: '17:00:00',
          breakMinutes: 30
        };
    }
  }
  
  /**
   * Find the appropriate threshold for a given revenue
   */
  findThreshold(revenue: number) {
    // Find a threshold where the revenue is within min/max bounds
    const threshold = this.thresholds.find(t => 
      revenue >= (t.revenue_min || 0) && 
      revenue <= (t.revenue_max || Infinity)
    );
    
    return threshold || null;
  }
}
