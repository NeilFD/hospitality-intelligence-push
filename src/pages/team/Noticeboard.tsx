
import React from 'react';
import TeamNoticeboard from './components/TeamNoticeboard';
import { Clipboard } from 'lucide-react';

const Noticeboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 flex items-center gap-2">
          <Clipboard className="h-6 w-6" /> Team Noticeboard
        </h1>
        <p className="text-gray-600">
          Pin important notes, share updates, and stay connected with the team.
        </p>
      </div>
      <TeamNoticeboard />
    </div>
  );
};

export default Noticeboard;
