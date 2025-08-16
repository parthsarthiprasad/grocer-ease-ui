
import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/floorplan.css';

const CLICK_THRESHOLD = 5; // px around edge

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
				setInventory(inv);
			})
			.catch(() => {
				setStoreData({ store_vertices: [], polygons: [] });
				setInventory([]);
			});
	}, []);

	// Build faces from vertices/polygons
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
		if (storeData.polygons?.length) storeData.polygons.forEach(p => pushEdges(p.polygon_vertices || []));
		setFaces(f);
	}, [storeData]);

	// Face colors
	useEffect(() => {
		const colors = [
			'#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
			'#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
			'#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#10AC84',
			'#FF3838', '#FF6348', '#FFA502', '#2ED573', '#1E90FF', '#5352ED'
		];
		const map = {};
		faces.forEach((f, i) => (map[f.id] = colors[i % colors.length]));
		setFaceColors(map);
	}, [faces]);

	// Auto-populate 10 random items each mount (simulate like ShopAssistant)
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

	// Build SVG once data ready
	useEffect(() => {
		const svg = svgRef.current;
		const tooltip = tooltipRef.current;
		if (!svg || !storeData) return;
		svg.innerHTML = '';

		// Store outline
		if (storeData.store_vertices?.length) {
			const storePoints = storeData.store_vertices.map(pt => pt.join(',')).join(' ');
			const storePoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			storePoly.setAttribute('points', storePoints);
			storePoly.setAttribute('id', 'store-outline');
			storePoly.setAttribute('fill', 'rgba(30, 40, 100, 0.05)');
			storePoly.setAttribute('stroke', '#6b7280');
			svg.appendChild(storePoly);
		}

		// Polygons
		(storeData.polygons || []).forEach((poly, index) => {
			const pts = (poly.polygon_vertices || []).map(pt => pt.join(',')).join(' ');
			const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			polygon.setAttribute('points', pts);
			polygon.setAttribute('fill', 'rgba(107, 114, 128, 0.1)');
			polygon.setAttribute('stroke', '#6b7280');
			svg.appendChild(polygon);
		});

		// Edges (faces) as interactive lines (hover tooltip)
		faces.forEach((f, idx) => {
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
			line.addEventListener('mouseout', () => {
				tooltip.style.opacity = '0';
			});
			line.addEventListener('click', () => {
				setSelectedFace(f);
			});
			svg.appendChild(line);

			// Colored overlay for faces that have items in shoppingList
			const hasListItems = shoppingList.some(i => i.face_id === f.id);
			if (hasListItems) {
				const color = faceColors[f.id] || '#6b7280';
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

		// Draw markers for shopping list items at face midpoints
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
			const color = faceColors[faceId] || '#6b7280';
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', midX);
			circle.setAttribute('cy', midY);
			circle.setAttribute('r', '8');
			circle.setAttribute('fill', color);
			circle.setAttribute('stroke', '#fff');
			circle.setAttribute('stroke-width', '2');
			svg.appendChild(circle);
			// Label count
			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', midX);
			text.setAttribute('y', midY + 3);
			text.setAttribute('fill', '#fff');
			text.setAttribute('font-size', '10');
			text.setAttribute('font-weight', 'bold');
			text.setAttribute('text-anchor', 'middle');
			text.textContent = String(items.length);
			svg.appendChild(text);
		});
	}, [storeData, faces, faceColors, shoppingList, selectedFace]);

	const faceInfo = useMemo(() => {
		if (!selectedFace) return null;
		const items = faceItemsMap[selectedFace.id] || [];
		return { faceId: selectedFace.id, items };
	}, [selectedFace, faceItemsMap]);

	return (
		<div className="floorplan-page">
			<header>
				<h1>Interactive Floorplan</h1>
				<p className="subtitle">Click on any face (edge) to see items stored there</p>
			</header>
			<div className="container">
				<div className="floorplan-container">
					<div className="floorplan-wrapper">
						<div id="tooltip" ref={tooltipRef} className="tooltip" />
						<div className="svg-container">
							<svg ref={svgRef} id="floorplan-svg" viewBox="0 0 1000 850"></svg>
						</div>
					</div>
				</div>
				<div className="info-panel">
					<h2>Face Information</h2>
					{!faceInfo && (
						<p className="text-muted">Click a face to view its items</p>
					)}
					{faceInfo && (
						<div className="data-display">
							<h3 className="mb-2">{faceInfo.faceId}</h3>
							<div className="row">
								{faceInfo.items.length ? faceInfo.items.map((it) => (
									<div key={it.id} className="col-12 mb-2">
										<div className="d-flex align-items-center">
											<div style={{ width: 12, height: 12, borderRadius: '50%', background: faceColors[it.face_id] || '#6b7280' }} className="me-2" />
											<img src={it.image_url} alt={it.name} style={{ width: 30, height: 30, borderRadius: 4 }} className="me-2" />
											<div>
												<small className="fw-bold">{it.name}</small><br />
												<small className="text-success">${it.price}/{it.unit}</small>
											</div>
										</div>
									</div>
								)) : (
								<p className="text-muted">No items found for this face.</p>
							)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default FloorplanPage;
