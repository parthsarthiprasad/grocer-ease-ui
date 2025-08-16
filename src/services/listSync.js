
import chatService from './chatService';
import { matchItems } from './inventoryService';

const sanitize = (s) => (s || '').toString().trim().replace(/[\s,.;:]+$/g, '');

function normalizeMatch(item, idx) {
  // item may be a string (legacy) or an object with metadata
  if (item && typeof item === 'object') {
    const name = item.item_description || item.product_name || item.name || '';
    return {
      id: `${name}-${idx}-${Date.now()}`,
      name,
      face_id: item.face_id,
      barcode: item.item_bar_code || item.barcode,
      image_url: item.image_url,
      unit: item.unit,
      price: item.item_cost || item.price,
      quantity: 1,
    };
  }
  const name = sanitize(item);
  return { id: `${name}-${idx}-${Date.now()}`, name, quantity: 1 };
}

export async function getUnifiedList(userId, shopId = 'shop_1') {
  const itemsOnly = await chatService.getItemsOnly(userId);
  const names = Array.isArray(itemsOnly?.items) ? itemsOnly.items.map(sanitize).filter(Boolean) : [];
  if (names.length === 0) return [];
  const matched = await matchItems(shopId, names);
  const arr = Array.isArray(matched?.closest_matches) ? matched.closest_matches : names;
  return arr.map(normalizeMatch);
}

export async function syncAddSpecific(userId, productName, shopId = 'shop_1') {
  const itemsOnly = await chatService.getItemsOnly(userId);
  const current = Array.isArray(itemsOnly?.items) ? itemsOnly.items.map(sanitize) : [];
  const updated = [...current, sanitize(productName)];
  await chatService.syncList(userId, updated);
  return getUnifiedList(userId, shopId);
}

export async function syncRemoveSpecific(userId, productName, shopId = 'shop_1') {
  const itemsOnly = await chatService.getItemsOnly(userId);
  const current = Array.isArray(itemsOnly?.items) ? itemsOnly.items.map(sanitize) : [];
  const updated = current.filter(n => n.toLowerCase() !== sanitize(productName).toLowerCase());
  await chatService.syncList(userId, updated);
  return getUnifiedList(userId, shopId);
}

export default { getUnifiedList, syncAddSpecific, syncRemoveSpecific };
