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
    console.log(`Role mapping entries: ${this.roleMapping.length}`);

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
   * Get staff eligible for a job role based on role mapping priorities
   */
  getEligibleStaffForRole(jobRoleId: string, rankedStaff: any[]) {
    console.log(`Finding eligible staff for job role ID: ${jobRoleId}`);
    
    // Get role mappings for this job role, sorted by priority
    const relevantMappings = this.roleMapping
      .filter(mapping => mapping.job_role_id === jobRoleId)
      .sort((a, b) => a.priority - b.priority);
    
    if (relevantMappings.length === 0) {
      console.log(`No role mappings found for job role ID: ${jobRoleId}`);
      return [];
    }
    
    console.log(`Found ${relevantMappings.length} role mappings for this job role`);
    relevantMappings.forEach((mapping, index) => {
      console.log(`Priority ${mapping.priority}: ${mapping.job_title}`);
    });
    
    // Extract allowed job titles from the mappings
    const allowedJobTitles = relevantMappings.map(mapping => mapping.job_title);
    
    // Find staff with matching job titles (primary roles)
    const eligibleStaff = rankedStaff.filter(staff => 
      allowedJobTitles.includes(staff.job_title)
    );
    
    // Then add staff with matching secondary roles
    const staffWithSecondaryRoles = rankedStaff.filter(staff => {
      // Skip if already included as primary role
      if (eligibleStaff.some(s => s.id === staff.id)) {
        return false;
      }
      
      // Check if any secondary role matches allowed job titles
      if (Array.isArray(staff.secondary_job_roles)) {
        return staff.secondary_job_roles.some(role => 
          allowedJobTitles.includes(role)
        );
      }
      
      return false;
    });
    
    // Combine primary and secondary role matches
    const allEligibleStaff = [...eligibleStaff, ...staffWithSecondaryRoles];
    
    console.log(`Found ${eligibleStaff.length} staff with primary role match and ${staffWithSecondaryRoles.length} with secondary role match`);
    
    // If we found eligible staff, sort them by priority based on the role mapping
    if (allEligibleStaff.length > 0) {
      allEligibleStaff.sort((staffA, staffB) => {
        // Find the priority for each staff member's job title
        const mappingA = relevantMappings.find(m => 
          m.job_title === staffA.job_title || 
          (Array.isArray(staffA.secondary_job_roles) && staffA.secondary_job_roles.includes(m.job_title))
        );
        
        const mappingB = relevantMappings.find(m => 
          m.job_title === staffB.job_title || 
          (Array.isArray(staffB.secondary_job_roles) && staffB.secondary_job_roles.includes(m.job_title))
        );
        
        // Get priorities (default to high number if not found)
        const priorityA = mappingA ? mappingA.priority : 999;
        const priorityB = mappingB ? mappingB.priority : 999;
        
        // First sort by priority
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority, sort by hi score
        return (staffB.hi_score || 0) - (staffA.hi_score || 0);
      });
      
      // Log the sorted staff
      console.log('Sorted eligible staff by priority and hi score:');
      allEligibleStaff.forEach((staff, index) => {
        const mapping = relevantMappings.find(m => 
          m.job_title === staff.job_title ||
          (Array.isArray(staff.secondary_job_roles) && staff.secondary_job_roles.includes(m.job_title))
        );
        console.log(`${index + 1}. ${staff.first_name} ${staff.last_name}, Title: ${staff.job_title}, Priority: ${mapping ? mapping.priority : 'unknown'}, HiScore: ${staff.hi_score || 0}`);
      });
    }
    
    return allEligibleStaff;
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
    const jobRoleTitle = jobRole?.title || 'Unknown Role';
    const jobRoleId = rule.job_role_id;
    
    console.log(`Processing shift rule: ${rule.name || 'Unnamed'} for ${jobRoleTitle} (ID: ${jobRoleId})`);
    
    // Use the Role Mapping Matrix to find eligible staff
    let eligibleStaff = this.getEligibleStaffForRole(jobRoleId, rankedStaff);

    // If no eligible staff was found through the role mapping, use fallback methods
    if (eligibleStaff.length === 0) {
      console.log(`No eligible staff found through role mapping for ${jobRoleTitle} - trying fallback logic`);
      
      // Filter staff by the job role required for this shift (old method as fallback)
      eligibleStaff = rankedStaff.filter(staff => {
        // Check primary role - exact match on job title
        if (staff.job_title === jobRoleTitle) {
          return true;
        }
        
        // Check secondary roles - must be explicitly included in the secondary_job_roles array
        if (Array.isArray(staff.secondary_job_roles) && 
            staff.secondary_job_roles.includes(jobRoleTitle)) {
          return true;
        }
        
        return false;
      });

      // If no staff match the exact job role or secondary roles, try to find compatible staff
      if (eligibleStaff.length === 0) {
        console.log(`No eligible staff found for ${jobRoleTitle} with fallback - trying to find compatible staff`);
        
        // Look for staff with roles that might be compatible
        if (jobRoleTitle.toLowerCase().includes('server') || 
            jobRoleTitle.toLowerCase().includes('waiter') ||
            jobRoleTitle.toLowerCase().includes('waitress') ||
            jobRoleTitle.toLowerCase().includes('host')) {
          // FOH roles might be compatible with each other
          eligibleStaff = rankedStaff.filter(staff => 
            staff.job_title?.toLowerCase().includes('server') ||
            staff.job_title?.toLowerCase().includes('waiter') ||
            staff.job_title?.toLowerCase().includes('waitress') ||
            staff.job_title?.toLowerCase().includes('host') ||
            staff.job_title?.toLowerCase().includes('bartender')
          );
        }
        else if (jobRoleTitle.toLowerCase().includes('chef') || 
                 jobRoleTitle.toLowerCase().includes('cook')) {
          // Kitchen roles might be compatible with each other  
          eligibleStaff = rankedStaff.filter(staff => 
            staff.job_title?.toLowerCase().includes('chef') ||
            staff.job_title?.toLowerCase().includes('cook')
          );
        }
        
        if (eligibleStaff.length > 0) {
          console.log(`Found ${eligibleStaff.length} compatible staff members for ${jobRoleTitle}`);
        }
        else {
          console.log(`Could not find any compatible staff for ${jobRoleTitle}, using any available staff`);
          // As a last resort, just use any staff
          eligibleStaff = rankedStaff;
        }
      } else {
        console.log(`Found ${eligibleStaff.length} eligible staff using fallback approach for ${jobRoleTitle}`);
      }
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
      
      // Check if this is a secondary role for the staff member
      const isSecondaryRole = this.isSecondaryRole(staffMember, jobRole);
      
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
      console.log(`Job title: ${staffMember.job_title}, Is secondary role: ${isSecondaryRole}`);
      
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
        staffWeeklyAllocations
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
      
      // Calculate costs
      const { shiftCost, niCost, pensionCost, totalShiftCost } = 
        this.calculateCosts(staffMember, shiftHours);
      
      // Check if this is a secondary role
      const isSecondaryRole = staffMember.job_title !== bestRole.title && 
        Array.isArray(staffMember.secondary_job_roles) && 
        staffMember.secondary_job_roles.includes(bestRole.title);
      
      // Create shift
      const shift = {
        profile_id: staffMember.id,
        date,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMinutes,
        job_role_id: bestRole.id,
        is_secondary_role: isSecondaryRole,
        hi_score: staffMember.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost
      };
      
      // Add the shift
      shifts.push(shift);
      totalCost += totalShiftCost;
      
      console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} to ${bestRole.title} (${startTime}-${endTime}) on ${date} (${segment})`);
      
      // Update weekly allocations for this staff member
      this.updateStaffAllocations(staffMember.id, date, shiftHours, shift, staffWeeklyAllocations);
      
      // Remove staff member from eligible staff to prevent assigning them twice in same segment
      const staffIndex = eligibleStaff.findIndex(s => s.id === staffMember.id);
      if (staffIndex !== -1) {
        eligibleStaff.splice(staffIndex, 1);
      }
    }
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
    // Initialize if not already done
    if (!staffWeeklyAllocations[staffId]) {
      staffWeeklyAllocations[staffId] = {
        hoursWorked: 0,
        daysWorked: [],
        shifts: []
      };
    }
    
    // Update hours worked
    staffWeeklyAllocations[staffId].hoursWorked += hours;
    
    // Add day to days worked if not already present
    if (!staffWeeklyAllocations[staffId].daysWorked.includes(date)) {
      staffWeeklyAllocations[staffId].daysWorked.push(date);
    }
    
    // Add shift to shifts
    staffWeeklyAllocations[staffId].shifts.push(shift);
  }
  
  /**
   * Find the best staff member for a shift
   */
  findBestStaffForShift(
    eligibleStaff: any[],
    date: string,
    hours: number,
    staffWeeklyAllocations: Record<string, any>
  ) {
    // Filter staff who are available on this day and haven't exceeded weekly hours
    const availableStaff = eligibleStaff.filter(staff => {
      // Skip if staff doesn't exist or not available
      if (!staff || staff.available_for_rota === false) return false;
      
      // Get current allocations
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return true; // No allocations yet, so available
      
      // Check if already working on this day
      if (allocation.daysWorked.includes(date)) {
        return false; // Already assigned to this day
      }
      
      // Check if adding this shift would exceed weekly hours
      const maxHoursPerWeek = staff.max_hours_per_week || 40;
      if (allocation.hoursWorked + hours > maxHoursPerWeek) {
        return false; // Would exceed max weekly hours
      }
      
      // Check if this would exceed max consecutive days
      const maxDaysPerWeek = staff.max_days_per_week || 5;
      if (allocation.daysWorked.length >= maxDaysPerWeek) {
        return false; // Would exceed max days per week
      }
      
      return true;
    });
    
    // If no available staff, return null
    if (availableStaff.length === 0) {
      return null;
    }
    
    // Return the staff with highest hi_score
    return availableStaff[0];
  }

  /**
   * Get staff filtered by staff type (foh, kitchen, kp)
   */
  getStaffForStaffType(staff: any[], staffType: string) {
    return staff.filter(member => {
      if (staffType === 'foh') {
        // Front of house roles (non-kitchen)
        return !this.isKitchenRole(member.job_title) && !this.isKitchenPorterRole(member.job_title);
      } else if (staffType === 'kitchen') {
        // Kitchen roles (excluding kitchen porters)
        return this.isKitchenRole(member.job_title) && !this.isKitchenPorterRole(member.job_title);
      } else if (staffType === 'kp') {
        // Kitchen porter roles only
        return this.isKitchenPorterRole(member.job_title);
      }
      return false;
    });
  }
  
  /**
   * Check if a job role is a kitchen role
   */
  isKitchenRole(jobTitle: string) {
    if (!jobTitle) return false;
    const title = jobTitle.toLowerCase();
    return title.includes('chef') ||
           title.includes('cook') ||
           title.includes('kitchen');
  }
  
  /**
   * Check if a job role is a kitchen porter role
   */
  isKitchenPorterRole(jobTitle: string) {
    if (!jobTitle) return false;
    const title = jobTitle.toLowerCase();
    return title.includes('kitchen porter') ||
           title.includes('kitchen assistant') ||
           title.includes('kitchen porter') ||
           title.includes('kp');
  }
  
  /**
   * Check if a role is secondary for a staff member
   */
  isSecondaryRole(staffMember: any, jobRole: any) {
    if (!staffMember || !jobRole) return false;
    
    // Primary role matches
    if (staffMember.job_title === jobRole.title) {
      return false;
    }
    
    // Check if it's in secondary roles
    if (Array.isArray(staffMember.secondary_job_roles)) {
      return staffMember.secondary_job_roles.includes(jobRole.title);
    }
    
    return false;
  }

  /**
   * Get job roles for a staff type
   */
  getJobRolesForStaffType(staffType: string) {
    return this.jobRoles.filter(role => {
      if (staffType === 'foh') {
        return !role.is_kitchen;
      } else if (staffType === 'kitchen') {
        return role.is_kitchen && !this.isKitchenPorterRole(role.title);
      } else if (staffType === 'kp') {
        return this.isKitchenPorterRole(role.title);
      }
      return false;
    });
  }
  
  /**
   * Find the best job role for a staff member
   */
  findBestJobRoleForStaff(staffMember: any, jobRoles: any[]) {
    // First try to match primary job title
    const primaryRoleMatch = jobRoles.find(role => role.title === staffMember.job_title);
    if (primaryRoleMatch) {
      return primaryRoleMatch;
    }
    
    // Then try to match secondary job roles
    if (Array.isArray(staffMember.secondary_job_roles)) {
      const secondaryRoleMatch = jobRoles.find(role => 
        staffMember.secondary_job_roles.includes(role.title)
      );
      if (secondaryRoleMatch) {
        return secondaryRoleMatch;
      }
    }
    
    // If no matches, return any compatible role
    if (this.isKitchenRole(staffMember.job_title)) {
      // For kitchen staff, return a kitchen role
      return jobRoles.find(role => role.is_kitchen);
    } else {
      // For FOH staff, return a FOH role
      return jobRoles.find(role => !role.is_kitchen);
    }
  }
  
  /**
   * Get start and end times for a segment
   */
  getSegmentTimes(segment: string) {
    switch (segment) {
      case 'weekday-day':
        return {
          startTime: '10:00:00',
          endTime: '16:30:00'
        };
      case 'weekday-evening':
        return {
          startTime: '16:30:00',
          endTime: '23:00:00'
        };
      case 'weekend-day':
        return {
          startTime: '10:00:00',
          endTime: '16:30:00'
        };
      case 'weekend-evening':
        return {
          startTime: '16:30:00',
          endTime: '23:00:00'
        };
      default:
        return {
          startTime: '10:00:00',
          endTime: '18:00:00'
        };
    }
  }

  /**
   * Calculate hours for a shift
   */
  calculateHours(startTime: string, endTime: string, breakMinutes: number) {
    // Parse times
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    
    // Calculate starting point in minutes
    const startMinutes = startParts[0] * 60 + startParts[1];
    
    // Calculate ending point in minutes
    const endMinutes = endParts[0] * 60 + endParts[1];
    
    // Calculate shift length in minutes
    let shiftMinutes = endMinutes - startMinutes;
    
    // Handle overnight shifts
    if (shiftMinutes < 0) {
      shiftMinutes += 24 * 60; // Add a full day's worth of minutes
    }
    
    // Subtract break time
    shiftMinutes -= breakMinutes || 0;
    
    // Convert to hours
    return shiftMinutes / 60;
  }

  /**
   * Calculate costs for a shift
   */
  calculateCosts(staffMember: any, hours: number) {
    // Get wage rate (default to minimum wage if not set)
    const wageRate = staffMember.wage_rate || 10.50;
    
    // Calculate base shift cost
    const shiftCost = wageRate * hours;
    
    // Calculate employer NI contribution (13.8% above threshold)
    // Simplified calculation - in reality would depend on total earnings
    const niRate = 0.138; // 13.8% 
    const niThreshold = 169; // Weekly threshold
    const weeklyHoursEstimate = 40; // Estimate full time hours
    const weeklyRateEstimate = wageRate * weeklyHoursEstimate;
    
    let niCost = 0;
    if (weeklyRateEstimate > niThreshold) {
      const niableAmount = weeklyRateEstimate - niThreshold;
      const niableRatio = niableAmount / weeklyRateEstimate;
      niCost = shiftCost * niableRatio * niRate;
    }
    
    // Calculate employer pension contribution (3% standard)
    const pensionRate = 0.03; // 3%
    let pensionCost = 0;
    
    // Only calculate pension for employees eligible for auto-enrollment
    // Simplified - would depend on age and earnings in reality
    if (wageRate * hours > 10) { // If shift pays more than £10
      pensionCost = shiftCost * pensionRate;
    }
    
    // Calculate total cost
    const totalShiftCost = shiftCost + niCost + pensionCost;
    
    return {
      shiftCost,
      niCost,
      pensionCost,
      totalShiftCost
    };
  }
}
