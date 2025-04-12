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
const RecipePDF: React.FC<RecipePDFProps> = ({
  recipe
}) => {
  return <Document>
      
    </Document>;
};
export default RecipePDF;