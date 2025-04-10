
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clipboard, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TeamDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Team Hub</h1>
        <p className="text-gray-600">
          Connect with your team, share updates, and stay informed.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Noticeboard Card */}
        <Card className="border border-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <Clipboard className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Team Noticeboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CardDescription className="text-base mb-4">
              Pin important announcements, share updates, and keep track of essential information for the team.
            </CardDescription>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Pin important announcements</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Share upcoming events</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Keep persistent information visible</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full justify-between bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Link to="/team/noticeboard">
                Open Noticeboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Team Chat Card */}
        <Card className="border border-indigo-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <MessageSquare className="h-6 w-6 text-indigo-500" />
              </div>
              <CardTitle className="text-xl">Team Chat</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CardDescription className="text-base mb-4">
              Real-time messaging with your team members for day-to-day communication and collaboration.
            </CardDescription>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <div className="bg-indigo-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Share quick updates</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-indigo-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Collaborate with team members</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="bg-indigo-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Send images, files, and more</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700">
              <Link to="/team/chat">
                Open Chat <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TeamDashboard;
