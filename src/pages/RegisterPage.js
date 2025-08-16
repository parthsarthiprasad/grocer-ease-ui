import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('customer');

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!username || !email || !password) return;
		login(username, role);
		navigate('/chatbot');
	};

	return (
		<div className="container py-5">
			<div className="row justify-content-center">
				<div className="col-sm-10 col-md-8 col-lg-5 col-xl-4">
					<div className="card shadow-sm">
						<div className="card-header bg-success text-white text-center">
							<h4 className="mb-0">
								<i className="fas fa-user-plus me-2"></i>Create Account
							</h4>
						</div>
						<div className="card-body">
							<form onSubmit={handleSubmit}>
								<div className="mb-3">
									<label className="form-label">Username</label>
									<div className="input-group">
										<span className="input-group-text"><i className="fas fa-user"></i></span>
										<input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
									</div>
								</div>
								<div className="mb-3">
									<label className="form-label">Email</label>
									<div className="input-group">
										<span className="input-group-text"><i className="fas fa-envelope"></i></span>
										<input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
									</div>
								</div>
								<div className="mb-3">
									<label className="form-label">Password</label>
									<div className="input-group">
										<span className="input-group-text"><i className="fas fa-lock"></i></span>
										<input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
									</div>
								</div>

								<div className="mb-3">
									<label className="form-label">Account Type</label>
									<div className="d-flex gap-3">
										<div className="form-check">
											<input className="form-check-input" type="radio" id="role-customer" checked={role==='customer'} onChange={() => setRole('customer')} />
											<label className="form-check-label" htmlFor="role-customer">
												<i className="fas fa-user me-1"></i>Customer
											</label>
										</div>
										<div className="form-check">
											<input className="form-check-input" type="radio" id="role-shopkeeper" checked={role==='shopkeeper'} onChange={() => setRole('shopkeeper')} />
											<label className="form-check-label" htmlFor="role-shopkeeper">
												<i className="fas fa-store me-1"></i>Shopkeeper
											</label>
										</div>
									</div>
								</div>

								<button type="submit" className="btn btn-success w-100">
									<i className="fas fa-user-plus me-2"></i>Create Account
								</button>
							</form>

							<div className="text-center mt-3">
								<p className="mb-0">Already have an account?</p>
								<Link to="/login" className="btn btn-outline-success btn-sm mt-2">
									<i className="fas fa-sign-in-alt me-1"></i>Sign In
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RegisterPage;
