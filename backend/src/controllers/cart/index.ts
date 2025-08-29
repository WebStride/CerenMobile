import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { getCart, addOrIncrementCartItem, updateCartQuantity, removeCartItem, clearCart } from '../../service/cart';

export async function getCartList(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'User not authenticated' });
    const userId = parseInt(req.user.userId);
    const cart = await getCart(userId);
    res.json({ success: true, cart });
  } catch (error: any) {
    console.error('Error getting cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function postCart(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'User not authenticated' });
    const userId = parseInt(req.user.userId);
    const body = req.body;
    if (!body?.productId || !body?.productName) return res.status(400).json({ error: 'productId and productName required' });
    const item = await addOrIncrementCartItem(userId, body);
    res.json({ success: true, item });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function putCartItem(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'User not authenticated' });
    const userId = parseInt(req.user.userId);
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;
    if (isNaN(productId) || typeof quantity !== 'number') return res.status(400).json({ error: 'Invalid request' });
    await updateCartQuantity(userId, productId, quantity);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteCartItem(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'User not authenticated' });
    const userId = parseInt(req.user.userId);
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid productId' });
    await removeCartItem(userId, productId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function postClearCart(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'User not authenticated' });
    const userId = parseInt(req.user.userId);
    await clearCart(userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
