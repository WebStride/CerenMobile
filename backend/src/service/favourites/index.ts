import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserFavourites(userId: number) {
  return prisma.userFavourites.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' }
  });
}

export async function addUserFavourite(userId: number, product: any) {
  // upsert to avoid duplicate unique constraint error
  return prisma.userFavourites.upsert({
    where: { userId_productId: { userId, productId: product.productId } as any },
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
      userId,
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

export async function removeUserFavourite(userId: number, productId: number) {
  return prisma.userFavourites.deleteMany({
    where: {
      userId,
      productId
    }
  });
}
