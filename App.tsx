import { useState, useEffect } from 'react';
import { Home, User, Camera, BarChart3 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ProfileSetup } from './components/ProfileSetup';
import { VideoCapture } from './components/VideoCapture';
import { AnalysisResults } from './components/AnalysisResults';

type Tab = 'home' | 'profile' | 'capture' | 'results';

interface UserProfile {
  height: number;
  weight: number;
  bmi: number;
  bodyFatPercentage: number;
  skeletalMuscleMass: number;
  boneMineralDensity: number;
  visceralFatLevel: number;
  bodyWaterPercentage: number;
  basalMetabolicRate: number;
  flexibility: number;
  experience: string;
}

interface AnalysisData {
  videoUrl: string;
  timestamp: number;
  recommendations: string[];
  posture: {
    stance: number;
    grip: number;
    backswing: number;
    impact: number;
  };
  aiInsights?: {
    shoulderAngle: number;
    hipRotation: number;
    kneeFlexion: number;
    spineAngle: number;
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisData | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('golfProfile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }

    const savedAnalysis = localStorage.getItem('latestAnalysis');
    if (savedAnalysis) {
      setLatestAnalysis(JSON.parse(savedAnalysis));
    }
  }, []);

  const handleProfileSave = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('golfProfile', JSON.stringify(profile));
    setActiveTab('home');
  };

  const handleAnalysisComplete = (analysis: AnalysisData) => {
    setLatestAnalysis(analysis);
    localStorage.setItem('latestAnalysis', JSON.stringify(analysis));
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-10 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">⛳</span>
            </div>
            <div>
              <h1 className="text-emerald-800 tracking-tight">골프 자세 분석</h1>
              <p className="text-xs text-emerald-600">AI 기반 스윙 개선 솔루션</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-28">
        {activeTab === 'home' && (
          <Dashboard
            userProfile={userProfile}
            latestAnalysis={latestAnalysis}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileSetup
            initialProfile={userProfile}
            onSave={handleProfileSave}
            onCancel={() => setActiveTab('home')}
          />
        )}
        {activeTab === 'capture' && (
          <VideoCapture
            userProfile={userProfile}
            onAnalysisComplete={handleAnalysisComplete}
            onCancel={() => setActiveTab('home')}
          />
        )}
        {activeTab === 'results' && (
          <AnalysisResults
            analysis={latestAnalysis}
            userProfile={userProfile}
            onBack={() => setActiveTab('home')}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl z-20">
        <div className="max-w-7xl mx-auto px-2">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center py-4 px-2 transition-all duration-300 relative group ${ 
                activeTab === 'home'
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              {activeTab === 'home' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-b-full" />
              )}
              <Home className={`w-6 h-6 transition-transform ${activeTab === 'home' ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="text-xs mt-1.5">홈</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center py-4 px-2 transition-all duration-300 relative group ${
                activeTab === 'profile'
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              {activeTab === 'profile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-b-full" />
              )}
              <User className={`w-6 h-6 transition-transform ${activeTab === 'profile' ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="text-xs mt-1.5">프로필</span>
            </button>
            <button
              onClick={() => setActiveTab('capture')}
              className={`flex flex-col items-center py-4 px-2 transition-all duration-300 relative group ${
                activeTab === 'capture'
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              {activeTab === 'capture' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-b-full" />
              )}
              <Camera className={`w-6 h-6 transition-transform ${activeTab === 'capture' ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="text-xs mt-1.5">촬영</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex flex-col items-center py-4 px-2 transition-all duration-300 relative group ${
                activeTab === 'results'
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              {activeTab === 'results' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-b-full" />
              )}
              <BarChart3 className={`w-6 h-6 transition-transform ${activeTab === 'results' ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="text-xs mt-1.5">분석</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}