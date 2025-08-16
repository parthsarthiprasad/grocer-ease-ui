import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!username || !password) return;
		login(username, 'customer');
		navigate('/chatbot');
	};

	return (
		<div className="container py-5">
			<div className="row justify-content-center">
				<div className="col-sm-10 col-md-8 col-lg-5 col-xl-4">
					<div className="card shadow-sm">
						<div className="card-header bg-primary text-white text-center">
							<h4 className="mb-0">
								<i className="fas fa-sign-in-alt me-2"></i>Login
							</h4>
						</div>
						<div className="card-body">
							<form onSubmit={handleSubmit}>
								<div className="mb-3">
									<label className="form-label">Username</label>
									<div className="input-group">
										<span className="input-group-text">
											<i className="fas fa-user"></i>
										</span>
										<input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
									</div>
								</div>
								<div className="mb-3">
									<label className="form-label">Password</label>
									<div className="input-group">
										<span className="input-group-text">
											<i className="fas fa-lock"></i>
										</span>
										<input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
									</div>
								</div>
								<button type="submit" className="btn btn-primary w-100">
									<i className="fas fa-sign-in-alt me-2"></i>Login
								</button>
							</form>
							<div className="text-center mt-3">
								<p className="mb-0">Don't have an account?</p>
								<Link to="/register" className="btn btn-outline-primary btn-sm mt-2">
									<i className="fas fa-user-plus me-1"></i>Create Account
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
