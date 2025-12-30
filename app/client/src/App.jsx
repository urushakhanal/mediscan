import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import HealthPage from './pages/HealthPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import SymptomCheckerPage from './pages/SymptomCheckerPage';

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-center" />
            <MainLayout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/health" element={<HealthPage />} />
                    <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route
                        path="*"
                        element={
                            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                                <h1 className="text-4xl font-bold text-white">Page not found</h1>
                                <a
                                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-5 py-2.5 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-400/30"
                                    href="/"
                                >
                                    Go home
                                </a>
                            </div>
                        }
                    />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}

export default App;
