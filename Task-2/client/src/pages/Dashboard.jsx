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
  <div className="animate-pulse bg-gray-200 rounded-2xl h-48" />
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className={NAVBAR_HEIGHT}>
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            You have {activeCount} active project{activeCount !== 1 ? 's' : ''}
          </p>

          {/* Quick stats */}
          <div className="flex gap-4 mt-6">
            {[
              { label: 'Total Projects', value: projects.length, color: 'text-indigo-600' },
              { label: 'Active', value: activeCount, color: 'text-blue-600' },
              { label: 'Completed', value: completedCount, color: 'text-green-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projects grid */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
            <button
              onClick={() => navigate('/projects/new')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              + New Project
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-gray-500 font-medium">No projects yet</p>
              <p className="text-sm text-gray-400 mt-1">Get started by creating your first project</p>
              <button
                onClick={() => navigate('/projects/new')}
                className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
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
