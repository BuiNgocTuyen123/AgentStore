import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import KOLManagerLayout from './pages/SuperProfiles/KOLManagerLayout';
import SuperProfiles from './pages/SuperProfiles/SuperProfiles';
import AccountInventory from './pages/SuperProfiles/AccountInventory';
import SuperProfileDetail from './pages/SuperProfileDetail/SuperProfileDetail';
import TopNav from './components/TopNav/TopNav';

// Route yêu cầu đăng nhập
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Route yêu cầu role admin / manager / super_admin
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  const allowed = ['admin', 'manager', 'super_admin'];
  if (!allowed.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <TopNav />
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <PrivateRoute><Home /></PrivateRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />

          {/* KOL Manager Routes with Layout */}
          <Route path="/super-profiles" element={<PrivateRoute><KOLManagerLayout /></PrivateRoute>}>
            <Route index element={<SuperProfiles />} />
            <Route path="inventory" element={<AccountInventory />} />
            <Route path=":id" element={<SuperProfileDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
