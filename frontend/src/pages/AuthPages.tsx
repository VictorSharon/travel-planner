import React from "react";
import { SignIn, SignUp } from "@clerk/react";

export const SignInPage: React.FC = () => (
  <div className="flex justify-center px-4 py-12">
    <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
  </div>
);

export const SignUpPage: React.FC = () => (
  <div className="flex justify-center px-4 py-12">
    <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
  </div>
);
