import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const admin = localStorage.getItem('adminUser');
  
  if (!admin) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

export default ProtectedRoute;