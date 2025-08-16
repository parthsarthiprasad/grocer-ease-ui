
import React from 'react';

const Hero = ({ title, subtitle, onChatClick, onStoreClick }) => {
	return (
		<section className="hero d-flex align-items-center" style={{ minHeight: '60vh', background: "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1920&q=80') center/cover no-repeat" }}>
			<div className="container text-center text-white">
				<h1 className="display-5 fw-bold mb-3">{title}</h1>
				<p className="lead mb-4">{subtitle}</p>
				<div className="d-flex justify-content-center gap-3">
					<button className="btn btn-danger btn-lg" onClick={onChatClick}>
						<i className="fas fa-comments me-2"></i>Try Smart Shopping Assistant
					</button>
					<button className="btn btn-outline-light btn-lg" onClick={onStoreClick}>
						<i className="fas fa-search me-2"></i>Find all the stores
					</button>
				</div>
			</div>
		</section>
	);
};

export default Hero;
