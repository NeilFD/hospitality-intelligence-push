
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Book, Utensils, Wine, ConciergeBell, ArrowRight } from 'lucide-react';

const TeamKnowledge: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Food Bible Card */}
      <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border-green-200 rounded-xl group relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
             style={{ backgroundImage: "url('/lovable-uploads/d7e475f7-c18d-4312-91d6-2bf24f07af7a.png')" }} />
        
        <CardHeader className="pt-6 pb-0 px-6 relative z-10">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform group-hover:scale-105 transition-transform">
            <Utensils className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">Food Bible</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-6 relative z-10">
          <p className="text-green-700 min-h-[80px]">Access all food recipes, cooking techniques, and preparation guides.</p>
        </CardContent>
        <CardFooter className="pt-0 px-6 pb-6 relative z-10">
          <Button asChild className="w-full justify-between bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg text-white shadow group-hover:shadow-md transition-all">
            <Link to="/food/bible">
              View Food Bible <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Beverage Bible Card */}
      <Card className="overflow-hidden shadow-none rounded-lg group relative bg-white">
        <CardHeader className="p-4">
          <div className="bg-purple-600 text-white p-4 rounded mb-2 inline-flex">
            <Wine className="h-8 w-8" />
          </div>
          <CardTitle className="text-lg font-bold text-gray-800">Beverage Bible</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-gray-600 text-sm">Access drink recipes, cocktail guides, and beverage preparation instructions.</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <Link to="/beverage/bible">
              View Beverage Bible
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Hospitality Bible Card */}
      <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border-blue-200 rounded-xl group relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
             style={{ backgroundImage: "url('/lovable-uploads/d0fa3279-2855-4f82-b009-47d725cad839.png')" }} />
             
        <CardHeader className="pt-6 pb-0 px-6 relative z-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform group-hover:scale-105 transition-transform">
            <ConciergeBell className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-800">Hospitality Bible</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-6 relative z-10">
          <p className="text-blue-700 min-h-[80px]">Access service guides, customer care instructions, and hospitality best practices.</p>
        </CardContent>
        <CardFooter className="pt-0 px-6 pb-6 relative z-10">
          <Button asChild className="w-full justify-between bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white shadow group-hover:shadow-md transition-all">
            <Link to="/team/hospitality-bible">
              View Hospitality Bible <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TeamKnowledge;

