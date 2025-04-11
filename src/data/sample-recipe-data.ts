
import { Recipe, MenuCategory, AllergenType } from '@/types/recipe-types';

export const allergenTypes: AllergenType[] = [
  { id: '1', name: 'Gluten' },
  { id: '2', name: 'Crustaceans' },
  { id: '3', name: 'Eggs' },
  { id: '4', name: 'Fish' },
  { id: '5', name: 'Peanuts' },
  { id: '6', name: 'Soybeans' },
  { id: '7', name: 'Milk' },
  { id: '8', name: 'Nuts' },
  { id: '9', name: 'Celery' },
  { id: '10', name: 'Mustard' },
  { id: '11', name: 'Sesame Seeds' },
  { id: '12', name: 'Sulfites' },
  { id: '13', name: 'Lupin' },
  { id: '14', name: 'Molluscs' }
];

export const menuCategories: MenuCategory[] = [
  { id: '1', name: 'Starters', moduleType: 'food' },
  { id: '2', name: 'Mains', moduleType: 'food' },
  { id: '3', name: 'Desserts', moduleType: 'food' },
  { id: '4', name: 'Sides', moduleType: 'food' },
  { id: '5', name: 'Specials', moduleType: 'food' },
  { id: '6', name: 'Cocktails', moduleType: 'beverage' },
  { id: '7', name: 'Beers', moduleType: 'beverage' },
  { id: '8', name: 'Wines', moduleType: 'beverage' },
  { id: '9', name: 'Spirits', moduleType: 'beverage' },
  { id: '10', name: 'Mocktails', moduleType: 'beverage' }
];

// Removed sample food and beverage recipes
export const sampleFoodRecipes: Recipe[] = [];
export const sampleBeverageRecipes: Recipe[] = [];
