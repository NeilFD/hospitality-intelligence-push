import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeFilters from "@/components/recipes/RecipeFilters";
import RecipeFormDialog from "@/components/recipes/RecipeFormDialog";
import RecipeDetailDialog from "@/components/recipes/RecipeDetailDialog";
import { MenuCategory } from "@/types/recipe-types";
import { HospitalityGuide, HospitalityStep, HospitalityFilterOptions } from "@/types/hospitality-types";
import { Plus, PanelLeft, ChevronLeft, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { v4 as uuidv4 } from 'uuid';
import HospitalityGuideFormDialog from "@/components/hospitality/HospitalityGuideFormDialog";
import HospitalityGuideDetailDialog from "@/components/hospitality/HospitalityGuideDetailDialog";

const HospitalityBible: React.FC = () => {
  const [guides, setGuides] = useState<HospitalityGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<HospitalityFilterOptions>({
    searchTerm: "",
    category: "all_categories",
    letter: null,
    status: "live"
  });
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<HospitalityGuide | undefined>(undefined);
  const [viewingGuide, setViewingGuide] = useState<HospitalityGuide | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMaximized, setSidebarMaximized] = useState(false);
  const isMobile = useIsMobile();

  const hospitalityCategories: MenuCategory[] = [
    { id: "h1", name: "Customer Service", moduleType: "hospitality" },
    { id: "h2", name: "Complaint Handling", moduleType: "hospitality" },
    { id: "h3", name: "Table Service", moduleType: "hospitality" },
    { id: "h4", name: "Bar Service", moduleType: "hospitality" },
    { id: "h5", name: "Opening Procedures", moduleType: "hospitality" },
    { id: "h6", name: "Closing Procedures", moduleType: "hospitality" },
    { id: "h7", name: "Till Operations", moduleType: "hospitality" },
    { id: "h8", name: "Hosting", moduleType: "hospitality" },
    { id: "h9", name: "Special Events", moduleType: "hospitality" },
    { id: "h10", name: "Staff Training", moduleType: "hospitality" }
  ];

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
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
      
      const mappedGuides: HospitalityGuide[] = (guidesData || []).map(guide => {
        return {
          id: guide.id,
          name: guide.name,
          category: guide.category,
          description: guide.description || '',
          timeToCompleteMinutes: guide.time_to_complete_minutes || 0,
          steps: Array.isArray(guide.steps) ? guide.steps : [],
          detailedProcedure: guide.detailed_procedure || '',
          imageUrl: guide.image_url,
          createdAt: new Date(guide.created_at),
          updatedAt: new Date(guide.updated_at),
          archived: guide.archived || false,
          postedToNoticeboard: guide.posted_to_noticeboard || false
        };
      });
      
      setGuides(mappedGuides);
    } catch (error) {
      console.error('Error fetching hospitality guides:', error);
      toast.error('Failed to load hospitality guides');
      setGuides([]);
    } finally {
      setLoading(false);
    }
  };

  const saveGuideToSupabase = async (guide: HospitalityGuide, showToast: boolean = true) => {
    try {
      console.log("Starting saveGuideToSupabase with guide:", guide);
      
      if (!guide.id) {
        guide.id = uuidv4();
        console.log("Generated new guide ID:", guide.id);
      }
      
      const guideData = {
        id: guide.id,
        name: guide.name || 'Unnamed Guide',
        category: guide.category || 'Uncategorized',
        description: guide.description || '',
        time_to_complete_minutes: guide.timeToCompleteMinutes || 0,
        steps: guide.steps || [],
        detailed_procedure: guide.detailedProcedure || '',
        image_url: guide.imageUrl || '',
        archived: guide.archived || false,
        posted_to_noticeboard: guide.postedToNoticeboard || false
      };
      
      console.log("Guide data formatted for Supabase:", guideData);

      const { error: upsertError } = await supabase
        .from('hospitality_guides')
        .upsert([guideData]);
      
      if (upsertError) {
        console.error("Error upserting guide:", upsertError);
        throw upsertError;
      }
      
      console.log("Guide saved successfully with ID:", guide.id);
      
      if (showToast) {
        toast.success('Hospitality guide saved successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving guide:', error);
      if (showToast) {
        toast.error('Failed to save hospitality guide');
      }
      throw error;
    }
  };

  const deleteGuideFromSupabase = async (guideId: string) => {
    try {
      const { error } = await supabase
        .from('hospitality_guides')
        .delete()
        .eq('id', guideId);
        
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

  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      if (filters.searchTerm && !guide.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.category && filters.category !== "all_categories" && guide.category !== filters.category) {
        return false;
      }
      if (selectedLetter && !guide.name.toUpperCase().startsWith(selectedLetter)) {
        return false;
      }
      if (filters.status === "live" && guide.archived) {
        return false;
      }
      if (filters.status === "archived" && !guide.archived) {
        return false;
      }
      return true;
    });
  }, [guides, filters, selectedLetter]);

  const handleFilterChange = (newFilters: HospitalityFilterOptions) => {
    setFilters(newFilters);
  };

  const handleLetterSelect = (letter: string | null) => {
    setSelectedLetter(letter);
    setFilters({
      ...filters,
      letter
    });
  };

  const handleAddGuide = () => {
    setEditingGuide(undefined);
    setFormOpen(true);
  };

  const handleEditGuide = (guide: HospitalityGuide) => {
    setEditingGuide(guide);
    setFormOpen(true);
  };

  const handleSaveGuide = async (guide: HospitalityGuide) => {
    try {
      console.log("handleSaveGuide called with:", guide);
      
      if (!guide.id) {
        guide.id = uuidv4();
        console.log("Generated new guide ID in handleSaveGuide:", guide.id);
      }
      
      await saveGuideToSupabase(guide);
      
      if (editingGuide) {
        setGuides(guides.map(g => g.id === guide.id ? guide : g));
      } else {
        setGuides(prevGuides => [...prevGuides, guide]);
      }
      
      setFormOpen(false);
      setEditingGuide(undefined);
      
      console.log("Refreshing guides from database after save");
      await fetchGuides();
      
      console.log("Guide form closed, state updated");
    } catch (error) {
      console.error('Error in handleSaveGuide:', error);
      toast.error('Failed to save hospitality guide. Please try again.');
    }
  };

  const handleDeleteGuide = async (guide: HospitalityGuide) => {
    try {
      await deleteGuideFromSupabase(guide.id);
      setGuides(guides.filter(g => g.id !== guide.id));
      setViewingGuide(undefined);
    } catch (error) {
      console.error('Error in handleDeleteGuide:', error);
    }
  };

  const handleViewGuide = (guide: HospitalityGuide) => {
    setViewingGuide(guide);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMaximized = () => {
    setSidebarMaximized(!sidebarMaximized);
  };

  const handleToggleNoticeboard = async (guide: HospitalityGuide) => {
    try {
      const updatedGuide = {
        ...guide,
        postedToNoticeboard: !guide.postedToNoticeboard
      };

      const { error } = await supabase
        .from('hospitality_guides')
        .update({ posted_to_noticeboard: updatedGuide.postedToNoticeboard })
        .eq('id', guide.id);

      if (error) throw error;

      setGuides(guides.map(g => 
        g.id === guide.id ? updatedGuide : g
      ));

      toast.success(
        updatedGuide.postedToNoticeboard 
          ? 'Guide posted to Noticeboard' 
          : 'Guide removed from Noticeboard'
      );
    } catch (error) {
      console.error('Error toggling noticeboard status:', error);
      toast.error('Failed to update noticeboard status');
    }
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
        <RecipeFilters 
          moduleType="hospitality" 
          categories={hospitalityCategories} 
          allergens={[]} 
          filters={filters as any} 
          onFilterChange={handleFilterChange} 
          onLetterSelect={handleLetterSelect} 
          selectedLetter={selectedLetter} 
        />
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
          <RecipeFilters 
            moduleType="hospitality" 
            categories={hospitalityCategories} 
            allergens={[]} 
            filters={filters as any} 
            onFilterChange={handleFilterChange} 
            onLetterSelect={handleLetterSelect} 
            selectedLetter={selectedLetter} 
          />
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
          <Button onClick={handleAddGuide} className="mt-4 md:mt-0">
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
            </div> : filteredGuides.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGuides.map(guide => (
                <RecipeCard 
                  key={guide.id} 
                  recipe={{
                    ...guide,
                    moduleType: 'hospitality',
                    allergens: [],
                    isVegan: false,
                    isVegetarian: false,
                    isGlutenFree: false,
                    timeToTableMinutes: guide.timeToCompleteMinutes,
                    ingredients: guide.steps.map(step => ({
                      id: step.id,
                      name: step.name,
                      amount: 0,
                      unit: '',
                      costPerUnit: 0,
                      totalCost: 0
                    })),
                    method: guide.detailedProcedure,
                    costing: {
                      totalRecipeCost: 0,
                      suggestedSellingPrice: 0,
                      actualMenuPrice: 0,
                      grossProfitPercentage: 0
                    }
                  }}
                  onClick={() => handleViewGuide(guide)}
                  onToggleNoticeboard={() => handleToggleNoticeboard(guide)}
                />
              ))}
            </div> : <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-gray-500">No hospitality guides match your filters</p>
              <Button variant="outline" onClick={() => {
                setFilters({
                  searchTerm: "",
                  category: "all_categories",
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
      
      {formOpen && (
        <HospitalityGuideFormDialog 
          open={formOpen} 
          onClose={() => setFormOpen(false)} 
          onSave={handleSaveGuide} 
          guide={editingGuide} 
          categories={hospitalityCategories} 
        />
      )}
      
      {viewingGuide && (
        <HospitalityGuideDetailDialog 
          open={!!viewingGuide} 
          onClose={() => setViewingGuide(undefined)} 
          guide={viewingGuide} 
          onEdit={() => {
            setViewingGuide(undefined);
            setEditingGuide(viewingGuide);
            setFormOpen(true);
          }} 
          onDelete={handleDeleteGuide} 
        />
      )}
    </div>
  </div>;
};

export default HospitalityBible;
