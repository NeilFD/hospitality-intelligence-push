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
      const dayRevenue = parseFloat(revenueForecast[date] || '0');
      totalRevenue += dayRevenue;
      
      console.log(`Processing ${dayOfWeek} (${date}) with revenue ${dayRevenue}`);
      
      if (dayRevenue <= 0) {
        console.log(`Skipping ${date} - no revenue forecast`);
        continue; // Skip days with no revenue forecast
      }
      
      // Get all shift rules for this day
      const dayShiftRules = this.getShiftRulesForDay(dayCode);
      
      if (dayShiftRules.length > 0) {
        console.log(`Using ${dayShiftRules.length} shift rules for ${dayOfWeek}`);
        
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
    
    // If no shifts were assigned, provide diagnostic info
    if (shifts.length === 0) {
      console.error("No shifts were created during scheduling");
      console.log("Staff details:", rankedStaff.map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        jobTitle: s.job_title,
        secondaryRoles: s.secondary_job_roles,
        wageRate: s.wage_rate,
        available: s.available_for_rota
      })));
      console.log("Job roles:", this.jobRoles);
      
      // Create at least one default shift to prevent empty schedules
      if (rankedStaff.length > 0 && this.jobRoles.length > 0) {
        const firstStaff = rankedStaff[0];
        const firstRole = this.jobRoles[0];
        const firstDate = dates[0];
        
        console.log(`Creating emergency default shift for ${firstStaff.first_name} ${firstStaff.last_name}`);
        
        const defaultShift = {
          profile_id: firstStaff.id,
          date: firstDate,
          day_of_week: format(new Date(firstDate), 'EEEE').toLowerCase(),
          start_time: '10:00:00',
          end_time: '18:00:00',
          break_minutes: 30,
          job_role_id: firstRole.id,
          is_secondary_role: false,
          hi_score: firstStaff.hi_score || 0,
          shift_cost: (firstStaff.wage_rate || 10.50) * 7.5, // 8 hours with 30 min break
          employer_ni_cost: 0,
          employer_pension_cost: 0,
          total_cost: (firstStaff.wage_rate || 10.50) * 7.5
        };
        
        shifts.push(defaultShift);
        totalCost += defaultShift.total_cost;
      }
    } else {
      console.log(`Successfully created ${shifts.length} shifts`);
    }
    
    return {
      shifts,
      total_cost: totalCost,
      revenue_forecast: totalRevenue,
      cost_percentage: costPercentage
    };
  };

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
    return this.shiftRules.filter(rule => 
      rule.day_of_week === dayCode && 
      rule.archived !== true
    );
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
    const jobRoleTitle = jobRole?.title || 'Unknown Role';
    
    console.log(`Processing shift rule: ${rule.name || 'Unnamed'} for ${jobRoleTitle}`);
    
    // Filter staff by the job role required for this shift
    let eligibleStaff = rankedStaff.filter(staff => {
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

    // If no staff match the exact job role or secondary roles, log this but don't try to find "compatible" staff
    // This change ensures we only assign staff to roles they are explicitly qualified for
    if (eligibleStaff.length === 0) {
      console.log(`No eligible staff found for ${jobRoleTitle} - no staff have this as primary or secondary role`);
      return; // Exit early - don't try to assign staff who don't have the required role
    } else {
      console.log(`Found ${eligibleStaff.length} eligible staff for ${jobRoleTitle}`);
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
      
      // We could use this information for more sophisticated scheduling
      // For example, we might want to schedule less skilled staff during trough periods
      // or adjust break times to coincide with troughs
    }
    
    // Determine how many staff to assign (between min and max)
    // For this version, we stick with min_staff as the base requirement
    const staffToAssign = rule.min_staff || 1;
    
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
      
      // Create the shift
      const shift = {
        profile_id: staffMember.id,
        date,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMinutes,
        job_role_id: rule.job_role_id,
        is_secondary_role: this.isSecondaryRole(staffMember, jobRole),
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
    const minStaffCount = Math.max(1, Math.floor(revenue / 1000));
    
    // Default minimum staff counts based on revenue level
    const defaultMinFOH = Math.min(4, Math.max(1, Math.floor(revenue / 1500)));
    const defaultMinKitchen = Math.min(3, Math.max(1, Math.floor(revenue / 2000)));
    const defaultMinKP = revenue > 3000 ? 1 : 0;
    
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
    
    // Also assign evening staff if revenue is substantial
    if (revenue > 2000) {
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
    // Find the relevant job role ID
    const roleIdentifier = this.findJobRole(staffType);
    if (!roleIdentifier) {
      console.log(`No job role found for ${staffType}, creating default`);
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
      console.log(`No compatible staff found for ${staffType}`);
      return;
    }
    
    console.log(`Assigning ${minStaff}-${maxStaff} ${staffType} staff for ${segment} on ${date}`);
    
    // Assign staff up to the minimum required
    for (let i = 0; i < minStaff; i++) {
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
      
      console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} (${staffMember.job_title}) to ${staffType} shift on ${date}`);
      
      // Update staff allocations
      this.updateStaffAllocations(staffMember.id, date, shiftHours, shift, staffWeeklyAllocations);
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
    
    // Filter out staff who would exceed weekly hour limits
    availableStaff = availableStaff.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return true; // No allocations yet
      
      // Check weekly hours
      const maxHoursPerWeek = staff.max_hours_per_week || 40; // Default 40 if not specified
      return (allocation.hoursWorked + shiftHours) <= maxHoursPerWeek;
    });
    
    // Filter out staff who would exceed consecutive days
    availableStaff = availableStaff.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      if (!allocation) return true; // No allocations yet
      
      // Check consecutive days (simplified approach)
      const maxConsecutiveDays = staff.max_consecutive_days || 6; // Default 6 if not specified
      return allocation.daysWorked.length < maxConsecutiveDays; 
    });
    
    // If no one is available after all constraints, return null
    if (availableStaff.length === 0) {
      return null;
    }
    
    // Sort by hi score (descending) to get best staff first
    availableStaff.sort((a, b) => (b.hi_score || 0) - (a.hi_score || 0));
    
    // Return the best available staff member
    return availableStaff[0];
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
