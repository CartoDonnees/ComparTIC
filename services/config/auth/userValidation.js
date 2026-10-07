

export const isValidEmail = (email) => {
  const _email = email.replace(/\s+/g, '');
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(_email);
};

// Fonction pour valider la complexité du mot de passe
export const isValidPassword = (password) => {
  // Regex: Au moins 8 caractères, dont au moins une majuscule
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};