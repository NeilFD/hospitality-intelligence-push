
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Book, Utensils, Wine, ConciergeBell, ArrowRight } from 'lucide-react';

const TeamKnowledge: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-green-50 to-green-100 border-none rounded-xl">
        <CardHeader className="pt-6 pb-0 px-6">
          <div className="bg-green-500 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform hover:scale-105 transition-transform">
            <Utensils className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">Food Bible</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-6">
          <p className="text-green-700">Access all food recipes, cooking techniques, and preparation guides.</p>
        </CardContent>
        <CardFooter className="pt-0 px-6 pb-6">
          <Button asChild className="w-full justify-between bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg text-white shadow">
            <Link to="/food/bible">
              View Food Bible <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-purple-50 to-purple-100 border-none rounded-xl">
        <CardHeader className="pt-6 pb-0 px-6">
          <div className="bg-purple-500 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform hover:scale-105 transition-transform">
            <Wine className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-purple-800">Beverage Bible</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-6">
          <p className="text-purple-700">Access drink recipes, cocktail guides, and beverage preparation instructions.</p>
        </CardContent>
        <CardFooter className="pt-0 px-6 pb-6">
          <Button asChild className="w-full justify-between bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg text-white shadow">
            <Link to="/beverage/bible">
              View Beverage Bible <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-blue-50 to-blue-100 border-none rounded-xl">
        <CardHeader className="pt-6 pb-0 px-6">
          <div className="bg-blue-500 text-white p-4 rounded-xl inline-flex shadow-md mb-4 transform hover:scale-105 transition-transform">
            <ConciergeBell className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-800">Hospitality Bible</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-6">
          <p className="text-blue-700">Access service guides, customer care instructions, and hospitality best practices.</p>
        </CardContent>
        <CardFooter className="pt-0 px-6 pb-6">
          <Button asChild className="w-full justify-between bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white shadow">
            <Link to="/team/hospitality-bible">
              View Hospitality Bible <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TeamKnowledge;
