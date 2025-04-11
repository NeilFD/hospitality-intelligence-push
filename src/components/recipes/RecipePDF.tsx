
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Recipe } from '@/types/recipe-types';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    flexDirection: 'column',
    backgroundColor: '#ffffff'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  header: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  subheader: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  category: {
    fontSize: 12,
    marginBottom: 10,
    color: '#666',
    textAlign: 'center'
  },
  text: {
    fontSize: 10,
    marginBottom: 5
  },
  image: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  column: {
    flexDirection: 'column',
    width: '50%',
    padding: 5
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 2
  },
  ingredientName: {
    width: '60%',
    fontSize: 10
  },
  ingredientAmount: {
    width: '15%',
    fontSize: 10
  },
  ingredientUnit: {
    width: '15%',
    fontSize: 10
  },
  ingredientCost: {
    width: '10%',
    fontSize: 10,
    textAlign: 'right'
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10
  },
  footer: {
    fontSize: 8,
    textAlign: 'center',
    color: '#888',
    marginTop: 25
  }
});

interface RecipePDFProps {
  recipe: Recipe;
}

const RecipePDF: React.FC<RecipePDFProps> = ({ recipe }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{recipe.name}</Text>
        <Text style={styles.category}>{recipe.category}</Text>
        
        {recipe.imageUrl && (
          <Image src={recipe.imageUrl} style={styles.image} />
        )}
        
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.subheader}>Recipe Information</Text>
            <Text style={styles.text}>Allergens: {recipe.allergens.join(', ')}</Text>
            <Text style={styles.text}>Vegetarian: {recipe.isVegetarian ? 'Yes' : 'No'}</Text>
            <Text style={styles.text}>Vegan: {recipe.isVegan ? 'Yes' : 'No'}</Text>
            <Text style={styles.text}>Gluten Free: {recipe.isGlutenFree ? 'Yes' : 'No'}</Text>
            <Text style={styles.text}>Time to Table: ~{recipe.timeToTableMinutes} mins</Text>
            <Text style={styles.text}>Recommended Upsell: {recipe.recommendedUpsell}</Text>
          </View>
          
          <View style={styles.column}>
            <Text style={styles.subheader}>Costing</Text>
            <Text style={styles.text}>Total Recipe Cost: £{recipe.costing.totalRecipeCost.toFixed(2)}</Text>
            <Text style={styles.text}>Suggested Selling Price: £{recipe.costing.suggestedSellingPrice.toFixed(2)}</Text>
            <Text style={styles.text}>Actual Menu Price: £{recipe.costing.actualMenuPrice.toFixed(2)}</Text>
            <Text style={styles.text}>GP %: {(recipe.costing.grossProfitPercentage * 100).toFixed(1)}%</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.section}>
          <Text style={styles.subheader}>Ingredients</Text>
          
          <View style={styles.ingredientRow}>
            <Text style={{...styles.ingredientName, fontWeight: 'bold'}}>Item</Text>
            <Text style={{...styles.ingredientAmount, fontWeight: 'bold'}}>Amount</Text>
            <Text style={{...styles.ingredientUnit, fontWeight: 'bold'}}>Unit</Text>
            <Text style={{...styles.ingredientCost, fontWeight: 'bold'}}>Cost</Text>
          </View>
          
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
              <Text style={styles.ingredientUnit}>{ingredient.unit}</Text>
              <Text style={styles.ingredientCost}>£{ingredient.totalCost.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.section}>
          <Text style={styles.subheader}>Method</Text>
          <Text style={styles.text}>{recipe.method}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.subheader}>Mise en Place</Text>
          <Text style={styles.text}>{recipe.miseEnPlace}</Text>
        </View>
        
        <Text style={styles.footer}>Generated on {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
};

export default RecipePDF;
