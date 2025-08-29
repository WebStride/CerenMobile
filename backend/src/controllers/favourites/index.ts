import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { getUserFavourites, addUserFavourite, removeUserFavourite } from '../../service/favourites';

export async function getFavourites(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'User not authenticated' });
    const userId = parseInt(req.user.userId);
    const favourites = await getUserFavourites(userId);
    res.json({ success: true, favourites });
  } catch (error: any) {
    console.error('Error getting favourites:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function postFavourite(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'User not authenticated' });
    const userId = parseInt(req.user.userId);
    const product = req.body;
    if (!product?.productId) return res.status(400).json({ error: 'productId required' });

    const fav = await addUserFavourite(userId, product);
    res.json({ success: true, favourite: fav });
  } catch (error: any) {
    console.error('Error adding favourite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteFavourite(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'User not authenticated' });
    const userId = parseInt(req.user.userId);
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid productId' });

    await removeUserFavourite(userId, productId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing favourite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
