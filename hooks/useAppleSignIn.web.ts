export const useAppleSignIn = () => ({
  signIn: async () => {
    throw new Error('Apple Sign-In is only available on iOS.');
  },
  isSigningIn: false,
  isAvailable: false,
});
