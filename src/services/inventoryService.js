
const INV_BASE = (process.env.REACT_APP_INV_API_BASE_URL || 'http://localhost:8050');

export async function fetchInventory(shopId = 'shop_1') {
	const url = `${INV_BASE}/fetch_shop_inventory?shop_id=${encodeURIComponent(shopId)}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Inventory fetch failed: ${res.status}`);
	const data = await res.json();
	return Array.isArray(data?.items) ? data.items : [];
}

export async function matchItems(shopId = 'shop_1', names = []) {
	const res = await fetch(`${INV_BASE}/fetch_matching_item`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ shop_id: shopId, 'shopping list': names })
	});
	if (!res.ok) throw new Error(`Match fetch failed: ${res.status}`);
	return res.json(); // { closest_matches: [string], next_best_matches: [array] }
}


