
  const handleScoreChange = (category: string, value: number[]) => {
    setScores((prevScores) => {
      // Create a new scores object with the updated value
      return { ...prevScores, [category]: value[0] };
    });
  };
