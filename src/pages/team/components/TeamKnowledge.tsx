
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
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
             style={{ backgroundImage: "url('/lovable-uploads/0602f3f9-f1ae-4dcf-b302-198bca3ec238.png')" }} />
        
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
      <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border-hi-purple-light/20 rounded-xl group relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
             style={{ backgroundImage: "url('/lovable-uploads/3ea13c06-cab2-45cb-9b59-d96f32f78ecd.png')" }} />
             
        <CardHeader className="pt-6 pb-0 px-6 relative z-10">
          <div className="bg-gradient-to-br from-hi-purple to-hi-purple-dark text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform group-hover:scale-105 transition-transform">
            <Wine className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-hi-purple-dark">Beverage Bible</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-6 relative z-10">
          <p className="text-hi-purple min-h-[80px]">Access drink recipes, cocktail guides, and beverage preparation instructions.</p>
        </CardContent>
        <CardFooter className="pt-0 px-6 pb-6 relative z-10">
          <Button asChild className="w-full justify-between bg-gradient-to-r from-hi-purple to-hi-purple-dark hover:from-hi-purple-dark hover:to-hi-purple-dark rounded-lg text-white shadow group-hover:shadow-md transition-all">
            <Link to="/beverage/bible">
              View Beverage Bible <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Hospitality Bible Card */}
      <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border-blue-200 rounded-xl group relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
             style={{ backgroundImage: "url('/lovable-uploads/4234e734-6ccc-48b7-8f35-d14a78ef4afc.png')" }} />
             
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
