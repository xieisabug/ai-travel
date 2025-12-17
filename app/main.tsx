import React from 'react';
import ReactDOM from 'react-dom/client';
// IMPORTANT: Client routing uses react-router-dom (DOM router). Avoid importing from "react-router" here.
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './app.css';

// 页面组件
import Home from './routes/home';
import WorldsLayout from './routes/worlds';
import WorldsIndexPage from './routes/worlds._index';
import WorldDetailPage from './routes/worlds.$worldId';
import WorldGame from './routes/world-game';
import AdminWorlds from './routes/admin/worlds';
import Profile from './routes/profile';

// 认证 Provider
import { AuthProvider } from './hooks/use-auth';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/worlds" element={<WorldsLayout />}>
                        <Route index element={<WorldsIndexPage />} />
                        <Route path=":worldId" element={<WorldDetailPage />} />
                    </Route>
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
