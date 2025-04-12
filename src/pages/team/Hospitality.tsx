
import React from 'react';
import { ConciergeBell } from 'lucide-react';
import HospitalityBible from './HospitalityBible';

const Hospitality: React.FC = () => {
  return (
    <div className="container mx-auto p-4 h-full">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 flex items-center gap-2">
          <ConciergeBell className="h-6 w-6" /> Hospitality Bible
        </h1>
        <p className="text-gray-600">
          Service standards, hospitality guides, and training materials for the team.
        </p>
      </div>
      <HospitalityBible />
    </div>
  );
};

export default Hospitality;
