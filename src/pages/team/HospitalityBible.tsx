
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeFilters from "@/components/recipes/RecipeFilters";
import RecipeFormDialog from "@/components/recipes/RecipeFormDialog";
import RecipeDetailDialog from "@/components/recipes/RecipeDetailDialog";
import { Recipe, RecipeFilterOptions, Ingredient } from "@/types/recipe-types";
import { menuCategories, allergenTypes } from "@/data/sample-recipe-data";
import { Plus, PanelLeft, ChevronLeft, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { v4 as uuidv4 } from 'uuid';

const HospitalityBible: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RecipeFilterOptions>({
    searchTerm: "",
    category: "all_categories",
    allergens: [],
    isVegan: null,
    isVegetarian: null,
    isGlutenFree: null,
    letter: null,
    status: "live"
  });
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMaximized, setSidebarMaximized] = useState(false);
  const isMobile = useIsMobile();

  const hospitalityCategories = [
    "Customer Service",
    "Complaint Handling",
    "Table Service",
    "Bar Service",
    "Opening Procedures",
    "Closing Procedures",
    "Till Operations",
    "Hosting",
    "Special Events",
    "Staff Training"
  ];

  const hospitalityCategoryObjects = hospitalityCategories.map(category => ({
    id: category.toLowerCase().replace(/\s+/g, '-'),
    name: category,
    moduleType: 'hospitality' as const
  }));

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      console.log("Fetching hospitality guides from Supabase...");
      const {
        data: guidesData,
        error: guidesError
      } = await supabase.from('hospitality_guides').select('*');
      
      if (guidesError) {
        throw guidesError;
      }
      
      console.log(`Fetched ${guidesData?.length || 0} hospitality guides`);
      
      const mappedGuides: Recipe[] = (guidesData || []).map(guide => ({
        id: guide.id,
        name: guide.name,
        category: guide.category,
        allergens: [],
        isVegan: false,
        isVegetarian: false,
        isGlutenFree: false,
        timeToTableMinutes: guide.time_to_complete_minutes || 0,
        miseEnPlace: guide.required_resources || '',
        method: guide.detailed_procedure || '',
        createdAt: new Date(guide.created_at),
        updatedAt: new Date(guide.updated_at),
        imageUrl: guide.image_url,
        ingredients: (guide.steps || []) as Ingredient[],
        costing: {
          totalRecipeCost: 0,
          suggestedSellingPrice: 0,
          actualMenuPrice: 0,
          grossProfitPercentage: 0
        },
        moduleType: 'hospitality',
        archived: guide.archived || false,
        postedToNoticeboard: guide.posted_to_noticeboard || false
      }));
      
      setRecipes(mappedGuides);
    } catch (error) {
      console.error('Error fetching hospitality guides:', error);
      toast.error('Failed to load hospitality guides');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const saveGuideToSupabase = async (recipe: Recipe, showToast: boolean = true) => {
    try {
      console.log("Starting saveGuideToSupabase with guide:", recipe);
      
      if (!recipe.id) {
        recipe.id = uuidv4();
        console.log("Generated new guide ID:", recipe.id);
      }
      
      const guideData = {
        id: recipe.id,
        name: recipe.name || 'Unnamed Guide',
        category: recipe.category || 'Uncategorized',
        time_to_complete_minutes: recipe.timeToTableMinutes || 0,
        detailed_procedure: recipe.method || '',
        required_resources: recipe.miseEnPlace || '',
        image_url: recipe.imageUrl || '',
        steps: recipe.ingredients || [],
        archived: recipe.archived || false,
        posted_to_noticeboard: recipe.postedToNoticeboard || false
      };
      
      console.log("Guide data formatted for Supabase:", guideData);

      const { error: upsertError } = await supabase
        .from('hospitality_guides')
        .upsert([guideData]);
      
      if (upsertError) {
        console.error("Error upserting guide:", upsertError);
        throw upsertError;
      }
      
      console.log("Guide saved successfully with ID:", recipe.id);
      
      if (showToast) {
        toast.success('Hospitality guide saved successfully');
      }
      
      console.log("Guide saved successfully");
      return true;
    } catch (error) {
      console.error('Error saving guide:', error);
      if (showToast) {
        toast.error('Failed to save hospitality guide');
      }
      throw error;
    }
  };

  const deleteGuideFromSupabase = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('hospitality_guides')
        .delete()
        .eq('id', recipeId);
        
      if (error) {
        console.error('Error deleting guide:', error);
        throw error;
      }
      
      toast.success('Hospitality guide deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting guide:', error);
      toast.error('Failed to delete hospitality guide');
      throw error;
    }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      if (filters.searchTerm && !recipe.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.category && filters.category !== "all_categories" && recipe.category !== filters.category) {
        return false;
      }
      if (selectedLetter && !recipe.name.toUpperCase().startsWith(selectedLetter)) {
        return false;
      }
      if (filters.status === "live" && recipe.archived) {
        return false;
      }
      if (filters.status === "archived" && !recipe.archived) {
        return false;
      }
      return true;
    });
  }, [recipes, filters, selectedLetter]);

  const handleFilterChange = (newFilters: RecipeFilterOptions) => {
    setFilters(newFilters);
  };

  const handleLetterSelect = (letter: string | null) => {
    setSelectedLetter(letter);
    setFilters({
      ...filters,
      letter
    });
  };

  const handleAddRecipe = () => {
    setEditingRecipe(undefined);
    setFormOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormOpen(true);
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      console.log("handleSaveRecipe called with:", recipe);
      
      if (!recipe.id) {
        recipe.id = uuidv4();
        console.log("Generated new guide ID in handleSaveRecipe:", recipe.id);
      }
      
      await saveGuideToSupabase(recipe);
      
      if (editingRecipe) {
        setRecipes(recipes.map(r => r.id === recipe.id ? recipe : r));
      } else {
        setRecipes(prevRecipes => [...prevRecipes, recipe]);
      }
      
      setFormOpen(false);
      setEditingRecipe(undefined);
      
      console.log("Refreshing guides from database after save");
      await fetchRecipes();
      
      console.log("Guide form closed, state updated");
    } catch (error) {
      console.error('Error in handleSaveRecipe:', error);
      toast.error('Failed to save hospitality guide. Please try again.');
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      await deleteGuideFromSupabase(recipe.id);
      setRecipes(recipes.filter(r => r.id !== recipe.id));
      setViewingRecipe(undefined);
    } catch (error) {
      console.error('Error in handleDeleteRecipe:', error);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setViewingRecipe(recipe);
  };

  const handleToggleNoticeboard = async (recipe: Recipe) => {
    try {
      const updatedRecipe = {
        ...recipe,
        postedToNoticeboard: !recipe.postedToNoticeboard
      };

      const { error } = await supabase
        .from('hospitality_guides')
        .update({ posted_to_noticeboard: updatedRecipe.postedToNoticeboard })
        .eq('id', recipe.id);

      if (error) throw error;

      setRecipes(recipes.map(r => 
        r.id === recipe.id ? updatedRecipe : r
      ));

      toast.success(
        updatedRecipe.postedToNoticeboard 
          ? 'Guide posted to Noticeboard' 
          : 'Guide removed from Noticeboard'
      );
    } catch (error) {
      console.error('Error toggling noticeboard status:', error);
      toast.error('Failed to update noticeboard status');
    }
  };

  // Add the missing toggle functions
  const toggleMaximized = () => {
    setSidebarMaximized(!sidebarMaximized);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const DesktopSidebar = () => <div className={`border-r border-gray-200 bg-white transition-all duration-300 h-full overflow-auto relative ${sidebarMaximized ? 'w-120' : sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
    {sidebarOpen && (
      <div className="p-4">
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100 mr-1" onClick={toggleMaximized} title={sidebarMaximized ? "Restore sidebar" : "Maximize sidebar"}>
            {sidebarMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleSidebar} title="Collapse sidebar" className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-slate-900">
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>
        <RecipeFilters moduleType="hospitality" categories={hospitalityCategoryObjects} allergens={[]} filters={filters} onFilterChange={handleFilterChange} onLetterSelect={handleLetterSelect} selectedLetter={selectedLetter} />
      </div>
    )}
  </div>;

  const MobileSidebar = () => <>
    <Button variant="outline" size="icon" className="fixed left-4 top-20 z-40 md:hidden shadow-md bg-white" onClick={() => setSidebarOpen(true)}>
      <PanelLeft className="h-4 w-4" />
    </Button>

    <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <DrawerContent className="max-h-[90vh]">
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          <RecipeFilters moduleType="hospitality" categories={hospitalityCategoryObjects} allergens={[]} filters={filters} onFilterChange={handleFilterChange} onLetterSelect={handleLetterSelect} selectedLetter={selectedLetter} />
        </div>
      </DrawerContent>
    </Drawer>
  </>;

  return <div className="flex w-full min-h-svh bg-background">
    {!sidebarOpen && !isMobile && (
      <div className="fixed left-[288px] top-[86px] z-40 flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="shadow-md bg-white" 
          onClick={() => {
            setSidebarOpen(true);
            setSidebarMaximized(false);
          }}
          title="Open sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="shadow-md bg-white"
          onClick={() => {
            setSidebarOpen(true);
            setSidebarMaximized(!sidebarMaximized);
          }}
          title={sidebarMaximized ? "Restore sidebar" : "Maximize sidebar"}
        >
          {sidebarMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    )}
    
    {isMobile ? <MobileSidebar /> : <DesktopSidebar />}
    
    <div className="flex-1 relative">
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Hospitality Bible</h1>
            <p className="text-muted-foreground">Service guides, standards and training materials</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Hospitality Guide
          </Button>
        </div>
        
        <div className="w-full">
          {loading ? <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading hospitality guides...</p>
              </div>
            </div> : filteredRecipes.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={{...recipe, moduleType: 'hospitality'}}
                  onClick={() => setViewingRecipe(recipe)}
                  onToggleNoticeboard={() => handleToggleNoticeboard(recipe)}
                />
              ))}
            </div> : <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-gray-500">No hospitality guides match your filters</p>
              <Button variant="outline" onClick={() => {
                setFilters({
                  searchTerm: "",
                  category: "all_categories",
                  allergens: [],
                  isVegan: null,
                  isVegetarian: null,
                  isGlutenFree: null,
                  letter: null,
                  status: "live"
                });
                setSelectedLetter(null);
              }} className="mt-4">
                Clear Filters
              </Button>
            </div>}
        </div>
      </div>
      
      {formOpen && <RecipeFormDialog 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        onSave={handleSaveRecipe} 
        recipe={editingRecipe} 
        moduleType="hospitality" 
        categories={hospitalityCategoryObjects} 
        allergens={[]} 
      />}
      
      {viewingRecipe && <RecipeDetailDialog 
        open={!!viewingRecipe} 
        onClose={() => setViewingRecipe(undefined)} 
        recipe={{...viewingRecipe, moduleType: 'hospitality'}} 
        onEdit={() => {
          setViewingRecipe(undefined);
          setEditingRecipe(viewingRecipe);
          setFormOpen(true);
        }} 
        onDelete={handleDeleteRecipe} 
      />}
    </div>
  </div>;
};

export default HospitalityBible;
