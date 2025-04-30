import { format, parseISO } from 'date-fns';

/**
 * This algorithm generates optimal staff schedules based on:
 * 1. Revenue forecasts
 * 2. Staff Hi Scores for skill rankings
 * 3. Labor cost targets
 * 4. UK employment regulations
 * 5. Existing shift rules
 */
export class RotaSchedulingAlgorithm {
  request: any;
  staff: any[];
  jobRoles: any[];
  thresholds: any[];
  location: any;
  shiftRules: any[] = [];

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
      // Check primary role
      if (staff.job_title === jobRoleTitle) return true;
      
      // Check secondary roles if available
      if (Array.isArray(staff.secondary_job_roles) && 
          staff.secondary_job_roles.includes(jobRoleTitle)) {
        return true;
      }
      
      return false;
    });

    // If no staff match the exact job role, try to find staff with compatible roles
    if (eligibleStaff.length === 0) {
      console.log(`No exact role matches for ${jobRoleTitle}, finding compatible staff`);
      
      // Check if the job role is kitchen or front of house
      const isKitchenRole = jobRole?.is_kitchen || false;
      
      // Find staff with compatible roles
      eligibleStaff = rankedStaff.filter(staff => {
        // First try to match based on a matching job role in the jobRoles array
        const staffJobRole = this.jobRoles.find(r => r.title === staff.job_title);
        if (staffJobRole && staffJobRole.is_kitchen === isKitchenRole) return true;
        
        // If staff doesn't have a matching job role, use heuristics
        if (!staffJobRole) {
          // Try to determine role type from job title
          const jobTitleLower = (staff.job_title || '').toLowerCase();
          
          if (isKitchenRole) {
            return jobTitleLower.includes('chef') || 
                   jobTitleLower.includes('cook') || 
                   jobTitleLower.includes('kitchen') ||
                   jobTitleLower.includes('porter');
          } else {
            return jobTitleLower.includes('server') || 
                   jobTitleLower.includes('waiter') || 
                   jobTitleLower.includes('waitress') ||
                   jobTitleLower.includes('host') ||
                   jobTitleLower.includes('bartender') ||
                   !jobTitleLower.includes('chef');  // Default non-kitchen roles to FOH
          }
        }
        
        return false;
      });
    }
    
    // Log the eligible staff for debugging
    if (eligibleStaff.length === 0) {
      console.log(`No eligible staff found for ${jobRoleTitle}`);
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
    
    // Determine how many staff to assign (between min and max)
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
   * Find the appropriate threshold based on revenue
   * Now simplified to only consider revenue bands, not day/segment
   */
  findThreshold(revenue: number) {
    if (!this.thresholds || this.thresholds.length === 0) {
      console.warn("No thresholds available for scheduling");
      return null;
    }
    
    // Sort thresholds by revenue_min to ensure we get the correct band
    const sortedThresholds = [...this.thresholds].sort((a, b) => a.revenue_min - b.revenue_min);
    
    // Find the first threshold where the revenue falls within its range
    const applicableThreshold = sortedThresholds.find(t => 
      revenue >= t.revenue_min && revenue <= t.revenue_max
    );
    
    if (applicableThreshold) {
      console.log(`Found threshold "${applicableThreshold.name || 'Unnamed band'}" for revenue ${revenue}`);
      return applicableThreshold;
    }
    
    // If no exact match, find closest threshold
    if (sortedThresholds.length > 0) {
      if (revenue < sortedThresholds[0].revenue_min) {
        // Revenue is below the minimum threshold, use the lowest
        return sortedThresholds[0];
      } else {
        // Revenue is above the maximum threshold, use the highest
        return sortedThresholds[sortedThresholds.length - 1];
      }
    }
    
    // Return a default if no thresholds are configured
    return null;
  }

  /**
   * Assign staff for a particular date, segment, and role type
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
    staffType: 'foh' | 'kitchen' | 'kp';
    minStaff: number;
    maxStaff: number;
    rankedStaff: any[];
    staffWeeklyAllocations: Record<string, any>;
    shifts: any[];
    totalCost: number;
  }) {
    // Filter staff by job role
    let eligibleStaff = [];
    
    if (staffType === 'foh') {
      // Front of House staff - more flexible matching
      eligibleStaff = rankedStaff.filter(s => {
        const jobTitle = (s.job_title || '').toLowerCase();
        const isKitchenStaff = 
          jobTitle.includes('chef') || 
          jobTitle.includes('kitchen') || 
          jobTitle.includes('porter');
        
        // If they have a job_role in our jobRoles list, check that directly
        const staffJobRole = this.jobRoles.find(r => r.title === s.job_title);
        if (staffJobRole) return !staffJobRole.is_kitchen;
        
        // Otherwise use job title keywords
        return !isKitchenStaff;
      });
    } else if (staffType === 'kitchen') {
      // Kitchen staff (chefs) - more flexible matching
      eligibleStaff = rankedStaff.filter(s => {
        const jobTitle = (s.job_title || '').toLowerCase();
        
        // If they have a job_role in our jobRoles list, check that directly
        const staffJobRole = this.jobRoles.find(r => r.title === s.job_title);
        if (staffJobRole) return staffJobRole.is_kitchen && !jobTitle.includes('porter');
        
        // Otherwise use job title keywords
        return jobTitle.includes('chef') || 
              jobTitle.includes('cook') || 
              (jobTitle.includes('kitchen') && !jobTitle.includes('porter'));
      });
    } else if (staffType === 'kp') {
      // Kitchen porters - more flexible matching
      eligibleStaff = rankedStaff.filter(s => {
        const jobTitle = (s.job_title || '').toLowerCase();
        
        // If they have a job_role in our jobRoles list, check that directly
        const staffJobRole = this.jobRoles.find(r => r.title === s.job_title);
        if (staffJobRole) return staffJobRole.is_kitchen && jobTitle.includes('porter');
        
        // Otherwise use job title keywords
        return jobTitle.includes('porter');
      });
    }
    
    // If no eligible staff for the specific role type, use broader categorization
    if (eligibleStaff.length === 0) {
      console.log(`No eligible staff found for ${staffType} role, using broader matching`);
      
      if (staffType === 'foh') {
        // Try to find any non-kitchen staff
        eligibleStaff = rankedStaff.filter(s => {
          // If they have a job_role in our jobRoles list, check that directly
          const staffJobRole = this.jobRoles.find(r => r.title === s.job_title);
          if (staffJobRole) return !staffJobRole.is_kitchen;
          
          // If we still don't have staff, just get anyone not explicitly kitchen
          const jobTitle = (s.job_title || '').toLowerCase();
          return !jobTitle.includes('chef') && !jobTitle.includes('kitchen') && !jobTitle.includes('porter');
        });
      } else if (staffType === 'kitchen' || staffType === 'kp') {
        // For kitchen/kp roles, try to find any kitchen staff
        eligibleStaff = rankedStaff.filter(s => {
          // If they have a job_role in our jobRoles list, check that directly
          const staffJobRole = this.jobRoles.find(r => r.title === s.job_title);
          if (staffJobRole) return staffJobRole.is_kitchen;
          
          // Otherwise just get anyone with kitchen-related title
          const jobTitle = (s.job_title || '').toLowerCase();
          return jobTitle.includes('chef') || jobTitle.includes('kitchen') || jobTitle.includes('porter');
        });
      }
      
      // If still no eligible staff, just use all staff as a last resort
      if (eligibleStaff.length === 0) {
        console.log(`Still no staff found for ${staffType} role, using all available staff`);
        eligibleStaff = rankedStaff;
      }
    }
    
    console.log(`Found ${eligibleStaff.length} eligible staff for ${staffType} roles`);
    
    // Find the relevant job role ID
    const jobRole = this.findJobRole(staffType);
    if (!jobRole) {
      console.log(`No job role found for ${staffType}, creating default`);
      // Instead of returning, create a default job role
      // This will be used in the shift creation but won't modify the database
      const defaultJobRole = {
        id: `default-${staffType}`,
        title: staffType === 'foh' ? 'Server' : (staffType === 'kitchen' ? 'Chef' : 'Kitchen Porter'),
        is_kitchen: staffType !== 'foh'
      };
      
      // Calculate shift times based on segment
      const { startTime, endTime, breakMinutes } = this.calculateShiftTimes(segment, dayOfWeek);
      
      // Calculate shift hours
      const shiftHours = this.calculateHours(startTime, endTime, breakMinutes);
      
      // Assign staff up to the minimum required
      for (let i = 0; i < minStaff; i++) {
        // Find the best available staff member for this shift
        const staffMember = this.findBestStaffForShift(
          eligibleStaff, 
          date, 
          shiftHours, 
          staffWeeklyAllocations
        );
        
        if (!staffMember) break; // No eligible staff available
        
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
          job_role_id: defaultJobRole.id,
          is_secondary_role: true,
          hi_score: staffMember.hi_score || 0,
          shift_cost: shiftCost,
          employer_ni_cost: niCost,
          employer_pension_cost: pensionCost,
          total_cost: totalShiftCost
        };
        
        // Add the shift
        shifts.push(shift);
        totalCost += totalShiftCost;
        
        console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} to default ${defaultJobRole.title} role (${startTime}-${endTime}) on ${date}`);
        
        // Update staff allocations
        this.updateStaffAllocations(staffMember.id, date, shiftHours, shift, staffWeeklyAllocations);
      }
      
      return;
    }
    
    // Calculate shift times based on segment
    const { startTime, endTime, breakMinutes } = this.calculateShiftTimes(segment, dayOfWeek);
    
    // Calculate shift hours
    const shiftHours = this.calculateHours(startTime, endTime, breakMinutes);
    
    // Assign staff up to the minimum required
    for (let i = 0; i < minStaff; i++) {
      // Find the best available staff member for this shift
      const staffMember = this.findBestStaffForShift(
        eligibleStaff, 
        date, 
        shiftHours, 
        staffWeeklyAllocations
      );
      
      if (!staffMember) {
        console.log(`No more eligible staff available for ${staffType} role on ${date}`);
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
        job_role_id: jobRole.id,
        is_secondary_role: this.isSecondaryRole(staffMember, jobRole),
        hi_score: staffMember.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost
      };
      
      // Add the shift
      shifts.push(shift);
      totalCost += totalShiftCost;
      
      console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} to ${jobRole.title} (${startTime}-${endTime}) on ${date}`);
      
      // Update staff allocations
      this.updateStaffAllocations(staffMember.id, date, shiftHours, shift, staffWeeklyAllocations);
    }
  }

  /**
   * Find the best available staff member for a shift
   */
  findBestStaffForShift(
    eligibleStaff: any[], 
    date: string, 
    shiftHours: number, 
    staffWeeklyAllocations: Record<string, any>
  ) {
    if (!eligibleStaff || eligibleStaff.length === 0) return null;
    
    // Sort by criteria:
    // 1. Staff who haven't reached their weekly hour limit
    // 2. Staff who haven't worked too many consecutive days
    // 3. Staff with the highest Hi Score
    
    const availableStaff = eligibleStaff.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      
      if (!allocation) {
        console.log(`No allocation found for staff ${staff.id}`);
        return false;
      }
      
      // Check if they've already been assigned to this date
      if (allocation.daysWorked.includes(date)) {
        return false;
      }
      
      // Check if they've reached their weekly maximum hours
      const maxHoursPerWeek = staff.max_hours_per_week || 40;
      if (allocation.hoursWorked + shiftHours > maxHoursPerWeek) {
        return false;
      }
      
      // Check consecutive days constraint - simplified for now
      if (allocation.daysWorked.length >= 6) {  // UK regulations typically limit to 6 consecutive days
        return false;
      }
      
      return true;
    });
    
    // If no staff available, try using secondary roles
    if (availableStaff.length === 0) {
      return null;
    }
    
    // Return the highest ranked available staff member
    return availableStaff[0] || null;
  }

  /**
   * Check if assigning this date would exceed consecutive days constraint
   */
  wouldExceedConsecutiveDays(daysWorked: string[], newDate: string) {
    // UK regulations typically limit to 6 consecutive days
    const maxConsecutiveDays = 6;
    
    // This requires calendar and consecutive days checking logic
    // Simplified implementation for now
    return daysWorked.length >= maxConsecutiveDays;
  }

  /**
   * Check if staff has sufficient rest between shifts
   */
  hasSufficientRestBetweenShifts(previousShifts: any[], newShiftDate: string) {
    // UK regulations require 11 hours rest between shifts
    // Implementation would check timing between shifts
    return false; // Simplified for now
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
    const allocation = staffWeeklyAllocations[staffId];
    if (allocation) {
      allocation.hoursWorked += hours;
      allocation.daysWorked.push(date);
      allocation.shifts.push(shift);
    }
  }

  /**
   * Find appropriate job role based on staff type
   */
  findJobRole(staffType: 'foh' | 'kitchen' | 'kp') {
    if (staffType === 'foh') {
      let fohRole = this.jobRoles.find(role => !role.is_kitchen && role.title.toLowerCase().includes('server'));
      if (!fohRole) fohRole = this.jobRoles.find(role => !role.is_kitchen && role.title.toLowerCase().includes('team'));
      if (!fohRole) fohRole = this.jobRoles.find(role => !role.is_kitchen);
      return fohRole;
    } else if (staffType === 'kitchen') {
      let chefRole = this.jobRoles.find(role => role.is_kitchen && role.title.toLowerCase().includes('chef'));
      if (!chefRole) chefRole = this.jobRoles.find(role => role.is_kitchen && !role.title.toLowerCase().includes('porter'));
      return chefRole;
    } else if (staffType === 'kp') {
      let kpRole = this.jobRoles.find(role => role.is_kitchen && role.title.toLowerCase().includes('porter'));
      if (!kpRole) kpRole = this.jobRoles.find(role => role.title.toLowerCase().includes('porter'));
      return kpRole;
    }
    return null;
  }

  /**
   * Calculate shift times based on segment and day
   */
  calculateShiftTimes(segment: string, dayOfWeek: string) {
    const isWeekend = dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
    
    let startTime = '';
    let endTime = '';
    let breakMinutes = 30;
    
    if (segment === 'weekday-day' || segment === 'weekend-day') {
      startTime = isWeekend ? '10:00:00' : '11:00:00';
      endTime = isWeekend ? '17:00:00' : '16:00:00';
      breakMinutes = 30;
    } else { // evening
      startTime = isWeekend ? '16:30:00' : '17:00:00';
      endTime = isWeekend ? '23:00:00' : '22:00:00';
      breakMinutes = 30;
    }
    
    return { startTime, endTime, breakMinutes };
  }

  /**
   * Calculate hours for a shift
   */
  calculateHours(startTime: string, endTime: string, breakMinutes: number) {
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startTotalMinutes = (startHours * 60) + startMinutes;
      const endTotalMinutes = (endHours * 60) + endMinutes;
      
      // Calculate difference in minutes
      let durationMinutes = endTotalMinutes - startTotalMinutes;
      
      // If end time is earlier than start time, add 24 hours (overnight shift)
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }
      
      // Subtract break time
      durationMinutes -= breakMinutes;
      
      // Convert to hours with decimal
      return durationMinutes / 60;
    } catch (error) {
      console.error('Error calculating shift hours:', error, { startTime, endTime, breakMinutes });
      return 0;
    }
  }

  /**
   * Calculate costs for a shift
   */
  calculateCosts(staffMember: any, hours: number) {
    // Ensure wage rate is always a number
    const wageRate = typeof staffMember.wage_rate === 'number' ? 
      staffMember.wage_rate : (staffMember.wage_rate ? parseFloat(staffMember.wage_rate) : 10.50);
    
    const employmentType = staffMember.employment_type || 'hourly';
    
    // Basic wage cost
    const shiftCost = wageRate * hours;
    
    // Calculate NI contribution
    let niCost = 0;
    if (employmentType !== 'contractor') {
      // UK NI threshold (simplified weekly calculation)
      const weeklyThreshold = 175;
      const hourlyThreshold = weeklyThreshold / 40;
      
      if (wageRate > hourlyThreshold) {
        niCost = (wageRate - hourlyThreshold) * hours * 0.138;  // 13.8% employer NI
      }
    }
    
    // Calculate pension contribution (3% employer minimum)
    const pensionCost = employmentType !== 'contractor' ? shiftCost * 0.03 : 0;
    
    // Total cost
    const totalShiftCost = shiftCost + niCost + pensionCost;
    
    return { shiftCost, niCost, pensionCost, totalShiftCost };
  }

  /**
   * Check if this is a secondary role for the staff member
   */
  isSecondaryRole(staffMember: any, jobRole: any) {
    if (!jobRole) return true;
    
    // Check if this job role is in the staff member's secondary_job_roles array
    if (Array.isArray(staffMember.secondary_job_roles) && 
        staffMember.secondary_job_roles.includes(jobRole.title)) {
      return true;
    }
    
    // If their primary job title doesn't match this role's title
    if (staffMember.job_title !== jobRole.title) {
      return true;
    }
    
    return false;
  }
}
