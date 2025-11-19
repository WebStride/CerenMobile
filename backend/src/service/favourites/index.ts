import prisma from '../../lib/prisma';

export async function getUserFavourites(customerId: number) {
  return prisma.userFavourites.findMany({
    where: { customerId },
    orderBy: { addedAt: 'desc' }
  });
}

export async function addUserFavourite(customerId: number, product: any) {
  // upsert to avoid duplicate unique constraint error
  return prisma.userFavourites.upsert({
    where: { customerId_productId: { customerId, productId: product.productId } as any },
    update: {
      productName: product.productName,
      price: product.price || 0,
      image: product.image || null,
      productUnits: product.productUnits || 0,
      unitsOfMeasurement: product.unitsOfMeasurement || null,
      minOrderQuantity: product.minOrderQuantity || 1,
      addedAt: new Date()
    },
    create: {
      customerId,
      productId: product.productId,
      productName: product.productName,
      price: product.price || 0,
      image: product.image || null,
      productUnits: product.productUnits || 0,
      unitsOfMeasurement: product.unitsOfMeasurement || null,
      minOrderQuantity: product.minOrderQuantity || 1
    }
  });
}

export async function removeUserFavourite(customerId: number, productId: number) {
  return prisma.userFavourites.deleteMany({
    where: {
      customerId,
      productId
    }
  });
}
