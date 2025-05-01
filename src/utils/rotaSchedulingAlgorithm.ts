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
    // Find the relevant job role ID
    const staffJobRole = this.findJobRole(staffType);
    if (!staffJobRole) {
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

      // Filter staff by job role - only include those with matching primary job title or explicit secondary role
      let eligibleStaff = rankedStaff.filter(s => {
        // Primary role match - exact match on job title
        if (s.job_title === defaultJobRole.title) {
          return true;
        }
        
        // Secondary role match - must be explicitly in secondary_job_roles array
        if (Array.isArray(s.secondary_job_roles) && s.secondary_job_roles.includes(defaultJobRole.title)) {
          return true;
        }
        
        return false;
      });
      
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
    
    // Filter staff by job role - only include those with matching primary job title or explicit secondary role
    let eligibleStaff = rankedStaff.filter(s => {
      // Primary role match - exact match on job title
      if (s.job_title === staffJobRole.title) {
        return true;
      }
      
      // Secondary role match - must be explicitly in secondary_job_roles array
      if (Array.isArray(s.secondary_job_roles) && s.secondary_job_roles.includes(staffJobRole.title)) {
        return true;
      }
      
      return false;
    });
    
    // If no eligible staff for the specific role title, try broader matching based on job role categories
    if (eligibleStaff.length === 0) {
      console.log(`No exact title matches for ${staffJobRole.title}, trying category-based matching`);
      
      if (staffType === 'foh') {
        // Front of House roles - look for FOH staff based on known FOH role titles or not being kitchen
        eligibleStaff = rankedStaff.filter(s => {
          const staffJobRoleInfo = this.jobRoles.find(r => r.title === s.job_title);
          
          // If we have job role data for this staff member, use that
          if (staffJobRoleInfo) {
            return !staffJobRoleInfo.is_kitchen;
          }
          
          // Otherwise make a best-guess based on common job title keywords
          const jobTitle = (s.job_title || '').toLowerCase();
          return !jobTitle.includes('chef') && 
                 !jobTitle.includes('kitchen') && 
                 !jobTitle.includes('porter');
        });
      } else if (staffType === 'kitchen') {
        // Kitchen roles (excluding porters) - look for chef roles
        eligibleStaff = rankedStaff.filter(s => {
          const staffJobRoleInfo = this.jobRoles.find(r => r.title === s.job_title);
          
          // If we have job role data for this staff member, use that
          if (staffJobRoleInfo) {
            return staffJobRoleInfo.is_kitchen && !s.job_title.toLowerCase().includes('porter');
          }
          
          // Otherwise make a best-guess based on common job title keywords
          const jobTitle = (s.job_title || '').toLowerCase();
          return (jobTitle.includes('chef') || 
                 jobTitle.includes('cook') || 
                 jobTitle.includes('kitchen')) && 
                 !jobTitle.includes('porter');
        });
      } else if (staffType === 'kp') {
        // Kitchen porter roles - look for porter specific roles
        eligibleStaff = rankedStaff.filter(s => {
          const staffJobRoleInfo = this.jobRoles.find(r => r.title === s.job_title);
          
          // If we have job role data for this staff member, use that
          if (staffJobRoleInfo) {
            return staffJobRoleInfo.is_kitchen && s.job_title.toLowerCase().includes('porter');
          }
          
          // Otherwise check job title directly
          return s.job_title?.toLowerCase().includes('porter');
        });
      }
    }
    
    console.log(`Found ${eligibleStaff.length} eligible staff for ${staffType} roles`);
    
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
        job_role_id: staffJobRole.id,
        is_secondary_role: this.isSecondaryRole(staffMember, staffJobRole),
        hi_score: staffMember.hi_score || 0,
        shift_cost: shiftCost,
        employer_ni_cost: niCost,
        employer_pension_cost: pensionCost,
        total_cost: totalShiftCost
      };
      
      // Add the shift
      shifts.push(shift);
      totalCost += totalShiftCost;
      
      console.log(`Assigned ${staffMember.first_name} ${staffMember.last_name} to ${staffJobRole.title} (${startTime}-${endTime}) on ${date}`);
      
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
   * FIXED: Only consider a role secondary if it's explicitly in the secondary_job_roles array
   */
  isSecondaryRole(staffMember: any, jobRole: any) {
    if (!jobRole) return false;
    
    // Only mark as secondary if it's explicitly in the staff member's secondary_job_roles array
    if (Array.isArray(staffMember.secondary_job_roles) && 
        staffMember.secondary_job_roles.includes(jobRole.title)) {
      return true;
    }
    
    // Do NOT consider a role secondary just because job titles don't match
    // This was causing all roles to be marked as secondary incorrectly
    
    return false;
  }
}
