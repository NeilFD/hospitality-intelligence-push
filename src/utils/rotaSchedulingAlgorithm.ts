
import { format, parseISO } from 'date-fns';

/**
 * This algorithm generates optimal staff schedules based on:
 * 1. Revenue forecasts
 * 2. Staff Hi Scores for skill rankings
 * 3. Labor cost targets
 * 4. UK employment regulations
 */
export class RotaSchedulingAlgorithm {
  request: any;
  staff: any[];
  jobRoles: any[];
  thresholds: any[];
  location: any;

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
    this.thresholds = thresholds;
    this.location = location;
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
    
    // Filter available staff
    const availableStaff = this.staff.filter(member => member.available_for_rota !== false);
    
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
      const dayRevenue = parseFloat(revenueForecast[date] || '0');
      totalRevenue += dayRevenue;
      
      if (dayRevenue <= 0) continue; // Skip days with no revenue forecast
      
      // Process each segment: day and evening
      for (const segment of ['day', 'evening']) {
        // Find applicable threshold based on day, segment, and revenue
        const threshold = this.findThreshold(dayOfWeek, segment, dayRevenue);
        
        if (!threshold) continue;
        
        // Assign FOH staff for this day/segment
        this.assignStaff({
          date,
          dayOfWeek,
          segment,
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
          segment,
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
          segment,
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
    
    return {
      shifts,
      total_cost: totalCost,
      revenue_forecast: totalRevenue,
      cost_percentage: costPercentage
    };
  };

  /**
   * Find the appropriate threshold based on day, segment, and revenue
   */
  findThreshold(dayOfWeek: string, segment: string, revenue: number) {
    // Filter thresholds by day and segment
    const applicableThresholds = this.thresholds.filter(t => 
      t.day_of_week.toLowerCase() === dayOfWeek && 
      t.segment === segment && 
      revenue >= t.revenue_min && 
      revenue <= t.revenue_max
    );
    
    // Return the first applicable threshold, or a default if none found
    return applicableThresholds[0] || null;
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
      // Front of House staff
      eligibleStaff = rankedStaff.filter(s => 
        !s.job_title?.toLowerCase().includes('chef') && 
        !s.job_title?.toLowerCase().includes('porter')
      );
    } else if (staffType === 'kitchen') {
      // Kitchen staff (chefs)
      eligibleStaff = rankedStaff.filter(s => 
        s.job_title?.toLowerCase().includes('chef')
      );
    } else if (staffType === 'kp') {
      // Kitchen porters
      eligibleStaff = rankedStaff.filter(s => 
        s.job_title?.toLowerCase().includes('porter')
      );
    }
    
    // Find the relevant job role ID
    const jobRole = this.findJobRole(staffType);
    if (!jobRole) return;
    
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
    // Sort by criteria:
    // 1. Staff who haven't reached their weekly hour limit
    // 2. Staff who haven't worked too many consecutive days
    // 3. Staff with the highest Hi Score
    
    const availableStaff = eligibleStaff.filter(staff => {
      const allocation = staffWeeklyAllocations[staff.id];
      
      if (!allocation) return false;
      
      // Check if they've already been assigned to this date
      if (allocation.daysWorked.includes(date)) return false;
      
      // Check if they've reached their weekly maximum hours
      const maxHoursPerWeek = staff.max_hours_per_week || 40;
      if (allocation.hoursWorked + shiftHours > maxHoursPerWeek) return false;
      
      // Check consecutive days constraint
      if (this.wouldExceedConsecutiveDays(allocation.daysWorked, date)) return false;
      
      // Check if they would have enough rest between shifts
      if (this.hasSufficientRestBetweenShifts(allocation.shifts, date)) return false;
      
      return true;
    });
    
    // If no staff available, try using secondary roles
    if (availableStaff.length === 0) {
      // Implementation would go here - check staff with secondary roles
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
      return this.jobRoles.find(role => !role.is_kitchen && role.title.toLowerCase().includes('team'));
    } else if (staffType === 'kitchen') {
      return this.jobRoles.find(role => role.is_kitchen && role.title.toLowerCase().includes('chef'));
    } else if (staffType === 'kp') {
      return this.jobRoles.find(role => role.is_kitchen && role.title.toLowerCase().includes('porter'));
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
    
    if (segment === 'day') {
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
  }

  /**
   * Calculate costs for a shift
   */
  calculateCosts(staffMember: any, hours: number) {
    const wageRate = staffMember.wage_rate || 0;
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
