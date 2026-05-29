import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Categories from './pages/Categories';
import PostDetail from './pages/PostDetail';
import Editor from './pages/Editor';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import './index.css';

function AppInner() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar onSearch={setSearchQuery} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"            element={<Home searchQuery={searchQuery} />} />
          <Route path="/categories"  element={<Categories />} />
          <Route path="/post/:id"    element={<PostDetail />} />
          <Route path="/write"       element={<Editor />} />
          <Route path="/write/:id"   element={<Editor />} />
          <Route path="/signin"      element={<SignIn />} />
          <Route path="/signup"      element={<SignUp />} />
          <Route path="/admin"       element={<Admin />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/user/:id"    element={<UserProfile />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
