/**
 * Execute Invoice Seed Script for CustomerID 2084
 * 
 * This script:
 * 1. Connects to the database
 * 2. Executes the seed_invoices_customer_2084.sql file
 * 3. Verifies the inserted data
 * 4. Provides a summary report
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function executeSeedScript() {
    let connection;
    
    try {
        console.log('🔌 Connecting to database...');
        
        // Parse DATABASE_URL from .env
        const dbUrl = process.env.DATABASE_URL;
        const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
        const match = dbUrl.match(urlPattern);
        
        if (!match) {
            throw new Error('Invalid DATABASE_URL format');
        }
        
        const [, user, password, host, port, database] = match;
        
        // Create connection
        connection = await mysql.createConnection({
            host: host,
            port: parseInt(port),
            user: user,
            password: password,
            database: database,
            multipleStatements: true
        });
        
        console.log('✅ Database connected successfully!\n');
        
        // Check if CustomerID 2084 exists
        console.log('🔍 Checking prerequisites...');
        const [customers] = await connection.execute(
            'SELECT CUSTOMERID, CUSTOMERNAME FROM CUSTOMERMASTER WHERE CUSTOMERID = ?',
            [2084]
        );
        
        if (customers.length === 0) {
            console.log('⚠️  CustomerID 2084 does not exist in CUSTOMERMASTER');
            console.log('Creating test customer...');
            
            await connection.execute(`
                INSERT INTO CUSTOMERMASTER (
                    CUSTOMERID, CUSTOMERNAME, ADDRESS, PHONENO, CUSTOMERTYPEID, 
                    ContactPersonName, GSTIN, CITY, PINCODE, ACTIVE, ORDERDAYS
                ) VALUES (
                    2084, 'Test Customer 2084', '123 Test Street', '9876543210', 1,
                    'Test Contact', 'TEST123456789', 'Test City', 560001, 1, '1,2,3,4,5,6'
                )
            `);
            
            console.log('✅ Test customer created\n');
        } else {
            console.log(`✅ CustomerID 2084 exists: ${customers[0].CUSTOMERNAME}\n`);
        }
        
        // Check existing invoices
        const [existingInvoices] = await connection.execute(
            'SELECT COUNT(*) as count FROM Invoices WHERE CustomerID = ?',
            [2084]
        );
        
        if (existingInvoices[0].count > 0) {
            console.log(`⚠️  Found ${existingInvoices[0].count} existing invoices for CustomerID 2084`);
            console.log('Do you want to delete them before proceeding? (You may need to manually delete)');
            console.log('   DELETE FROM PAYMENTS WHERE AccountID IN (SELECT AccountID FROM ACCOUNTSMASTER WHERE CustomerID = 2084);');
            console.log('   DELETE FROM Invoices WHERE CustomerID = 2084;');
            console.log('   DELETE FROM ACCOUNTSMASTER WHERE CustomerID = 2084;\n');
        }
        
        // Read and execute seed script
        console.log('📄 Reading seed script...');
        const scriptPath = path.join(__dirname, 'seed_invoices_customer_2084.sql');
        const sqlScript = await fs.readFile(scriptPath, 'utf8');
        
        console.log('🚀 Executing seed script...');
        console.log('This may take a few moments...\n');
        
        // Execute the script
        await connection.query(sqlScript);
        
        console.log('✅ Seed script executed successfully!\n');
        
        // Verify inserted data
        console.log('🔍 Verifying inserted data...\n');
        
        // Count invoices
        const [invoices] = await connection.execute(
            'SELECT COUNT(*) as count FROM Invoices WHERE CustomerID = ?',
            [2084]
        );
        console.log(`   📋 Invoices inserted: ${invoices[0].count}`);
        
        // Count payments
        const [payments] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM PAYMENTS 
            WHERE AccountID IN (SELECT AccountID FROM ACCOUNTSMASTER WHERE CustomerID = ?)
        `, [2084]);
        console.log(`   💳 Payments inserted: ${payments[0].count}`);
        
        // Check account balance
        const [account] = await connection.execute(
            'SELECT AccountID, BalanceAmount FROM ACCOUNTSMASTER WHERE CustomerID = ?',
            [2084]
        );
        if (account.length > 0) {
            console.log(`   💰 Account Balance: ₹${account[0].BalanceAmount}`);
            console.log(`   🔑 AccountID: ${account[0].AccountID}`);
        }
        
        // Show date range
        const [dateRange] = await connection.execute(`
            SELECT 
                MIN(InvoiceDate) as FirstInvoice,
                MAX(InvoiceDate) as LastInvoice
            FROM Invoices 
            WHERE CustomerID = ?
        `, [2084]);
        
        if (dateRange[0].FirstInvoice) {
            console.log(`   📅 Invoice Date Range: ${dateRange[0].FirstInvoice.toISOString().split('T')[0]} to ${dateRange[0].LastInvoice.toISOString().split('T')[0]}`);
        }
        
        // Show sample invoices
        console.log('\n📊 Sample Invoices:');
        const [sampleInvoices] = await connection.execute(`
            SELECT InvoiceNumber, InvoiceDate, GrossInvoiceAmount, BalanceAmount
            FROM Invoices 
            WHERE CustomerID = ?
            ORDER BY InvoiceDate
            LIMIT 5
        `, [2084]);
        
        console.log('┌─────────────────┬─────────────────────┬────────────┬──────────────┐');
        console.log('│ Invoice Number  │ Date                │ Amount     │ Balance      │');
        console.log('├─────────────────┼─────────────────────┼────────────┼──────────────┤');
        sampleInvoices.forEach(inv => {
            const invNum = inv.InvoiceNumber.padEnd(15);
            const date = inv.InvoiceDate.toISOString().split('T')[0].padEnd(19);
            const amount = `₹${inv.GrossInvoiceAmount}`.padEnd(10);
            const balance = `₹${inv.BalanceAmount}`.padEnd(12);
            console.log(`│ ${invNum} │ ${date} │ ${amount} │ ${balance} │`);
        });
        console.log('└─────────────────┴─────────────────────┴────────────┴──────────────┘');
        
        console.log('\n✅ Seed script completed successfully!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Test the API endpoint: POST /invoices/by-customer');
        console.log('   2. Use CustomerID: 2084 in your request body');
        console.log('   3. Date range: June 2025 to September 2025\n');
        
    } catch (error) {
        console.error('❌ Error executing seed script:');
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the script
executeSeedScript();
