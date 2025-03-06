import React from 'react';
import { useState } from 'react'

function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('user')

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin(selectedRole)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Select Role:
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="user">Regular User</option>
                <option value="admin">Administrator</option>
              </select>
            </label>
          </div>
          <button type="submit" className="login-button">
            Log In
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login;