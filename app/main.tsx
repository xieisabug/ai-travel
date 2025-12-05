import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './app.css';

// 页面组件
import Home from './routes/home';
import Worlds from './routes/worlds';
import WorldGame from './routes/world-game';
import AdminWorlds from './routes/admin/worlds';
import Profile from './routes/profile';

// 认证 Provider
import { AuthProvider } from './hooks/useAuth';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/worlds" element={<Worlds />} />
                    <Route path="/world-game" element={<WorldGame />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin/worlds" element={<AdminWorlds />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
