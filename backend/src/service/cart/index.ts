import prisma from '../../lib/prisma';

export async function getCart(customerId: number) {
  return prisma.cart.findMany({ where: { customerId }, orderBy: { updatedAt: 'desc' } });
}

export async function addOrIncrementCartItem(customerId: number, product: any) {
  return prisma.cart.upsert({
    where: { customerId_productId: { customerId, productId: product.productId } } as any,
    update: {
      quantity: { increment: product.quantity || 1 },
      updatedAt: new Date(),
    },
    create: {
      customerId,
      productId: product.productId,
      productName: product.productName,
      price: product.price || 0,
      image: product.image || null,
      productUnits: product.productUnits || null,
      unitsOfMeasurement: product.unitsOfMeasurement || null,
      minOrderQuantity: product.minOrderQuantity || product.quantity || 1,
      quantity: product.quantity || 1,
    },
  });
}

export async function updateCartQuantity(customerId: number, productId: number, quantity: number) {
  if (quantity <= 0) {
    // Check minOrderQuantity before deleting — prevent accidental removal
    const existing = await prisma.cart.findFirst({ where: { customerId, productId } });
    const minQty = existing?.minOrderQuantity || 1;
    if (quantity <= 0 && existing) {
      // Instead of deleting, enforce minimum quantity
      return prisma.cart.updateMany({ where: { customerId, productId }, data: { quantity: minQty, updatedAt: new Date() } });
    }
    return prisma.cart.deleteMany({ where: { customerId, productId } });
  }
  
  // Enforce minimum order quantity on update
  const existing = await prisma.cart.findFirst({ where: { customerId, productId } });
  const minQty = existing?.minOrderQuantity || 1;
  const safeQuantity = Math.max(quantity, minQty);
  
  return prisma.cart.updateMany({ where: { customerId, productId }, data: { quantity: safeQuantity, updatedAt: new Date() } });
}

export async function removeCartItem(customerId: number, productId: number) {
  return prisma.cart.deleteMany({ where: { customerId, productId } });
}

export async function clearCart(customerId: number) {
  return prisma.cart.deleteMany({ where: { customerId } });
}
