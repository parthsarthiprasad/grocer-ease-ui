
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import { fetchInventory, matchItems } from '../services/inventoryService';
import '../styles/floorplan.css';
import imageService from '../services/imageService';

const sanitize = (s) => (s || '').toString().trim().replace(/[\s,.;:]+$/g, '');

const FloorplanPage = () => {
	const { user } = useAuth();
	const userId = user?.username || 'anonymous_user';

	const svgRef = useRef(null);
	const tooltipRef = useRef(null);
	const [storeData, setStoreData] = useState(null);
	const [inventory, setInventory] = useState([]);
	const [faces, setFaces] = useState([]);
	const [selectedFace, setSelectedFace] = useState(null);
	const [shoppingList, setShoppingList] = useState([]);
	const [faceColors, setFaceColors] = useState({});
	const [viewBox, setViewBox] = useState('0 0 1000 800');
	const [bgOn, setBgOn] = useState(false);

	// Load vertices and compute bounds
  useEffect(() => {
		fetch('/data/vertices.json')
			.then(r => r.json())
			.then((v) => {
				setStoreData(v);
				const all = [
					...(v.store_vertices || []),
					...((v.polygons || []).flatMap(p => p.polygon_vertices || []))
				];
				if (all.length) {
					const xs = all.map(p => p[0]);
					const ys = all.map(p => p[1]);
					const minX = Math.min(...xs), maxX = Math.max(...xs);
					const minY = Math.min(...ys), maxY = Math.max(...ys);
					const pad = 20;
					setViewBox(`${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`);
				}
			})
			.catch(() => setStoreData({ store_vertices: [], polygons: [] }));
	}, []);

	// Inventory
	useEffect(() => {
		(async () => {
			try {
				const items = await fetchInventory('shop_1');
				// Normalize and prime image cache
				const normalized = items.map((it) => ({
					item_id: it.item_id || it.id,
					item_description: it.item_description || it.name || it.description || '',
					barcode: it.barcode,
					face_id: it.face_id,
					item_cost: it.item_cost || it.price,
					image_url: it.image_url,
					unit: it.unit,
				}));
				normalized.forEach(n => imageService.primeCache({ name: n.item_description, barcode: n.barcode, image_url: n.image_url }));
				setInventory(normalized);
			} catch (_) {
				try {
					const r = await fetch('/data/shop_inventory.json');
					const j = await r.json();
					const arr = j.items || j;
					const normalized = arr.map((it) => ({
						item_id: it.item_id || it.id,
						item_description: it.item_description || it.name || it.description || '',
						barcode: it.barcode,
						face_id: it.face_id,
						item_cost: it.item_cost || it.price,
						image_url: it.image_url,
						unit: it.unit,
					}));
					normalized.forEach(n => imageService.primeCache({ name: n.item_description, barcode: n.barcode, image_url: n.image_url }));
					setInventory(normalized);
				} catch {
					setInventory([]);
				}
			}
		})();
	}, []);

	// Load API shopping list and try to map to inventory faces
	useEffect(() => {
		(async () => {
			try {
				const state = await chatService.getShoppingListState(userId);
				const items = Array.isArray(state?.items) ? state.items : [];
				const names = items.filter(i => !i.removed).map(i => sanitize(i.name));
				let display = names.map((n, idx) => ({ id: `${n}-${idx}`, name: n, quantity: 1 }));
				// Heuristic: try service matching then fallback to simple substring over inventory
				try {
					const match = await matchItems('shop_1', names);
					if (Array.isArray(match?.closest_matches)) {
						display = match.closest_matches.map((n, idx) => ({ id: `${(n || names[idx])}-${idx}`, name: (n || names[idx]), quantity: 1 }));
					}
				} catch {}
				if (inventory.length) {
					const norm = (s) => sanitize(s).toLowerCase();
					const mapByName = new Map(inventory.map(inv => [norm(inv.item_description), inv]));
					display = display.map(it => {
						const exact = mapByName.get(norm(it.name));
						if (exact) return { ...it, face_id: exact.face_id, barcode: exact.barcode };
						const fuzzy = inventory.find(invIt => norm(invIt.item_description).includes(norm(it.name)));
						return fuzzy ? { ...it, face_id: fuzzy.face_id, barcode: fuzzy.barcode } : it;
					});
				}
				setShoppingList(display);
			} catch (_) {}
		})();
	}, [userId, inventory]);

	// Faces computed from vertices
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

	const faceItemsMap = useMemo(() => {
		const map = {};
		for (const item of inventory) {
			(map[item.face_id] ||= []).push(item);
		}
		return map;
	}, [inventory]);

	// Draw SVG and markers
	useEffect(() => {
		const container = svgRef.current;
		const tooltip = tooltipRef.current;
		if (!container || !storeData) return;
		container.innerHTML = '';

		const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svgEl.setAttribute('viewBox', viewBox);
		svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
		svgEl.setAttribute('width', '100%');
		svgEl.setAttribute('height', '100%');

		// Optional background overlay
		if (bgOn) {
			const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
			img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '/data/roomba_map_1755306591410.jpeg');
			img.setAttribute('x', viewBox.split(' ')[0]);
			img.setAttribute('y', viewBox.split(' ')[1]);
			img.setAttribute('width', viewBox.split(' ')[2]);
			img.setAttribute('height', viewBox.split(' ')[3]);
			img.setAttribute('opacity', '0.5');
			svgEl.appendChild(img);
		}

		// Outer store poly (stroke black)
		if (storeData.store_vertices?.length) {
			const storePoints = storeData.store_vertices.map(pt => pt.join(',')).join(' ');
			const storePoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			storePoly.setAttribute('points', storePoints);
			storePoly.setAttribute('fill', '#f8fafc');
			storePoly.setAttribute('stroke', '#111827');
			svgEl.appendChild(storePoly);
		}

		(storeData.polygons || []).forEach((poly) => {
			const pts = (poly.polygon_vertices || []).map(pt => pt.join(',')).join(' ');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			polygon.setAttribute('points', pts);
			polygon.setAttribute('fill', '#ffffff');
			polygon.setAttribute('stroke', '#111827');
			svgEl.appendChild(polygon);
		});

		faces.forEach((f) => {
			const [x1, y1] = f.start;
			const [x2, y2] = f.end;
			const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			hit.setAttribute('x1', x1);
			hit.setAttribute('y1', y1);
			hit.setAttribute('x2', x2);
			hit.setAttribute('y2', y2);
			hit.setAttribute('stroke', 'transparent');
			hit.setAttribute('stroke-width', '12');
			hit.style.cursor = 'pointer';
			hit.addEventListener('mousemove', (e) => {
          tooltip.style.opacity = '1';
          tooltip.style.left = `${e.clientX + 15}px`;
          tooltip.style.top = `${e.clientY + 15}px`;
				tooltip.textContent = `${f.id}`;
			});
			hit.addEventListener('mouseout', () => { tooltip.style.opacity = '0'; });
			hit.addEventListener('click', () => { setSelectedFace(f); });
			svgEl.appendChild(hit);
		});

		// Draw markers only for faces that have shopping-list items
		shoppingList.forEach((it) => {
			if (!it.face_id) return;
			const f = faces.find(ff => ff.id === it.face_id);
			if (!f) return;
			const midX = (f.start[0] + f.end[0]) / 2;
			const midY = (f.start[1] + f.end[1]) / 2;
			const color = faceColors[it.face_id] || '#0ea5e9';
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', midX);
			circle.setAttribute('cy', midY);
			circle.setAttribute('r', '8');
			circle.setAttribute('fill', color);
			circle.setAttribute('stroke', '#fff');
			circle.setAttribute('stroke-width', '2');
			svgEl.appendChild(circle);
		});

		container.appendChild(svgEl);
	}, [storeData, faces, shoppingList, faceColors, viewBox, bgOn]);

	const faceInfo = useMemo(() => {
		if (!selectedFace) return null;
		const items = faceItemsMap[selectedFace.id] || [];
		return { faceId: selectedFace.id, items };
	}, [selectedFace, faceItemsMap]);

	const updateQuantity = (id, qty) => {
		setShoppingList(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
	};

	const addItemToList = (desc) => {
		const name = sanitize(desc);
		if (!name) return;
		setShoppingList(prev => [{ id: `${name}-${Date.now()}`, name, face_id: selectedFace?.id, quantity: 1 }, ...prev]);
	};

  return (
		<div className="container-fluid py-4 ge-floor">
			<div className="row">
				{/* Map left */}
				<div className="col-lg-8 mb-3">
					<div className="card">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0"><i className="fas fa-map me-2"></i>Store Floor Map</h5>
							<div className="btn-group btn-group-sm">
								<button className="btn btn-outline-secondary" onClick={() => setBgOn(prev => !prev)}>Toggle Background</button>
							</div>
						</div>
						<div className="card-body text-center">
							<div className="position-relative" style={{ width: '100%', height: 600 }}>
								<div id="tooltip" ref={tooltipRef} className="tooltip" />
								<div ref={svgRef} id="store-canvas" style={{ width: '100%', height: '100%' }} />
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
										<div key={it.item_id || it.id} className="d-flex align-items-center justify-content-between mb-2">
											<div className="d-flex align-items-center">
												<div className="me-2" style={{ width: 12, height: 12, borderRadius: '50%', background: faceColors[it.face_id] || '#64748b' }} />
												<div>
													<small className="fw-bold">{it.item_description}</small><br />
													<small className="text-success">${it.item_cost}</small>
												</div>
											</div>
											<button className="btn btn-sm btn-primary" onClick={() => addItemToList(it.item_description)}>
												<i className="fas fa-plus me-1"></i>Add
											</button>
										</div>
									)) : (
									<p className="text-muted mb-0">No items found for this face.</p>
									)}
								</>
							)}
            </div>
          </div>
        </div>
        
				{/* Shopping list right (unified style) */}
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
											<div className="flex-grow-1">
												<div className="fw-semibold small d-flex align-items-center gap-2">
													<img src={it.imageUrl || it.image_url || 'https://via.placeholder.com/32'} alt={it.name} width={32} height={32} style={{ borderRadius: 6, objectFit: 'cover' }} />
													{it.name}
												</div>
												<small className="text-muted">{it.unit ? `$${it.price}/${it.unit}` : ''}</small>
												<div className="mt-1 d-flex align-items-center gap-2">
													<label className="text-muted small">Qty:</label>
													<select
														value={it.quantity ?? 1}
														onChange={(e) => updateQuantity(it.id, Number(e.target.value))}
														className="form-select form-select-sm"
														style={{ width: 80 }}
													>
														{Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
															<option key={n} value={n}>{n}</option>
														))}
													</select>
          </div>
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
