import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import SignUp from './pages/SignUp.jsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom";


const router = createBrowserRouter([
    {path: "/", element: <App/>},
    {path: "/signup", element: <SignUp/>}
    // Add routes here
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
