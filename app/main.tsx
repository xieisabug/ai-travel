import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './app.css';

// 页面组件
import Home from './routes/home';
import Worlds from './routes/worlds';
import WorldGame from './routes/world-game';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/worlds" element={<Worlds />} />
                <Route path="/world-game" element={<WorldGame />} />
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
