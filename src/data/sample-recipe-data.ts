
import { Recipe, MenuCategory, AllergenType } from '@/types/recipe-types';
import { v4 as uuidv4 } from 'uuid';

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

export const sampleFoodRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: 'Classic Beef Burger',
    category: 'Mains',
    allergens: ['Gluten', 'Eggs', 'Milk'],
    isVegan: false,
    isVegetarian: false,
    isGlutenFree: false,
    recommendedUpsell: 'Add cheese and bacon for £2.50',
    timeToTableMinutes: 15,
    miseEnPlace: 'Prepare burger patties, slice tomatoes and onions, toast buns',
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: [
      { id: uuidv4(), name: 'Beef Mince (20% fat)', amount: 200, unit: 'g', costPerUnit: 0.01, totalCost: 2.0 },
      { id: uuidv4(), name: 'Burger Bun', amount: 1, unit: 'pcs', costPerUnit: 0.4, totalCost: 0.4 },
      { id: uuidv4(), name: 'Tomato', amount: 50, unit: 'g', costPerUnit: 0.003, totalCost: 0.15 },
      { id: uuidv4(), name: 'Lettuce', amount: 30, unit: 'g', costPerUnit: 0.002, totalCost: 0.06 },
      { id: uuidv4(), name: 'Red Onion', amount: 30, unit: 'g', costPerUnit: 0.002, totalCost: 0.06 },
      { id: uuidv4(), name: 'Mayo', amount: 20, unit: 'ml', costPerUnit: 0.005, totalCost: 0.1 },
      { id: uuidv4(), name: 'Ketchup', amount: 20, unit: 'ml', costPerUnit: 0.004, totalCost: 0.08 }
    ],
    method: '1. Season the beef mince with salt and pepper\n2. Form into a patty and cook on a hot grill for 4-5 minutes each side\n3. Toast the bun\n4. Assemble with lettuce, tomato, onion on the bottom, patty in the middle, and condiments on top',
    costing: {
      totalRecipeCost: 2.85,
      suggestedSellingPrice: 11.4,
      actualMenuPrice: 10.95,
      grossProfitPercentage: 0.7396
    },
    moduleType: 'food'
  },
  {
    id: uuidv4(),
    name: 'Mushroom Risotto',
    category: 'Mains',
    allergens: ['Milk'],
    isVegan: false,
    isVegetarian: true,
    isGlutenFree: true,
    recommendedUpsell: 'Add truffle oil drizzle for £1.50',
    timeToTableMinutes: 25,
    miseEnPlace: 'Prep mushroom stock, dice onions, slice mushrooms, grate parmesan',
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: [
      { id: uuidv4(), name: 'Arborio Rice', amount: 120, unit: 'g', costPerUnit: 0.004, totalCost: 0.48 },
      { id: uuidv4(), name: 'Mixed Mushrooms', amount: 100, unit: 'g', costPerUnit: 0.016, totalCost: 1.60 },
      { id: uuidv4(), name: 'White Onion', amount: 50, unit: 'g', costPerUnit: 0.002, totalCost: 0.10 },
      { id: uuidv4(), name: 'Garlic', amount: 10, unit: 'g', costPerUnit: 0.005, totalCost: 0.05 },
      { id: uuidv4(), name: 'Vegetable Stock', amount: 500, unit: 'ml', costPerUnit: 0.001, totalCost: 0.50 },
      { id: uuidv4(), name: 'White Wine', amount: 50, unit: 'ml', costPerUnit: 0.012, totalCost: 0.60 },
      { id: uuidv4(), name: 'Parmesan', amount: 30, unit: 'g', costPerUnit: 0.02, totalCost: 0.60 },
      { id: uuidv4(), name: 'Butter', amount: 20, unit: 'g', costPerUnit: 0.01, totalCost: 0.20 }
    ],
    method: '1. Sauté onions and garlic in butter\n2. Add rice and toast for 1-2 minutes\n3. Deglaze with white wine\n4. Add stock gradually, stirring continuously\n5. Cook mushrooms separately and add when rice is almost done\n6. Finish with butter and parmesan',
    costing: {
      totalRecipeCost: 4.13,
      suggestedSellingPrice: 16.52,
      actualMenuPrice: 14.95,
      grossProfitPercentage: 0.7243
    },
    moduleType: 'food'
  },
];

export const sampleBeverageRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: 'Classic Mojito',
    category: 'Cocktails',
    allergens: [],
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    recommendedUpsell: 'Upgrade to premium rum for £2',
    timeToTableMinutes: 5,
    miseEnPlace: 'Fresh mint, lime wedges, crushed ice, simple syrup',
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: [
      { id: uuidv4(), name: 'White Rum', amount: 50, unit: 'ml', costPerUnit: 0.04, totalCost: 2.00 },
      { id: uuidv4(), name: 'Fresh Lime Juice', amount: 25, unit: 'ml', costPerUnit: 0.02, totalCost: 0.50 },
      { id: uuidv4(), name: 'Sugar Syrup', amount: 20, unit: 'ml', costPerUnit: 0.01, totalCost: 0.20 },
      { id: uuidv4(), name: 'Fresh Mint', amount: 10, unit: 'g', costPerUnit: 0.05, totalCost: 0.50 },
      { id: uuidv4(), name: 'Soda Water', amount: 100, unit: 'ml', costPerUnit: 0.003, totalCost: 0.30 },
      { id: uuidv4(), name: 'Crushed Ice', amount: 100, unit: 'g', costPerUnit: 0.001, totalCost: 0.10 }
    ],
    method: '1. Muddle mint leaves with sugar syrup and lime juice\n2. Add rum and crushed ice\n3. Stir well\n4. Top with soda water\n5. Garnish with mint sprig and lime wedge',
    costing: {
      totalRecipeCost: 3.60,
      suggestedSellingPrice: 14.40,
      actualMenuPrice: 12.95,
      grossProfitPercentage: 0.7693
    },
    moduleType: 'beverage'
  },
  {
    id: uuidv4(),
    name: 'Espresso Martini',
    category: 'Cocktails',
    allergens: [],
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    recommendedUpsell: 'Premium vodka option for £2.50',
    timeToTableMinutes: 5,
    miseEnPlace: 'Fresh espresso, chilled martini glass',
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: [
      { id: uuidv4(), name: 'Vodka', amount: 50, unit: 'ml', costPerUnit: 0.04, totalCost: 2.00 },
      { id: uuidv4(), name: 'Coffee Liqueur', amount: 25, unit: 'ml', costPerUnit: 0.06, totalCost: 1.50 },
      { id: uuidv4(), name: 'Fresh Espresso', amount: 30, unit: 'ml', costPerUnit: 0.03, totalCost: 0.90 },
      { id: uuidv4(), name: 'Sugar Syrup', amount: 10, unit: 'ml', costPerUnit: 0.01, totalCost: 0.10 },
      { id: uuidv4(), name: 'Ice', amount: 100, unit: 'g', costPerUnit: 0.001, totalCost: 0.10 }
    ],
    method: '1. Add all ingredients to a cocktail shaker\n2. Shake vigorously with ice\n3. Double strain into a chilled martini glass\n4. Garnish with three coffee beans',
    costing: {
      totalRecipeCost: 4.60,
      suggestedSellingPrice: 18.40,
      actualMenuPrice: 13.95,
      grossProfitPercentage: 0.7240
    },
    moduleType: 'beverage'
  }
];
