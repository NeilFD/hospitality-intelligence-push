
import React, { ReactNode } from 'react';
import { Recipe } from '@/types/recipe-types';

interface RecipePDFProps {
  recipe: Recipe;
  children?: ReactNode;
}

const RecipePDF: React.FC<RecipePDFProps> = ({ recipe, children }) => {
  return (
    <>
      {children}
    </>
  );
};

export default RecipePDF;
