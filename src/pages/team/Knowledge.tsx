
import React from 'react';
import { Book } from 'lucide-react';
import TeamKnowledge from './components/TeamKnowledge';

const Knowledge: React.FC = () => {
  return (
    <div className="container mx-auto p-4 h-full">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 flex items-center gap-2">
          <Book className="h-6 w-6" /> Team Knowledge Base
        </h1>
        <p className="text-gray-600">
          Access recipes, service standards, and training materials for the team.
        </p>
      </div>
      <TeamKnowledge />
    </div>
  );
};

export default Knowledge;
