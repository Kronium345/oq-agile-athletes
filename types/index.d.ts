
  interface Interview {
    id: string;
    role: string;
    level: string;
    questions: string[];
    techstack: string[];
    createdAt: string;
    userId: string;
    type: string;
    finalized: boolean;
  }
  
  
  interface User {
    name: string;
    email: string;
    id: string;
  }
  
  
  interface RouteParams {
    params: Promise<Record<string, string>>;
    searchParams: Promise<Record<string, string>>;
  }
  
  
  interface SignInParams {
    email: string;
    idToken: string;
  }
  
  interface SignUpParams {
    uid: string;
    name: string;
    email: string;
    password: string;
  }
  
  type FormType = "sign-in" | "sign-up";
  

  