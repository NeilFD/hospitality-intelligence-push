
import React, { ReactNode } from 'react';
import { Recipe } from '@/types/recipe-types';
import { HospitalityGuide } from '@/types/hospitality-types';

interface RecipePDFProps {
  recipe: Recipe | HospitalityGuide;
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
