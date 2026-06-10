export const useGoogleSignIn = () => ({
  signIn: async () => {
    throw new Error('Google Sign-In is only available in the mobile app.');
  },
  isSigningIn: false,
  isAvailable: false,
});
