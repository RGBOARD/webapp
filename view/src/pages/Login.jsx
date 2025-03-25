import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import LoginForm from '../components/LoginForm.jsx';
import '../App.css';

export default function SignUp(){

    return(<>
        <Navbar/>
        <LoginForm/>
        </>)
}