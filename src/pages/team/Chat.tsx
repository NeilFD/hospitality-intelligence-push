
import React from 'react';
import TeamChat from './components/TeamChat';
import { MessageSquare } from 'lucide-react';

const Chat: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Team Chat
        </h1>
        <p className="text-gray-600">
          Real-time messaging with your team members.
        </p>
      </div>
      <TeamChat />
    </div>
  );
};

export default Chat;
