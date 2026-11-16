
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { setLogoutHandler } from '@/core/api/axiosClient';
import AppInitializer from "@/components/AppInitializer/AppInitializer";
import useAuthStore from "@/app/store/authStore";

useAuthStore.getState().hydrate();
setLogoutHandler(() => {
  useAuthStore.getState().logout();
  window.location.href = '/login';
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppInitializer>
        <App />
    </AppInitializer>
  </StrictMode>
);