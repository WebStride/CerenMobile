import prisma from '../../lib/prisma';

export async function getCart(customerId: number) {
  return prisma.cart.findMany({ where: { customerId }, orderBy: { updatedAt: 'desc' } });
}

export async function addOrIncrementCartItem(customerId: number, product: any) {
  const whereAny = { customerId_productId: { customerId, productId: product.productId } } as any;
  const existing = await prisma.cart.findUnique({ where: whereAny }).catch(() => null);
  
  if (existing) {
    // If item exists, add the new quantity to existing quantity
    const newQuantity = existing.quantity + (product.quantity || 1);
    return prisma.cart.update({ 
      where: { id: existing.id }, 
      data: { 
        quantity: newQuantity, 
        updatedAt: new Date() 
      } 
    });
  }

  return prisma.cart.create({
    data: {
      customerId,
      productId: product.productId,
      productName: product.productName,
      price: product.price || 0,
      image: product.image || null,
      productUnits: product.productUnits || null,
      unitsOfMeasurement: product.unitsOfMeasurement || null,
      minOrderQuantity: product.minOrderQuantity || product.quantity || 1,
      quantity: product.quantity || 1
    }
  });
}

export async function updateCartQuantity(customerId: number, productId: number, quantity: number) {
  if (quantity <= 0) {
    return prisma.cart.deleteMany({ where: { customerId, productId } });
  }
  return prisma.cart.updateMany({ where: { customerId, productId }, data: { quantity, updatedAt: new Date() } });
}

export async function removeCartItem(customerId: number, productId: number) {
  return prisma.cart.deleteMany({ where: { customerId, productId } });
}

export async function clearCart(customerId: number) {
  return prisma.cart.deleteMany({ where: { customerId } });
}
