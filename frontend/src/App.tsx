import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopBar from './components/layout/TopBar';
import AnalysisDashboard from './pages/AnalysisDashboard';
import ModelMetrics from './pages/ModelMetrics';
import Dataset from './pages/Dataset';
import Architecture from './pages/Architecture';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <TopBar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<AnalysisDashboard />} />
            <Route path="/metrics" element={<ModelMetrics />} />
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
