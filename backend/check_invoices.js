require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvoices(customerId) {
  try {
    const count = await prisma.invoices.count({ where: { CustomerID: customerId } });
    console.log(`Invoices count for CustomerID ${customerId}:`, count);
    if (count > 0) {
      const sample = await prisma.invoices.findMany({ where: { CustomerID: customerId }, take: 5, orderBy: { InvoiceDate: 'desc' } });
      console.log('Sample invoices:', sample);
    }
  } catch (err) {
    console.error('Error querying invoices:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoices(2005);
