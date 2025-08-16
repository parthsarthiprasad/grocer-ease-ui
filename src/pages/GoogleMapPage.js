import React from 'react';

const GoogleMapPage = () => {
	return (
		<div className="container py-5">
			<div className="row justify-content-center">
				<div className="col-lg-8">
					<div className="card">
						<div className="card-header bg-warning text-dark">
							<h5 className="mb-0">
								<i className="fas fa-globe me-2"></i>Store Locator
							</h5>
						</div>
						<div className="card-body text-center py-5">
							<div className="mb-4">
								<i className="fas fa-map-marker-alt fa-5x text-warning mb-3"></i>
							</div>
							<h3 className="text-primary mb-4">Expanding Soon!</h3>
							<div className="alert alert-info">
								<h5 className="alert-heading">
									<i className="fas fa-info-circle me-2"></i>Service Update
								</h5>
								<p className="mb-3">Sorry, no registered stores within 100 miles of you.</p>
								<p className="mb-0">We're coming to your nearby stores soon! Stay tuned for updates.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GoogleMapPage;
