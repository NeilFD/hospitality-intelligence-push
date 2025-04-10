
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wine, Sandwich, Users } from 'lucide-react';

const TeamKnowledge: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample recipe and knowledge data
  const knowledgeData = {
    food: [
      { id: '1', title: 'House Burger Recipe', category: 'Main Course', description: 'Our signature burger with secret sauce', lastUpdated: '2025-03-28' },
      { id: '2', title: 'Garlic Mashed Potatoes', category: 'Side Dish', description: 'Creamy garlic mashed potatoes', lastUpdated: '2025-04-02' },
      { id: '3', title: 'Homemade Pasta', category: 'Main Course', description: 'Fresh pasta recipe with instructions', lastUpdated: '2025-04-05' },
    ],
    beverage: [
      { id: '1', title: 'Signature Old Fashioned', category: 'Cocktail', description: 'House special Old Fashioned recipe', lastUpdated: '2025-03-25' },
      { id: '2', title: 'Wine Pairing Guide', category: 'Wine', description: 'Guide for pairing wines with menu items', lastUpdated: '2025-04-01' },
      { id: '3', title: 'Espresso Martini', category: 'Cocktail', description: 'Perfect espresso martini recipe', lastUpdated: '2025-04-07' },
    ],
    service: [
      { id: '1', title: 'Table Service Standards', category: 'FOH Procedures', description: 'Standard procedures for table service', lastUpdated: '2025-03-20' },
      { id: '2', title: 'Handling Customer Complaints', category: 'Customer Service', description: 'Guide to handling difficult situations', lastUpdated: '2025-04-03' },
      { id: '3', title: 'Opening Procedures', category: 'Operations', description: 'Step-by-step opening checklist', lastUpdated: '2025-04-06' },
    ],
  };
  
  const filterItems = (items: any[]) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const renderKnowledgeCard = (item: any, icon: React.ReactNode) => (
    <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{item.title}</CardTitle>
          </div>
          <span className="text-xs bg-gray-100 rounded-full px-2 py-1">{item.category}</span>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{item.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <span className="text-xs text-gray-500">Updated: {item.lastUpdated}</span>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View Details</Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Input
          placeholder="Search recipes, service info..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="food" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="food" className="flex items-center gap-2">
            <Sandwich className="h-4 w-4" /> Food
          </TabsTrigger>
          <TabsTrigger value="beverage" className="flex items-center gap-2">
            <Wine className="h-4 w-4" /> Beverage
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Service
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="food" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(knowledgeData.food).map(item => 
              renderKnowledgeCard(item, <Sandwich className="h-4 w-4 text-green-600" />)
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="beverage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(knowledgeData.beverage).map(item => 
              renderKnowledgeCard(item, <Wine className="h-4 w-4 text-purple-600" />)
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="service" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(knowledgeData.service).map(item => 
              renderKnowledgeCard(item, <Users className="h-4 w-4 text-blue-600" />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamKnowledge;
