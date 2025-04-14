
import React from 'react';
import { Book } from 'lucide-react';
import TeamKnowledge from './components/TeamKnowledge';

const Knowledge: React.FC = () => {
  return (
    <div className="container mx-auto p-4 h-full">
      <div className="bg-gradient-to-r from-hi-purple-light/20 to-hi-purple/10 rounded-lg p-6 mb-6 shadow-md border border-hi-purple/20 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5 bg-repeat" 
             style={{ backgroundImage: "url('/lovable-uploads/69a5215d-88c2-4e73-880a-f0820234832d.png')", backgroundSize: '200px' }} />
             
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 text-hi-purple flex items-center gap-2">
            <Book className="h-7 w-7 text-hi-purple" /> Team Knowledge Base
          </h1>
          <p className="text-gray-600">
            Access recipes, service standards, and training materials for the team.
          </p>
        </div>
      </div>
      <TeamKnowledge />
    </div>
  );
};

export default Knowledge;
