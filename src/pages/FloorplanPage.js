
import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/floorplan.css';

const CLICK_THRESHOLD = 5;

const FloorplanPage = () => {
	const svgRef = useRef(null);
	const tooltipRef = useRef(null);
	const [storeData, setStoreData] = useState(null);
	const [inventory, setInventory] = useState([]);
	const [faces, setFaces] = useState([]);
	const [selectedFace, setSelectedFace] = useState(null);
	const [shoppingList, setShoppingList] = useState([]);
	const [faceColors, setFaceColors] = useState({});

	useEffect(() => {
		Promise.all([
			fetch('/data/vertices.json').then(r => r.json()),
			fetch('/data/shop_inventory.json').then(r => r.json())
		])
			.then(([v, inv]) => {
				setStoreData(v);
				setInventory(inv.items || inv);
			})
			.catch(() => {
				setStoreData({ store_vertices: [], polygons: [] });
				setInventory([]);
			});
	}, []);

	useEffect(() => {
		if (!storeData) return;
		const f = [];
		let id = 0;
		const pushEdges = (vertices) => {
			for (let i = 0; i < vertices.length; i++) {
				const start = vertices[i];
				const end = vertices[(i + 1) % vertices.length];
				f.push({ id: `face_${String(id).padStart(3, '0')}`, start, end });
				id++;
			}
		};
		if (storeData.store_vertices?.length) pushEdges(storeData.store_vertices);
		(storeData.polygons || []).forEach(p => pushEdges(p.polygon_vertices || []));
		setFaces(f);
	}, [storeData]);

	useEffect(() => {
		const palette = ['#2563eb','#16a34a','#0ea5e9','#dc2626','#7c3aed','#ea580c','#0d9488','#d97706','#1d4ed8','#059669','#4338ca','#0891b2'];
		const map = {};
		faces.forEach((f, i) => { map[f.id] = palette[i % palette.length]; });
		setFaceColors(map);
	}, [faces]);

	useEffect(() => {
		if (!inventory?.length) return;
		const shuffled = [...inventory].sort(() => 0.5 - Math.random());
		setShoppingList(shuffled.slice(0, 10));
	}, [inventory]);

	const faceItemsMap = useMemo(() => {
		const map = {};
		for (const item of inventory) {
			(map[item.face_id] ||= []).push(item);
		}
		return map;
	}, [inventory]);

	useEffect(() => {
		const svg = svgRef.current;
		const tooltip = tooltipRef.current;
		if (!svg || !storeData) return;
		svg.innerHTML = '';

		if (storeData.store_vertices?.length) {
			const storePoints = storeData.store_vertices.map(pt => pt.join(',')).join(' ');
			const storePoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			storePoly.setAttribute('points', storePoints);
			storePoly.setAttribute('fill', '#f8fafc');
			storePoly.setAttribute('stroke', '#cbd5e1');
			svg.appendChild(storePoly);
		}

		(storeData.polygons || []).forEach((poly) => {
			const pts = (poly.polygon_vertices || []).map(pt => pt.join(',')).join(' ');
			const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			polygon.setAttribute('points', pts);
			polygon.setAttribute('fill', '#ffffff');
			polygon.setAttribute('stroke', '#cbd5e1');
			svg.appendChild(polygon);
		});

		faces.forEach((f) => {
			const [x1, y1] = f.start;
			const [x2, y2] = f.end;
			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', x1);
			line.setAttribute('y1', y1);
			line.setAttribute('x2', x2);
			line.setAttribute('y2', y2);
			line.setAttribute('stroke', 'transparent');
			line.setAttribute('stroke-width', '12');
			line.style.cursor = 'pointer';
			line.addEventListener('mousemove', (e) => {
				tooltip.style.opacity = '1';
				tooltip.style.left = `${e.clientX + 15}px`;
				tooltip.style.top = `${e.clientY + 15}px`;
				tooltip.textContent = `${f.id}`;
			});
			line.addEventListener('mouseout', () => { tooltip.style.opacity = '0'; });
			line.addEventListener('click', () => { setSelectedFace(f); });
			svg.appendChild(line);

			const hasListItems = shoppingList.some(i => i.face_id === f.id);
			if (hasListItems) {
				const color = faceColors[f.id] || '#64748b';
				const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				overlay.setAttribute('x1', x1);
				overlay.setAttribute('y1', y1);
				overlay.setAttribute('x2', x2);
				overlay.setAttribute('y2', y2);
				overlay.setAttribute('stroke', color);
				overlay.setAttribute('stroke-width', selectedFace?.id === f.id ? '6' : '4');
				overlay.setAttribute('stroke-linecap', 'round');
				svg.appendChild(overlay);
			}
		});

		const grouped = shoppingList.reduce((acc, it) => {
			if (!it.face_id) return acc;
			(acc[it.face_id] ||= []).push(it);
			return acc;
		}, {});
		Object.entries(grouped).forEach(([faceId, items]) => {
			const f = faces.find(ff => ff.id === faceId);
			if (!f) return;
			const midX = (f.start[0] + f.end[0]) / 2;
			const midY = (f.start[1] + f.end[1]) / 2;
			const color = faceColors[faceId] || '#64748b';
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', midX);
			circle.setAttribute('cy', midY);
			circle.setAttribute('r', '8');
			circle.setAttribute('fill', color);
			circle.setAttribute('stroke', '#fff');
			circle.setAttribute('stroke-width', '2');
			svg.appendChild(circle);
		});
	}, [storeData, faces, faceColors, shoppingList, selectedFace]);

	const faceInfo = useMemo(() => {
		if (!selectedFace) return null;
		const items = faceItemsMap[selectedFace.id] || [];
		return { faceId: selectedFace.id, items };
	}, [selectedFace, faceItemsMap]);

	return (
		<div className="container-fluid py-4 ge-floor">
			<div className="row">
				{/* Map left */}
				<div className="col-lg-8 mb-3">
					<div className="card">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0"><i className="fas fa-map me-2"></i>Store Floor Map</h5>
							<div className="btn-group btn-group-sm">
								<button className="btn btn-outline-secondary" onClick={() => setSelectedFace(null)}>Reset View</button>
							</div>
						</div>
						<div className="card-body text-center">
							<div className="position-relative">
								<div id="tooltip" ref={tooltipRef} className="tooltip" />
								<svg ref={svgRef} id="store-canvas" width="800" height="600"></svg>
							</div>
						</div>
					</div>

					{/* Face info below map */}
					<div className="card mt-3">
						<div className="card-header">
							<h6 className="mb-0"><i className="fas fa-info-circle me-2"></i>Face Information</h6>
						</div>
						<div className="card-body">
							{!faceInfo ? (
								<p className="text-muted mb-0">Click on a face (polygon edge) to view its details and available items.</p>
							) : (
								<>
									<h6 className="mb-3">{faceInfo.faceId}</h6>
									{faceInfo.items.length ? faceInfo.items.map(it => (
										<div key={it.id} className="d-flex align-items-center mb-2">
											<div className="me-2" style={{ width: 12, height: 12, borderRadius: '50%', background: faceColors[it.face_id] || '#64748b' }} />
											<img src={it.image_url} alt={it.name} className="me-2" style={{ width: 30, height: 30, borderRadius: 4 }} />
											<div>
												<small className="fw-bold">{it.name}</small><br />
												<small className="text-success">${it.price}/{it.unit}</small>
											</div>
										</div>
									)) : (
									<p className="text-muted mb-0">No items found for this face.</p>
									)}
								</>
							)}
						</div>
					</div>
				</div>

				{/* Shopping list right */}
				<div className="col-lg-4">
					<div className="card h-100">
						<div className="card-header">
							<h6 className="mb-0"><i className="fas fa-list-ul me-2"></i>Shopping List <span className="badge bg-primary ms-2">{shoppingList.length}</span></h6>
						</div>
						<div className="card-body">
							{shoppingList.length ? (
								<div>
									{shoppingList.map(it => (
										<div key={it.id} className="d-flex align-items-center mb-3">
											<div className="me-2" style={{ width: 16, height: 16, borderRadius: '50%', background: faceColors[it.face_id] || '#64748b' }} />
											<img src={it.image_url} alt={it.name} className="me-3" style={{ width: 40, height: 40, borderRadius: 6 }} />
											<div className="flex-grow-1">
												<div className="fw-semibold small">{it.name}</div>
												<small className="text-muted">${it.price}/{it.unit}</small>
											</div>
											<button className="btn btn-sm btn-outline-danger" onClick={() => setShoppingList(prev => prev.filter(p => p.id !== it.id))}><i className="fas fa-trash"></i></button>
										</div>
									))}
								</div>
							) : (
								<div className="text-muted text-center">Your shopping list is empty.</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FloorplanPage;
