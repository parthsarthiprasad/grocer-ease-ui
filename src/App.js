
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LaunchPage from './pages/LaunchPage';
import StaffPage from './pages/StaffPage';
import CheckoutPage from './pages/CheckoutPage';
import FloorplanPage from './pages/FloorplanPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GoogleMapPage from './pages/GoogleMapPage';
import UploadFloormapPage from './pages/UploadFloormapPage';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
	const { user } = useAuth();
	if (!user) return <Navigate to="/login" replace />;
	return children;
};

function App() {
	return (
		<div className="App">
			<Navbar />
			<div className="container-fluid p-0">
				<Routes>
					<Route path="/" element={<Navigate to="/login" replace />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />

					<Route path="/chatbot" element={<PrivateRoute><LaunchPage /></PrivateRoute>} />
					<Route path="/floorplan" element={<PrivateRoute><FloorplanPage /></PrivateRoute>} />
					<Route path="/googlemap" element={<PrivateRoute><GoogleMapPage /></PrivateRoute>} />
					<Route path="/upload-floormap" element={<PrivateRoute><UploadFloormapPage /></PrivateRoute>} />

					{/* Legacy routes kept for compatibility */}
					<Route path="/staff" element={<PrivateRoute><StaffPage /></PrivateRoute>} />
					<Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
				</Routes>
			</div>
		</div>
	);
}

export default App;
