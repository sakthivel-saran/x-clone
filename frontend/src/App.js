import React from 'react'
import {Routes, Route, Link} from 'react-router-dom'
import HomePage from './pages/auth/home/HomePage.js'
import LoginPage from './pages/auth/login/LoginPage.js'
import SignUpPage from './pages/auth/signup/SignUpPage.js'
import Sidebar from "./components/common/sidebar.js";
import RightPanel from './components/common/RightPanel.js'
import NotificationPage from './pages/auth/notification/NotificationPage.js'
import ProfilePage from './pages/auth/profile/ProfilePage.js'
import { Toaster } from "react-hot-toast";
import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from './constant/url.js';
import LoadingSpinner from './components/common/LoadingSpinner.js';
import { Navigate } from 'react-router-dom';

const App = () => {
  const {data: authUser, isLoading} = useQuery({
  queryKey: ["authUser"],
  queryFn: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "content-Type": "application/json"
        }
      });
      const data = await res.json();
      if(data.error){
        return null
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch user");
      }
      console.log("authUser:", data);
      return data;
    }
    catch (error) {
      throw error;
    }
    
  },
  retry: false,
    
  })
  console.log(authUser)
 

  return (
    <div className='flex max-w-6xl mx-auto'>

     {authUser && <Sidebar />} 
      <Routes>
        <Route path="/" element={authUser ?<HomePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/notifications" element={authUser ?<NotificationPage /> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={authUser ?<ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
      {authUser && <RightPanel />}
      <Toaster />
    </div>
  )
}

export default App
