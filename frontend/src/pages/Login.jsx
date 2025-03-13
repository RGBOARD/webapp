import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

function Login() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>
        <button 
          onClick={() => loginWithRedirect()} 
          className="login-button"
        >
          Log In with Auth0
        </button>
      </div>
    </div>
  );
}

export default Login;