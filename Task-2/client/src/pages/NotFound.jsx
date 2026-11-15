import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page py-24 text-center">
      <p className="text-7xl font-light text-line-strong select-none" aria-hidden="true">404</p>
      <h1 className="text-xl font-semibold tracking-tight mt-4">Page not found</h1>
      <p className="text-sm text-muted mt-1">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
