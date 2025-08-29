import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCart(userId: number) {
  return prisma.cart.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
}

export async function addOrIncrementCartItem(userId: number, product: any) {
  const whereAny = { userId_productId: { userId, productId: product.productId } } as any;
  const existing = await prisma.cart.findUnique({ where: whereAny }).catch(() => null);
  if (existing) {
    return prisma.cart.update({ where: { id: existing.id }, data: { quantity: existing.quantity + 1, updatedAt: new Date() } });
  }

  return prisma.cart.create({
    data: {
      userId,
      productId: product.productId,
      productName: product.productName,
      price: product.price || 0,
      image: product.image || null,
      productUnits: product.productUnits || null,
      unitsOfMeasurement: product.unitsOfMeasurement || null,
      minOrderQuantity: product.minOrderQuantity || 1,
      quantity: product.quantity || 1
    }
  });
}

export async function updateCartQuantity(userId: number, productId: number, quantity: number) {
  if (quantity <= 0) {
    return prisma.cart.deleteMany({ where: { userId, productId } });
  }
  return prisma.cart.updateMany({ where: { userId, productId }, data: { quantity, updatedAt: new Date() } });
}

export async function removeCartItem(userId: number, productId: number) {
  return prisma.cart.deleteMany({ where: { userId, productId } });
}

export async function clearCart(userId: number) {
  return prisma.cart.deleteMany({ where: { userId } });
}
