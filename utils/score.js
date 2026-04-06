export const calculateScore = (feedback) => {
  return feedback.reduce((acc, f) => {
    const m = f.match(/\d+/);
    return acc + (m ? parseInt(m[0]) : 0);
  }, 0);
};
