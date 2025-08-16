import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	return (
		<nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
			<div className="container-fluid">
				<Link className="navbar-brand text-dark fw-bold" to={user ? '/chatbot' : '/login'}>
					<i className="fas fa-shopping-cart me-2"></i>Grocer-Ease
				</Link>

				<button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
					<span className="navbar-toggler-icon"></span>
				</button>

				<div className="collapse navbar-collapse" id="navbarNav">
					{user ? (
						<>
							<ul className="navbar-nav me-auto">
								<li className="nav-item">
									<Link className="nav-link text-dark" to="/chatbot">
										<i className="fas fa-comments me-1"></i>Chatbot
									</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link text-dark" to="/floorplan">
										<i className="fas fa-map me-1"></i>Floormap
									</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link text-dark" to="/googlemap">
										<i className="fas fa-globe me-1"></i>Google Map
									</Link>
								</li>
								{user.role === 'shopkeeper' && (
									<li className="nav-item">
										<Link className="nav-link text-dark" to="/upload-floormap">
											<i className="fas fa-upload me-1"></i>Upload Floormap
										</Link>
									</li>
								)}
							</ul>
							<ul className="navbar-nav">
								<li className="nav-item dropdown">
									<a className="nav-link dropdown-toggle text-dark" href="#" role="button" data-bs-toggle="dropdown">
										<i className="fas fa-user me-1"></i>{user.username}
									</a>
									<ul className="dropdown-menu dropdown-menu-end">
										<li><button className="dropdown-item" onClick={handleLogout}>
											<i className="fas fa-sign-out-alt me-1"></i>Logout
										</button></li>
									</ul>
								</li>
							</ul>
						</>
					) : (
						<ul className="navbar-nav ms-auto">
							<li className="nav-item">
								<Link className="nav-link text-dark" to="/login">
									<i className="fas fa-sign-in-alt me-1"></i>Login
								</Link>
							</li>
						</ul>
					)}
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
