import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search } from 'lucide-react';
import { Recipe, Ingredient } from '@/types/recipe-types';
import { supabase } from '@/lib/supabase';
import RecipeDetailDialog from '@/components/recipes/RecipeDetailDialog';
import RecipeFormDialog from '@/components/recipes/RecipeFormDialog';
import { toast } from 'sonner';

const HospitalityBible: React.FC = () => {
  const [guides, setGuides] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<Recipe | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  
  const handleOpenDetailDialog = (guide: Recipe) => {
    setSelectedGuide(guide);
    setDetailDialogOpen(true);
  };
  
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedGuide(null);
  };
  
  const handleOpenFormDialog = (guide?: Recipe) => {
    setSelectedGuide(guide || null);
    setFormDialogOpen(true);
  };
  
  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedGuide(null);
  };
  
  const handleGuideUpdated = (updatedGuide: Recipe) => {
    setGuides(prevGuides =>
      prevGuides.map(guide =>
        guide.id === updatedGuide.id ? updatedGuide : guide
      )
    );
    handleCloseFormDialog();
  };
  
  const handleGuideCreated = (newGuide: Recipe) => {
    setGuides(prevGuides => [...prevGuides, newGuide]);
    handleCloseFormDialog();
  };
  
  const handleGuideDeleted = async (guideToDelete: Recipe) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', guideToDelete.id);
        
      if (error) {
        console.error('Error deleting guide:', error);
        toast.error('Failed to delete guide');
        return;
      }
      
      setGuides(prevGuides =>
        prevGuides.filter(guide => guide.id !== guideToDelete.id)
      );
      handleCloseDetailDialog();
      toast.success('Guide deleted successfully');
    } catch (error) {
      console.error('Unexpected error deleting guide:', error);
      toast.error('Failed to delete guide');
    }
  };

  useEffect(() => {
    const fetchGuides = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('module_type', 'hospitality')
          .order('name');

        if (error) {
          console.error('Error fetching hospitality guides:', error);
          return;
        }

        // Process the guide data to match the Recipe type
        const processedGuides: Recipe[] = data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          ingredients: Array.isArray(item.ingredients) ? (item.ingredients as unknown as Ingredient[]) : [],
          allergens: Array.isArray(item.allergens) ? item.allergens : [],
          isVegan: item.is_vegan || false,
          isVegetarian: item.is_vegetarian || false,
          isGlutenFree: item.is_gluten_free || false,
          timeToTableMinutes: item.time_to_table_minutes || 0,
          method: item.method || '',
          miseEnPlace: item.mise_en_place || '',
          imageUrl: item.image_url || '',
          costing: {
            totalRecipeCost: item.total_recipe_cost || 0,
            suggestedSellingPrice: item.suggested_selling_price || 0,
            actualMenuPrice: item.actual_menu_price || 0,
            grossProfitPercentage: item.gross_profit_percentage || 0
          },
          archived: item.archived || false,
          postedToNoticeboard: item.posted_to_noticeboard || false,
          moduleType: 'hospitality' as const,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at)
        }));

        setGuides(processedGuides);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const filteredGuides = guides.filter(guide =>
    guide.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Hospitality Guides</h1>
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-64"
          />
          <Button onClick={() => handleOpenFormDialog()} className="bg-green-500 text-white hover:bg-green-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Guide
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading guides...</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuides.map((guide) => (
                <TableRow key={guide.id}>
                  <TableCell>{guide.name}</TableCell>
                  <TableCell>{guide.category}</TableCell>
                  <TableCell>
                    <Button variant="secondary" size="sm" onClick={() => handleOpenDetailDialog(guide)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <RecipeDetailDialog
        recipe={selectedGuide!}
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        onEdit={() => handleOpenFormDialog(selectedGuide!)}
        onDelete={handleGuideDeleted}
      />
      
      <RecipeFormDialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        recipe={selectedGuide || undefined}
        onSave={(guide: Recipe) => {
          if (selectedGuide) {
            // Handle update
            setGuides(prevGuides =>
              prevGuides.map(g =>
                g.id === guide.id ? guide : g
              )
            );
          } else {
            // Handle create
            setGuides(prevGuides => [...prevGuides, guide]);
          }
          handleCloseFormDialog();
        }}
        moduleType="hospitality"
      />
    </div>
  );
};

export default HospitalityBible;
