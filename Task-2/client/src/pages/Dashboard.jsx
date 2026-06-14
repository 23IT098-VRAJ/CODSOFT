import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar, { NAVBAR_HEIGHT } from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const SkeletonCard = () => (
  <div className="animate-pulse bg-[#ECEAE7] rounded-xl h-48 border border-[#E5E2DC]" />
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects');
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const activeCount = projects.filter((p) => p.status === 'Active').length;
  const completedCount = projects.filter((p) => p.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-[#F7F6F4]">
      <Navbar />
      <main className={NAVBAR_HEIGHT}>
        {/* Header */}
        <div className="px-6 py-8 border-b border-[#E5E2DC] bg-white">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1917]">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-[#8A8680] mt-1">
            You have {activeCount} active project{activeCount !== 1 ? 's' : ''}
          </p>

          {/* Quick stats */}
          <div className="flex gap-4 mt-6">
            {[
              { label: 'Total Projects', value: projects.length },
              { label: 'Active', value: activeCount },
              { label: 'Completed', value: completedCount },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-[#E5E2DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <p className="text-2xl font-light tabular-nums text-[#1A1917]">{stat.value}</p>
                <p className="text-[10px] font-medium tracking-widest uppercase text-[#8A8680] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projects grid */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold tracking-tight text-[#1A1917]">Your Projects</h2>
            <button
              onClick={() => navigate('/projects/new')}
              className="border border-[#1A1917] text-[#1A1917] text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-[#1A1917] hover:text-white transition-all duration-150"
            >
              + New Project
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white border border-dashed border-[#D4D0C9] rounded-xl h-48 flex flex-col items-center justify-center text-center">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm font-medium text-[#4B4845]">No projects yet</p>
              <p className="text-xs text-[#8A8680] mt-1">Get started by creating your first project</p>
              <button
                onClick={() => navigate('/projects/new')}
                className="mt-4 bg-[#1A1917] text-white hover:bg-[#2E2C2A] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Create your first project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
