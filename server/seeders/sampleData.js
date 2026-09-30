/**
 * Sample Benchmark Dataset for EduSchedAI
 * Department: Computer Science & Engineering (Semester 4)
 */

const sampleDepartment = {
  code: 'CSE',
  name: 'Department of Computer Science & Engineering',
  institution: 'University Institute of Engineering & Technology'
};

const sampleConstraintConfig = {
  activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  periodsPerDay: 7,
  slotDurationMinutes: 50,
  startTime: '09:00',
  lunchBreakPeriod: 4, // 4th slot is lunch (12:00 - 12:50)
  lunchDurationMinutes: 50,
  maxConsecutiveLectures: 2,
  maxDailyFacultyHours: 4,
  weights: {
    workloadBalance: 80,
    minimizeStudentGaps: 70,
    minimizeFacultyGaps: 60,
    honorFacultyPreferences: 50,
    evenSubjectSpread: 65
  }
};

const sampleRooms = [
  {
    roomNumber: 'LH-101',
    building: 'Turing Block',
    floor: 1,
    capacity: 70,
    roomType: 'LectureHall',
    equipmentTags: ['Projector', 'SmartBoard', 'AudioSystem']
  },
  {
    roomNumber: 'LH-102',
    building: 'Turing Block',
    floor: 1,
    capacity: 70,
    roomType: 'LectureHall',
    equipmentTags: ['Projector', 'SmartBoard', 'AudioSystem']
  },
  {
    roomNumber: 'LH-103',
    building: 'Turing Block',
    floor: 2,
    capacity: 75,
    roomType: 'LectureHall',
    equipmentTags: ['Projector', 'Whiteboard']
  },
  {
    roomNumber: 'LAB-CS-1',
    building: 'Turing Block',
    floor: 2,
    capacity: 65,
    roomType: 'ComputerLab',
    equipmentTags: ['65 Workstations', 'Linux', 'GigabitLAN', 'Projector']
  },
  {
    roomNumber: 'LAB-CS-2',
    building: 'Turing Block',
    floor: 2,
    capacity: 65,
    roomType: 'ComputerLab',
    equipmentTags: ['65 Workstations', 'Windows/Docker', 'Projector']
  },
  {
    roomNumber: 'LAB-AI-GPU',
    building: 'Lovelace Block',
    floor: 3,
    capacity: 45,
    roomType: 'ComputerLab',
    equipmentTags: ['40 Nvidia RTX Workstations', 'PyTorch/CUDA Cluster']
  },
  {
    roomNumber: 'LAB-HW-1',
    building: 'Lovelace Block',
    floor: 1,
    capacity: 40,
    roomType: 'HardwareLab',
    equipmentTags: ['Microcontroller Kits', 'FPGA Boards', 'Oscilloscopes']
  },
  {
    roomNumber: 'SEM-AUD',
    building: 'Main Administrative Block',
    floor: 0,
    capacity: 150,
    roomType: 'SeminarHall',
    equipmentTags: ['Surround Audio', 'Dual Laser Projector', 'Stage']
  }
];

const sampleFaculty = [
  {
    name: 'Dr. Rajesh Kumar',
    email: 'hod.cse@eduschedai.edu',
    employeeCode: 'FAC-CSE-001',
    cadre: 'Professor',
    targetHours: 14,
    specializations: ['Design & Analysis of Algorithms', 'Advanced Data Structures'],
    unavailableSlots: [{ day: 'Monday', period: 1, reason: 'Dean Council Meeting' }],
    preferredSlots: [{ day: 'Tuesday', period: 2, weight: 1 }]
  },
  {
    name: 'Dr. Sunita Rao',
    email: 'dr.sunita@eduschedai.edu',
    employeeCode: 'FAC-CSE-002',
    cadre: 'Professor',
    targetHours: 14,
    specializations: ['Database Management Systems', 'Data Mining'],
    unavailableSlots: [{ day: 'Friday', period: 7, reason: 'Research Lab Supervision' }],
    preferredSlots: [{ day: 'Wednesday', period: 1, weight: 1 }]
  },
  {
    name: 'Dr. Amitav Ghosh',
    email: 'amitav.ghosh@eduschedai.edu',
    employeeCode: 'FAC-CSE-003',
    cadre: 'AssociateProf',
    targetHours: 16,
    specializations: ['Operating Systems', 'Distributed Computing'],
    unavailableSlots: [],
    preferredSlots: []
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@eduschedai.edu',
    employeeCode: 'FAC-CSE-004',
    cadre: 'AssociateProf',
    targetHours: 16,
    specializations: ['Computer Networks', 'Network Security'],
    unavailableSlots: [{ day: 'Wednesday', period: 5, reason: 'Mentorship Session' }],
    preferredSlots: []
  },
  {
    name: 'Prof. Vikram Malhotra',
    email: 'vikram.m@eduschedai.edu',
    employeeCode: 'FAC-CSE-005',
    cadre: 'AssistantProf',
    targetHours: 18,
    specializations: ['Software Engineering', 'Object Oriented Programming'],
    unavailableSlots: [],
    preferredSlots: []
  },
  {
    name: 'Prof. Neha Gupta',
    email: 'neha.gupta@eduschedai.edu',
    employeeCode: 'FAC-CSE-006',
    cadre: 'AssistantProf',
    targetHours: 18,
    specializations: ['Discrete Mathematics', 'Theory of Computation'],
    unavailableSlots: [],
    preferredSlots: []
  },
  {
    name: 'Prof. Sandeep Verma',
    email: 'sandeep.v@eduschedai.edu',
    employeeCode: 'FAC-CSE-007',
    cadre: 'AssistantProf',
    targetHours: 18,
    specializations: ['Design & Analysis of Algorithms', 'Operating Systems'],
    unavailableSlots: [],
    preferredSlots: []
  },
  {
    name: 'Prof. Ananya Sen',
    email: 'ananya.sen@eduschedai.edu',
    employeeCode: 'FAC-CSE-008',
    cadre: 'AssistantProf',
    targetHours: 18,
    specializations: ['Database Management Systems', 'Web Technologies'],
    unavailableSlots: [],
    preferredSlots: []
  },
  {
    name: 'Prof. Rohan Desai',
    email: 'rohan.desai@eduschedai.edu',
    employeeCode: 'FAC-CSE-009',
    cadre: 'AssistantProf',
    targetHours: 18,
    specializations: ['Computer Networks', 'Cloud Computing'],
    unavailableSlots: [],
    preferredSlots: []
  },
  {
    name: 'Prof. Kavita Patel',
    email: 'kavita.patel@eduschedai.edu',
    employeeCode: 'FAC-CSE-010',
    cadre: 'AssistantProf',
    targetHours: 18,
    specializations: ['Discrete Mathematics', 'Cyber Security'],
    unavailableSlots: [],
    preferredSlots: []
  },
  {
    name: 'Prof. Manish Joshi',
    email: 'manish.joshi@eduschedai.edu',
    employeeCode: 'FAC-CSE-011',
    cadre: 'AssistantProf',
    targetHours: 18,
    specializations: ['Software Engineering', 'Full Stack Development'],
    unavailableSlots: [],
    preferredSlots: []
  },
  {
    name: 'Prof. Divya Nair',
    email: 'divya.nair@eduschedai.edu',
    employeeCode: 'FAC-CSE-012',
    cadre: 'AssistantProf',
    targetHours: 18,
    specializations: ['Artificial Intelligence', 'Data Science'],
    unavailableSlots: [],
    preferredSlots: []
  }
];

const sampleBatches = [
  {
    name: 'CSE Section A',
    code: 'CSE-A-2026',
    semester: 4,
    academicYear: '2026-2027',
    studentStrength: 60,
    shift: 'General'
  },
  {
    name: 'CSE Section B',
    code: 'CSE-B-2026',
    semester: 4,
    academicYear: '2026-2027',
    studentStrength: 60,
    shift: 'General'
  }
];

const sampleSubjects = [
  // Theory Subjects
  {
    code: 'CS401',
    name: 'Design & Analysis of Algorithms',
    semester: 4,
    type: 'Theory',
    credits: 4,
    weeklyLectures: 4,
    labDurationHours: 1,
    preferredRoomType: 'LectureHall',
    primaryFacultyCode: 'FAC-CSE-001',
    altFacultyCode: 'FAC-CSE-007'
  },
  {
    code: 'CS402',
    name: 'Operating Systems',
    semester: 4,
    type: 'Theory',
    credits: 4,
    weeklyLectures: 4,
    labDurationHours: 1,
    preferredRoomType: 'LectureHall',
    primaryFacultyCode: 'FAC-CSE-003',
    altFacultyCode: 'FAC-CSE-007'
  },
  {
    code: 'CS403',
    name: 'Database Management Systems',
    semester: 4,
    type: 'Theory',
    credits: 4,
    weeklyLectures: 4,
    labDurationHours: 1,
    preferredRoomType: 'LectureHall',
    primaryFacultyCode: 'FAC-CSE-002',
    altFacultyCode: 'FAC-CSE-008'
  },
  {
    code: 'CS404',
    name: 'Computer Networks',
    semester: 4,
    type: 'Theory',
    credits: 3,
    weeklyLectures: 3,
    labDurationHours: 1,
    preferredRoomType: 'LectureHall',
    primaryFacultyCode: 'FAC-CSE-004',
    altFacultyCode: 'FAC-CSE-009'
  },
  {
    code: 'CS405',
    name: 'Discrete Mathematics',
    semester: 4,
    type: 'Theory',
    credits: 4,
    weeklyLectures: 4,
    labDurationHours: 1,
    preferredRoomType: 'LectureHall',
    primaryFacultyCode: 'FAC-CSE-006',
    altFacultyCode: 'FAC-CSE-010'
  },
  {
    code: 'CS406',
    name: 'Software Engineering',
    semester: 4,
    type: 'Theory',
    credits: 3,
    weeklyLectures: 3,
    labDurationHours: 1,
    preferredRoomType: 'LectureHall',
    primaryFacultyCode: 'FAC-CSE-005',
    altFacultyCode: 'FAC-CSE-011'
  },
  // Laboratory Subjects (2 continuous hours per week)
  {
    code: 'CS401P',
    name: 'Algorithms & Problem Solving Lab',
    semester: 4,
    type: 'Lab',
    credits: 2,
    weeklyLectures: 2,
    labDurationHours: 2, // 2-period contiguous block
    preferredRoomType: 'ComputerLab',
    primaryFacultyCode: 'FAC-CSE-007',
    altFacultyCode: 'FAC-CSE-001'
  },
  {
    code: 'CS402P',
    name: 'Operating Systems & Linux Shell Lab',
    semester: 4,
    type: 'Lab',
    credits: 2,
    weeklyLectures: 2,
    labDurationHours: 2,
    preferredRoomType: 'ComputerLab',
    primaryFacultyCode: 'FAC-CSE-003',
    altFacultyCode: 'FAC-CSE-007'
  },
  {
    code: 'CS403P',
    name: 'Database SQL & NoSQL Lab',
    semester: 4,
    type: 'Lab',
    credits: 2,
    weeklyLectures: 2,
    labDurationHours: 2,
    preferredRoomType: 'ComputerLab',
    primaryFacultyCode: 'FAC-CSE-008',
    altFacultyCode: 'FAC-CSE-002'
  },
  {
    code: 'CS404P',
    name: 'Computer Networks & Packet Tracer Lab',
    semester: 4,
    type: 'Lab',
    credits: 2,
    weeklyLectures: 2,
    labDurationHours: 2,
    preferredRoomType: 'ComputerLab',
    primaryFacultyCode: 'FAC-CSE-009',
    altFacultyCode: 'FAC-CSE-004'
  }
];

module.exports = {
  sampleDepartment,
  sampleConstraintConfig,
  sampleRooms,
  sampleFaculty,
  sampleBatches,
  sampleSubjects
};
