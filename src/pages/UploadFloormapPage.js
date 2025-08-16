import React from 'react';

const UploadFloormapPage = () => {
	return (
		<div className="container py-5">
			<div className="row justify-content-center">
				<div className="col-lg-8">
					<div className="card">
						<div className="card-header bg-warning text-dark">
							<h5 className="mb-0">
								<i className="fas fa-upload me-2"></i>Upload Floormap
							</h5>
						</div>
						<div className="card-body text-center py-5">
							<div className="mb-4">
								<i className="fas fa-upload fa-5x text-warning mb-3"></i>
							</div>
							<h3 className="text-primary mb-4">Coming Soon!</h3>
							<div className="alert alert-info">
								<h5 className="alert-heading">
									<i className="fas fa-info-circle me-2"></i>Feature Update
								</h5>
								<p className="mb-3">The floormap upload functionality is currently under development.</p>
								<p className="mb-0">Shopkeepers will soon be able to upload new store layouts and update inventory mappings.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UploadFloormapPage;
