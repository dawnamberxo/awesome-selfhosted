import React, { useState, useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import CameraUpload from './pages/CameraUpload';
import AnalysisView from './pages/AnalysisView';
import GuidedCleaning from './pages/GuidedCleaning';
import ItemSorting from './pages/ItemSorting';
import CelebrationView from './pages/CelebrationView';

const API = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [page, setPage] = useState('landing');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Space' }),
      });
      const data = await res.json();
      setSession(data);
      setPage('camera');
    } catch (err) {
      setError('Oops, something went wrong. Let\'s try again!');
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeSpace = useCallback(async (imageBase64) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/analyze-space`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          image_base64: imageBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setSession(data);
      setPage('analysis');
    } catch (err) {
      setError('Oops, let\'s try that photo again. Make sure the space is well-lit!');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const generateTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/generate-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Task generation failed');
      setSession(data);
      setPage('cleaning');
    } catch (err) {
      setError('Oops, let\'s try generating those tasks again!');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const completeTask = useCallback(async (taskId) => {
    try {
      const res = await fetch(`${API}/api/sessions/${session.session_id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Update failed');
      setSession(data);
      if (data.status === 'completed') {
        setPage('celebration');
      }
    } catch (err) {
      setError('Oops, let\'s try that again!');
    }
  }, [session]);

  const identifyItems = useCallback(async (imageBase64) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/identify-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          image_base64: imageBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Item identification failed');
      setSession(data);
      setPage('sorting');
    } catch (err) {
      setError('Oops, let\'s try that photo again!');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const sortItem = useCallback(async (itemId, decision) => {
    try {
      const res = await fetch(`${API}/api/sessions/${session.session_id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Sort failed');
      setSession(data);
    } catch (err) {
      setError('Oops, let\'s try that again!');
    }
  }, [session]);

  const startOver = useCallback(() => {
    setSession(null);
    setPage('landing');
    setError(null);
  }, []);

  return (
    <div className="min-h-screen mesh-bg" data-testid="app-container">
      {error && (
        <div 
          data-testid="error-banner"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-blush/30 text-bark px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-slide-up"
        >
          <span className="text-blush text-lg">~</span>
          <span className="font-body text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-mist hover:text-bark ml-2 text-lg">&times;</button>
        </div>
      )}

      {page === 'landing' && (
        <LandingPage onStart={createSession} loading={loading} />
      )}
      {page === 'camera' && (
        <CameraUpload 
          onAnalyze={analyzeSpace} 
          onIdentifyItems={identifyItems}
          loading={loading} 
          onBack={() => setPage('landing')} 
        />
      )}
      {page === 'analysis' && (
        <AnalysisView 
          session={session} 
          onStartCleaning={generateTasks} 
          onSortItems={() => setPage('camera')}
          loading={loading}
          onBack={() => setPage('camera')} 
        />
      )}
      {page === 'cleaning' && (
        <GuidedCleaning 
          session={session} 
          onCompleteTask={completeTask} 
          onSortItems={() => setPage('camera')}
          onBack={() => setPage('analysis')} 
        />
      )}
      {page === 'sorting' && (
        <ItemSorting 
          session={session} 
          onSortItem={sortItem}
          onDone={() => session.tasks?.length > 0 ? setPage('cleaning') : setPage('celebration')}
          onBack={() => setPage('cleaning')} 
        />
      )}
      {page === 'celebration' && (
        <CelebrationView 
          session={session} 
          onStartOver={startOver}
          onContinue={() => setPage('camera')} 
        />
      )}
    </div>
  );
}

export default App;
