/**
 * EduSchedAI - Stage 1: Constructive Constraint Satisfaction Problem (CSP) Solver
 * High-performance constraint solver with randomized restarts, MRV heuristic,
 * and forward conflict-checking to find 100% clash-free schedules in milliseconds.
 */

class CSPSolver {
  constructor(context) {
    this.batches = context.batches;
    this.faculty = context.faculty;
    this.rooms = context.rooms;
    this.subjects = context.subjects;
    this.config = context.config;

    this.days = this.config.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    this.periodsPerDay = this.config.periodsPerDay || 7;
    this.lunchPeriod = this.config.lunchBreakPeriod || 4;

    this.facultyMap = new Map();
    this.faculty.forEach((f) => {
      this.facultyMap.set(String(f._id || f.id || f.employeeCode), f);
    });

    this.facultyUnavailableSet = new Set();
    this.faculty.forEach((f) => {
      const fId = String(f._id || f.id || f.employeeCode);
      if (f.unavailableSlots) {
        f.unavailableSlots.forEach((u) => {
          this.facultyUnavailableSet.add(`${fId}:${u.day}:${u.period}`);
        });
      }
    });
  }

  /**
   * Shuffle array in-place (Fisher-Yates)
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Deconstruct curriculum into discrete scheduling units
   */
  createEvents() {
    const labEvents = [];
    const theoryEvents = [];

    for (const batch of this.batches) {
      const bId = String(batch._id || batch.id || batch.code);

      for (const subject of this.subjects) {
        const sId = String(subject._id || subject.id || subject.code);

        if (subject.type === 'Lab') {
          const duration = subject.labDurationHours || 2;
          const numBlocks = Math.floor(subject.weeklyLectures / duration);

          for (let i = 0; i < numBlocks; i++) {
            labEvents.push({
              id: `${bId}_${sId}_lab_${i}`,
              batch,
              batchId: bId,
              subject,
              subjectId: sId,
              type: 'Lab',
              duration,
              isLabBlock: true
            });
          }
        } else {
          const lectures = subject.weeklyLectures || 3;
          for (let i = 0; i < lectures; i++) {
            theoryEvents.push({
              id: `${bId}_${sId}_theory_${i}`,
              batch,
              batchId: bId,
              subject,
              subjectId: sId,
              type: 'Theory',
              duration: 1,
              isLabBlock: false
            });
          }
        }
      }
    }

    return { labEvents, theoryEvents };
  }

  getEligibleFaculty(subject) {
    const list = [];
    if (subject.assignedFacultyIds && subject.assignedFacultyIds.length > 0) {
      for (const fRef of subject.assignedFacultyIds) {
        const fId = String(fRef._id || fRef.id || fRef);
        if (this.facultyMap.has(fId)) {
          list.push(this.facultyMap.get(fId));
        }
      }
    }
    if (list.length === 0) {
      for (const f of this.faculty) {
        if (f.specializations && f.specializations.includes(subject.name)) {
          list.push(f);
        }
      }
    }
    return list.length > 0 ? list : this.faculty;
  }

  getEligibleRooms(event) {
    return this.rooms.filter((r) => {
      if (r.capacity < event.batch.studentStrength) return false;
      if (event.type === 'Lab') {
        return r.roomType === 'ComputerLab' || r.roomType === 'HardwareLab' || r.roomType === event.subject.preferredRoomType;
      }
      return r.roomType === 'LectureHall' || r.roomType === 'SeminarHall';
    });
  }

  /**
   * Attempt a single constructive placement pass
   */
  attemptPlacement(labEvents, theoryEvents) {
    const batchOccupancy = new Map();
    const facultyOccupancy = new Map();
    const roomOccupancy = new Map();
    const facultyLoad = new Map();
    const placedSlots = [];

    this.faculty.forEach((f) => {
      facultyLoad.set(String(f._id || f.id || f.employeeCode), 0);
    });

    const isSlotClean = (fId, bId, rId, day, p) => {
      if (p === this.lunchPeriod) return false;
      if (p > this.periodsPerDay) return false;
      if (this.facultyUnavailableSet.has(`${fId}:${day}:${p}`)) return false;
      if (facultyOccupancy.has(`${fId}:${day}:${p}`)) return false;
      if (batchOccupancy.has(`${bId}:${day}:${p}`)) return false;
      if (roomOccupancy.has(`${rId}:${day}:${p}`)) return false;
      return true;
    };

    const bookSlot = (event, fId, bId, rId, day, startP) => {
      for (let offset = 0; offset < event.duration; offset++) {
        const p = startP + offset;
        batchOccupancy.set(`${bId}:${day}:${p}`, event.subjectId);
        facultyOccupancy.set(`${fId}:${day}:${p}`, bId);
        roomOccupancy.set(`${rId}:${day}:${p}`, bId);

        placedSlots.push({
          day,
          period: p,
          batchId: bId,
          subjectId: event.subjectId,
          facultyId: fId,
          roomId: rId,
          type: event.type,
          isLabBlock: event.isLabBlock,
          slotDuration: 1
        });
      }
      facultyLoad.set(fId, (facultyLoad.get(fId) || 0) + event.duration);
    };

    // 1. Place Lab Events First (Most Constrained Variables)
    // Lab blocks require contiguous periods (e.g. 2 hours) and specialized rooms
    const shuffledLabs = this.shuffle([...labEvents]);
    for (const lab of shuffledLabs) {
      const bId = lab.batchId;
      const eligibleRooms = this.shuffle(this.getEligibleRooms(lab));
      const eligibleFaculty = this.getEligibleFaculty(lab.subject).sort(
        (a, b) => (facultyLoad.get(String(a._id || a.id || a.employeeCode)) || 0) -
                  (facultyLoad.get(String(b._id || b.id || b.employeeCode)) || 0)
      );

      let placed = false;
      const days = this.shuffle([...this.days]);

      outerLab: for (const day of days) {
        // Potential start periods for 2-hour lab:
        // Morning: periods 1, 2 (before lunch period 4)
        // Afternoon: periods 5, 6 (after lunch period 4)
        const possibleStarts = [1, 2, 5, 6].filter(
          (p) => p + lab.duration - 1 <= this.periodsPerDay && !(p < this.lunchPeriod && p + lab.duration - 1 >= this.lunchPeriod)
        );
        this.shuffle(possibleStarts);

        for (const startP of possibleStarts) {
          for (const room of eligibleRooms) {
            const rId = String(room._id || room.id || room.roomNumber);

            for (const fac of eligibleFaculty) {
              const fId = String(fac._id || fac.id || fac.employeeCode);

              let allClean = true;
              for (let off = 0; off < lab.duration; off++) {
                if (!isSlotClean(fId, bId, rId, day, startP + off)) {
                  allClean = false;
                  break;
                }
              }

              if (allClean) {
                bookSlot(lab, fId, bId, rId, day, startP);
                placed = true;
                break outerLab;
              }
            }
          }
        }
      }

      if (!placed) {
        return { success: false }; // Restart with fresh random order
      }
    }

    // 2. Place Theory Events
    const shuffledTheory = this.shuffle([...theoryEvents]);
    for (const theory of shuffledTheory) {
      const bId = theory.batchId;
      const eligibleRooms = this.shuffle(this.getEligibleRooms(theory));
      const eligibleFaculty = this.getEligibleFaculty(theory.subject).sort(
        (a, b) => (facultyLoad.get(String(a._id || a.id || a.employeeCode)) || 0) -
                  (facultyLoad.get(String(b._id || b.id || b.employeeCode)) || 0)
      );

      let placed = false;
      const days = this.shuffle([...this.days]);

      // Heuristic: Prefer days where this subject isn't already taught
      days.sort((d1, d2) => {
        const c1 = placedSlots.filter((s) => s.batchId === bId && s.subjectId === theory.subjectId && s.day === d1).length;
        const c2 = placedSlots.filter((s) => s.batchId === bId && s.subjectId === theory.subjectId && s.day === d2).length;
        return c1 - c2;
      });

      outerTheory: for (const day of days) {
        const periods = this.shuffle(
          Array.from({ length: this.periodsPerDay }, (_, i) => i + 1).filter((p) => p !== this.lunchPeriod)
        );

        for (const p of periods) {
          for (const room of eligibleRooms) {
            const rId = String(room._id || room.id || room.roomNumber);

            for (const fac of eligibleFaculty) {
              const fId = String(fac._id || fac.id || fac.employeeCode);

              if (isSlotClean(fId, bId, rId, day, p)) {
                bookSlot(theory, fId, bId, rId, day, p);
                placed = true;
                break outerTheory;
              }
            }
          }
        }
      }

      if (!placed) {
        return { success: false }; // Restart
      }
    }

    return {
      success: true,
      schedule: placedSlots
    };
  }

  /**
   * Run randomized restarts until a 100% clash-free schedule is constructed
   */
  solve(maxRestarts = 100) {
    const { labEvents, theoryEvents } = this.createEvents();
    const totalEvents = labEvents.length + theoryEvents.length;

    for (let restart = 1; restart <= maxRestarts; restart++) {
      const attempt = this.attemptPlacement(labEvents, theoryEvents);
      if (attempt.success) {
        return {
          success: true,
          schedule: attempt.schedule,
          totalPlaced: attempt.schedule.length,
          restartsNeeded: restart
        };
      }
    }

    return {
      success: false,
      totalPlaced: 0,
      totalEvents
    };
  }
}

module.exports = CSPSolver;
