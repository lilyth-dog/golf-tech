import { Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import VideoAnalyzer3D from './pages/VideoAnalyzer3D';
import SwingAnalysis from './pages/SwingAnalysis';
import ProtectedRoute from './components/ProtectedRoute';

function Home() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Welcome to Golf Tech</h1>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                <Link to="/profile" className="p-8 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center text-center transform hover:-translate-y-1">
                    <span className="text-5xl mb-4">👤</span>
                    <h3 className="text-xl font-bold text-gray-800">My Profile</h3>
                    <p className="text-gray-500 mt-2">Manage body stats & handicap</p>
                </Link>
                <Link to="/analyze" className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center text-center text-white transform hover:-translate-y-1">
                    <span className="text-5xl mb-4">⛳</span>
                    <h3 className="text-xl font-bold">3D Swing Analysis</h3>
                    <p className="text-white/80 mt-2">Real-time AI pose coaching</p>
                </Link>
                <Link to="/swing-analysis" className="p-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center text-center text-white transform hover:-translate-y-1">
                    <span className="text-5xl mb-4">🎬</span>
                    <h3 className="text-xl font-bold">Video Analysis</h3>
                    <p className="text-white/80 mt-2">Upload video for AI feedback</p>
                </Link>
             </div>
        </div>
    )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/analyze" element={
        <ProtectedRoute>
          <VideoAnalyzer3D />
        </ProtectedRoute>
      } />
      <Route path="/swing-analysis" element={
        <ProtectedRoute>
          <SwingAnalysis />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
