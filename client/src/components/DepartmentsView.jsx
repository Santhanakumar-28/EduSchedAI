import React from 'react';
import { Building2, Users, BookOpen, Layers, MapPin, CheckCircle2 } from 'lucide-react';

export default function DepartmentsView({ onNavigateTab }) {
  const departments = [
    {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      hod: 'Dr. Rajesh Kumar',
      facultyCount: 8,
      studentsCount: 140,
      coursesCount: 6,
      labs: ['Turing Lab 1', 'AI & GPU Lab', 'Cloud Computing Lab'],
      building: 'Turing Block',
      status: 'Active'
    },
    {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      hod: 'Dr. S. Meena',
      facultyCount: 5,
      studentsCount: 110,
      coursesCount: 4,
      labs: ['VLSI Lab', 'Signal Processing Lab'],
      building: 'Babbage Block',
      status: 'Active'
    },
    {
      code: 'EEE',
      name: 'Electrical & Electronics Engineering',
      hod: 'Prof. A. Kumar',
      facultyCount: 4,
      studentsCount: 95,
      coursesCount: 3,
      labs: ['Power Systems Lab', 'Control Systems Lab'],
      building: 'Tesla Block',
      status: 'Active'
    },
    {
      code: 'MECH',
      name: 'Mechanical Engineering',
      hod: 'Dr. L. Vignesh',
      facultyCount: 4,
      studentsCount: 100,
      coursesCount: 3,
      labs: ['CAD/CAM Lab', 'Thermal Engineering Lab'],
      building: 'Watt Block',
      status: 'Active'
    },
    {
      code: 'CIVIL',
      name: 'Civil Engineering',
      hod: 'Prof. P. Nisha',
      facultyCount: 3,
      studentsCount: 85,
      coursesCount: 2,
      labs: ['Structural Lab', 'Geo-technical Lab'],
      building: 'Visvesvaraya Block',
      status: 'Active'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Departments</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Departmental hierarchy, faculty strength, and specialized laboratory allocations.
          </p>
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold">
          <Building2 className="w-4 h-4 mr-1.5" />
          <span>5 Institutional Departments</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div key={dept.code} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shadow-2xs">
                {dept.code}
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                {dept.status}
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-sm font-bold text-slate-900 leading-snug">{dept.name}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{dept.building}</span>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs font-bold text-slate-900">{dept.facultyCount}</p>
                <p className="text-[10px] text-slate-400 font-medium">Faculty</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{dept.studentsCount}</p>
                <p className="text-[10px] text-slate-400 font-medium">Students</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{dept.coursesCount}</p>
                <p className="text-[10px] text-slate-400 font-medium">Courses</p>
              </div>
            </div>

            <div className="mt-4 bg-slate-50/80 rounded-xl p-3 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Designated Laboratories
              </span>
              <div className="flex flex-wrap gap-1.5">
                {dept.labs.map((lab) => (
                  <span key={lab} className="px-2 py-0.5 bg-white border border-slate-200/80 rounded-md text-[10px] font-medium text-slate-600">
                    {lab}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
