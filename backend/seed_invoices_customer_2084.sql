-- =====================================================
-- Seed Invoice Data for CustomerID 2084
-- =====================================================
-- This script populates invoice data for testing the 
-- POST /invoices/by-customer endpoint with CustomerID 2084
-- 
-- External API data converted to match database schema
-- =====================================================

-- Step 1: Ensure CustomerID 2084 exists (verify manually or uncomment to create)
-- Uncomment if you need to create the customer:
/*
INSERT INTO CUSTOMERMASTER (
    CUSTOMERID, CUSTOMERNAME, ADDRESS, PHONENO, CUSTOMERTYPEID, 
    ContactPersonName, GSTIN, CITY, PINCODE, ACTIVE, ORDERDAYS
) VALUES (
    2084, 'Test Customer 2084', '123 Test Street', '9876543210', 1,
    'Test Contact', 'TEST123456789', 'Test City', 560001, 1, '1,2,3,4,5,6'
);
*/

-- Step 2: Get or Create AccountID for CustomerID 2084
-- First check if account exists:
-- SELECT * FROM ACCOUNTSMASTER WHERE CustomerID = 2084;

-- Create account if it doesn't exist:
INSERT INTO ACCOUNTSMASTER (CustomerID, BalanceAmount, Active)
SELECT 2084, 0.0, 1
WHERE NOT EXISTS (SELECT 1 FROM ACCOUNTSMASTER WHERE CustomerID = 2084);

-- Get the AccountID (you'll need this for later steps)
SET @AccountID = (SELECT AccountID FROM ACCOUNTSMASTER WHERE CustomerID = 2084 LIMIT 1);

-- Step 3: Ensure PaymentModeMaster has required payment modes
-- Check existing payment modes:
-- SELECT * FROM PaymentModeMaster;

-- Insert payment modes if they don't exist:
INSERT INTO PaymentModeMaster (PaymentMode, Description)
SELECT 'Cash', 'Cash Payment'
WHERE NOT EXISTS (SELECT 1 FROM PaymentModeMaster WHERE PaymentMode = 'Cash');

INSERT INTO PaymentModeMaster (PaymentMode, Description)
SELECT 'Cheque', 'Cheque Payment'
WHERE NOT EXISTS (SELECT 1 FROM PaymentModeMaster WHERE PaymentMode = 'Cheque');

INSERT INTO PaymentModeMaster (PaymentMode, Description)
SELECT 'UPI', 'UPI Payment'
WHERE NOT EXISTS (SELECT 1 FROM PaymentModeMaster WHERE PaymentMode = 'UPI');

-- Get PaymentModeIDs
SET @CashModeID = (SELECT PaymentModeID FROM PaymentModeMaster WHERE PaymentMode = 'Cash' LIMIT 1);
SET @ChequeModeID = (SELECT PaymentModeID FROM PaymentModeMaster WHERE PaymentMode = 'Cheque' LIMIT 1);
SET @UPIModeID = (SELECT PaymentModeID FROM PaymentModeMaster WHERE PaymentMode = 'UPI' LIMIT 1);

-- Step 4: Create a placeholder Order for these invoices (required by FK constraint)
-- Insert a dummy order if it doesn't exist
INSERT INTO Orders (CustomerID, OrderDate, OrderStatus, TotalAmount, CreationDate)
SELECT 2084, '2025-06-01 00:00:00', 'COMPLETED', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM Orders WHERE CustomerID = 2084 LIMIT 1);

-- Get the OrderID
SET @OrderID = (SELECT OrderID FROM Orders WHERE CustomerID = 2084 LIMIT 1);

-- =====================================================
-- Step 5: Insert Invoices (40 invoices from external API)
-- =====================================================
-- Note: .NET Ticks converted to MySQL DateTime
-- Formula: (ticks - 621355968000000000) / 10000 = milliseconds since Unix epoch
-- =====================================================

-- Invoice 1: invoiceID 128511
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV28232', '2025-06-04 09:27:11', 2084, @OrderID,
    1925.0, 0.0, 1925.0, 3620.6, 'COMPLETED', 0
);

-- Invoice 2: invoiceID 128700
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV28382', '2025-06-06 09:22:15', 2084, @OrderID,
    2733.5, 0.0, 2733.5, -2812.5, 'COMPLETED', 0
);

-- Invoice 3: invoiceID 128882
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV28544', '2025-06-09 09:25:42', 2084, @OrderID,
    2035.0, 0.0, 2035.0, -698.0, 'COMPLETED', 0
);

-- Invoice 4: invoiceID 129135
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV28777', '2025-06-11 09:43:10', 2084, @OrderID,
    1045.0, 0.0, 1045.0, -990.0, 'COMPLETED', 0
);

-- Invoice 5: invoiceID 129323
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV28851', '2025-06-13 09:37:38', 2084, @OrderID,
    1567.5, 0.0, 1567.5, 522.5, 'COMPLETED', 0
);

-- Invoice 6: invoiceID 129559
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV29057', '2025-06-16 09:53:12', 2084, @OrderID,
    1254.0, 0.0, 1254.0, -313.0, 'COMPLETED', 0
);

-- Invoice 7: invoiceID 129829
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV29301', '2025-06-18 09:21:47', 2084, @OrderID,
    1804.0, 0.0, 1804.0, 550.0, 'COMPLETED', 0
);

-- Invoice 8: invoiceID 130030
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV29480', '2025-06-20 09:35:05', 2084, @OrderID,
    1886.5, 0.0, 1886.5, 82.5, 'COMPLETED', 0
);

-- Invoice 9: invoiceID 130242
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M6-INV10372', '2025-06-23 09:56:52', 2084, @OrderID,
    1683.0, 0.0, 1683.0, -204.0, 'COMPLETED', 0
);

-- Invoice 10: invoiceID 130485
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M2-INV27020', '2025-06-25 10:34:40', 2084, @OrderID,
    2651.0, 0.0, 2651.0, 968.0, 'COMPLETED', 0
);

-- Invoice 11: invoiceID 130638
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M6-INV10577', '2025-06-27 09:40:44', 2084, @OrderID,
    1870.0, 0.0, 1870.0, -781.0, 'COMPLETED', 0
);

-- Invoice 12: invoiceID 130839
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV29640', '2025-06-30 09:27:46', 2084, @OrderID,
    1111.0, 0.0, 1111.0, -759.0, 'COMPLETED', 0
);

-- Invoice 13: invoiceID 131079
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV29713', '2025-07-02 09:38:40', 2084, @OrderID,
    3068.0, 0.0, 3068.0, 1957.0, 'COMPLETED', 0
);

-- Invoice 14: invoiceID 131080 (Zero amount invoice)
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV29714', '2025-07-02 09:38:41', 2084, @OrderID,
    0.0, 0.0, 0.0, 0.0, 'COMPLETED', 0
);

-- Invoice 15: invoiceID 131504
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV30090', '2025-07-05 09:50:11', 2084, @OrderID,
    2372.9, 0.0, 2372.9, 2372.9, 'COMPLETED', 0
);

-- Invoice 16: invoiceID 131536
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV30111', '2025-07-07 09:27:00', 2084, @OrderID,
    2354.6, 0.0, 2354.6, -3086.4, 'COMPLETED', 0
);

-- Invoice 17: invoiceID 131808
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV30348', '2025-07-09 09:53:53', 2084, @OrderID,
    2196.0, 0.0, 2196.0, -158.0, 'COMPLETED', 0
);

-- Invoice 18: invoiceID 132054
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV30566', '2025-07-11 10:54:47', 2084, @OrderID,
    2684.6, 0.0, 2684.6, 2684.6, 'COMPLETED', 0
);

-- Invoice 19: invoiceID 132244
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV30729', '2025-07-14 09:44:55', 2084, @OrderID,
    1382.6, 0.0, 1382.6, -3498.4, 'COMPLETED', 0
);

-- Invoice 20: invoiceID 132664
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M5-INV03150', '2025-07-18 09:29:41', 2084, @OrderID,
    2608.2, 0.0, 2608.2, 2608.2, 'COMPLETED', 0
);

-- Invoice 21: invoiceID 132893
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M2-INV27342', '2025-07-21 09:47:43', 2084, @OrderID,
    2244.0, 0.0, 2244.0, -1746.0, 'COMPLETED', 0
);

-- Invoice 22: invoiceID 133152
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M2-INV27573', '2025-07-23 09:59:48', 2084, @OrderID,
    1485.0, 0.0, 1485.0, 1485.0, 'COMPLETED', 0
);

-- Invoice 23: invoiceID 133311
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M2-INV27697', '2025-07-25 09:44:54', 2084, @OrderID,
    1375.0, 0.0, 1375.0, -2354.0, 'COMPLETED', 0
);

-- Invoice 24: invoiceID 133781
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV30833', '2025-07-30 09:45:21', 2084, @OrderID,
    3469.2, 0.0, 3469.2, 2094.2, 'COMPLETED', 0
);

-- Invoice 25: invoiceID 133990
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV30992', '2025-08-01 09:42:57', 2084, @OrderID,
    1616.6, 0.0, 1616.6, -1852.4, 'COMPLETED', 0
);

-- Invoice 26: invoiceID 134199
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV31174', '2025-08-04 09:21:11', 2084, @OrderID,
    1888.0, 0.0, 1888.0, 272.0, 'COMPLETED', 0
);

-- Invoice 27: invoiceID 134495
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV31439', '2025-08-06 10:08:39', 2084, @OrderID,
    1947.0, 0.0, 1947.0, 59.0, 'COMPLETED', 0
);

-- Invoice 28: invoiceID 134738 (Zero amount invoice)
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV31639', '2025-08-08 09:19:34', 2084, @OrderID,
    0.0, 0.0, 0.0, 0.0, 'COMPLETED', 0
);

-- Invoice 29: invoiceID 134921
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV31797', '2025-08-11 10:06:48', 2084, @OrderID,
    3266.4, 0.0, 3266.4, 3266.4, 'COMPLETED', 0
);

-- Invoice 30: invoiceID 135382
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV32183', '2025-08-15 10:30:10', 2084, @OrderID,
    3186.0, 0.0, 3186.0, 3186.0, 'COMPLETED', 0
);

-- Invoice 31: invoiceID 135628
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV32398', '2025-08-18 09:38:01', 2084, @OrderID,
    2690.4, 0.0, 2690.4, -497.6, 'COMPLETED', 0
);

-- Invoice 32: invoiceID 136102
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV32803', '2025-08-22 09:37:39', 2084, @OrderID,
    3469.2, 0.0, 3469.2, 779.2, 'COMPLETED', 0
);

-- Invoice 33: invoiceID 136340
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV33002', '2025-08-25 09:51:08', 2084, @OrderID,
    2006.0, 0.0, 2006.0, -1463.0, 'COMPLETED', 0
);

-- Invoice 34: invoiceID 136627
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M5-INV03463', '2025-08-27 10:54:40', 2084, @OrderID,
    1705.1, 0.0, 1705.1, 1705.1, 'COMPLETED', 0
);

-- Invoice 35: invoiceID 136850
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV33411', '2025-08-29 10:41:38', 2084, @OrderID,
    1792.0, 0.0, 1792.0, 1792.0, 'COMPLETED', 0
);

-- Invoice 36: invoiceID 137501
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV33954', '2025-09-03 09:58:47', 2084, @OrderID,
    2632.0, 0.0, 2632.0, -2871.0, 'COMPLETED', 0
);

-- Invoice 37: invoiceID 137829
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M2-INV28136', '2025-09-08 10:12:02', 2084, @OrderID,
    3057.6, 0.0, 3057.6, 3057.6, 'COMPLETED', 0
);

-- Invoice 38: invoiceID 138076
INSERT INTO Invoices (
    InvoiceNumber, InvoiceDate, CustomerID, OrderID, 
    GrossInvoiceAmount, DiscountAmount, NetInvoiceAmount, 
    BalanceAmount, InvoiceStatus, InvoiceItemCount
) VALUES (
    'M3-INV34182', '2025-09-10 10:22:59', 2084, @OrderID,
    2784.0, 0.0, 2784.0, 2784.0, 'COMPLETED', 0
);

-- =====================================================
-- Step 6: Insert PAYMENTS for each invoice
-- =====================================================
-- Only create payment records where payment amount > 0
-- =====================================================

-- Payments for Invoice M3-INV28382 (upiAmount: 5546)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-06 09:22:15',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV28382' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    5546.0,
    'UPI Payment for M3-INV28382',
    1
);

-- Payments for Invoice M3-INV28544 (upiAmount: 2733)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-09 09:25:42',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV28544' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    2733.0,
    'UPI Payment for M3-INV28544',
    1
);

-- Payments for Invoice M3-INV28777 (upiAmount: 2035)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-11 09:43:10',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV28777' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    2035.0,
    'UPI Payment for M3-INV28777',
    1
);

-- Payments for Invoice M3-INV28851 (upiAmount: 1045)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-13 09:37:38',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV28851' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1045.0,
    'UPI Payment for M3-INV28851',
    1
);

-- Payments for Invoice M3-INV29057 (upiAmount: 1567)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-16 09:53:12',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV29057' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1567.0,
    'UPI Payment for M3-INV29057',
    1
);

-- Payments for Invoice M3-INV29301 (upiAmount: 1254)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-18 09:21:47',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV29301' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1254.0,
    'UPI Payment for M3-INV29301',
    1
);

-- Payments for Invoice M3-INV29480 (upiAmount: 1804)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-20 09:35:05',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV29480' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1804.0,
    'UPI Payment for M3-INV29480',
    1
);

-- Payments for Invoice M6-INV10372 (upiAmount: 1888)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-23 09:56:52',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M6-INV10372' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1888.0,
    'UPI Payment for M6-INV10372',
    1
);

-- Payments for Invoice M2-INV27020 (upiAmount: 1683)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-25 10:34:40',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M2-INV27020' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1683.0,
    'UPI Payment for M2-INV27020',
    1
);

-- Payments for Invoice M6-INV10577 (upiAmount: 2651)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-27 09:40:44',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M6-INV10577' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    2651.0,
    'UPI Payment for M6-INV10577',
    1
);

-- Payments for Invoice M3-INV29640 (upiAmount: 1870)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-06-30 09:27:46',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV29640' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1870.0,
    'UPI Payment for M3-INV29640',
    1
);

-- Payments for Invoice M3-INV29713 (upiAmount: 1111)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-07-02 09:38:40',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV29713' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1111.0,
    'UPI Payment for M3-INV29713',
    1
);

-- Payments for Invoice M3-INV30111 (upiAmount: 5441)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-07-07 09:27:00',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV30111' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    5441.0,
    'UPI Payment for M3-INV30111',
    1
);

-- Payments for Invoice M3-INV30348 (upiAmount: 2354)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-07-09 09:53:53',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV30348' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    2354.0,
    'UPI Payment for M3-INV30348',
    1
);

-- Payments for Invoice M3-INV30729 (upiAmount: 4881)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-07-14 09:44:55',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV30729' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    4881.0,
    'UPI Payment for M3-INV30729',
    1
);

-- Payments for Invoice M2-INV27342 (upiAmount: 3990)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-07-21 09:47:43',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M2-INV27342' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    3990.0,
    'UPI Payment for M2-INV27342',
    1
);

-- Payments for Invoice M2-INV27697 (upiAmount: 3729)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-07-25 09:44:54',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M2-INV27697' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    3729.0,
    'UPI Payment for M2-INV27697',
    1
);

-- Payments for Invoice M3-INV30833 (upiAmount: 1375)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-07-30 09:45:21',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV30833' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1375.0,
    'UPI Payment for M3-INV30833',
    1
);

-- Payments for Invoice M3-INV30992 (upiAmount: 3469)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-08-01 09:42:57',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV30992' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    3469.0,
    'UPI Payment for M3-INV30992',
    1
);

-- Payments for Invoice M3-INV31174 (upiAmount: 1616)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-08-04 09:21:11',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV31174' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1616.0,
    'UPI Payment for M3-INV31174',
    1
);

-- Payments for Invoice M3-INV31439 (upiAmount: 1888)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-08-06 10:08:39',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV31439' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    1888.0,
    'UPI Payment for M3-INV31439',
    1
);

-- Payment entry for '2025-08-12 09:20:22' (standalone payment, upiAmount: 1947)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-08-12 09:20:22',
    NULL,  -- No invoice ID in external data
    @AccountID,
    @UPIModeID,
    1947.0,
    'UPI Payment - Standalone',
    1
);

-- Payment entry for '2025-08-16 09:30:43' (standalone payment, upiAmount: 3266)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-08-16 09:30:43',
    NULL,  -- No invoice ID in external data
    @AccountID,
    @UPIModeID,
    3266.0,
    'UPI Payment - Standalone',
    1
);

-- Payments for Invoice M3-INV32398 (upiAmount: 3188)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-08-18 09:38:01',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV32398' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    3188.0,
    'UPI Payment for M3-INV32398',
    1
);

-- Payments for Invoice M3-INV32803 (upiAmount: 2690)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-08-22 09:37:39',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV32803' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    2690.0,
    'UPI Payment for M3-INV32803',
    1
);

-- Payments for Invoice M3-INV33002 (upiAmount: 3469)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-08-25 09:51:08',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV33002' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    3469.0,
    'UPI Payment for M3-INV33002',
    1
);

-- Payments for Invoice M3-INV33954 (upiAmount: 5503)
INSERT INTO PAYMENTS (PaymentDate, InvoiceID, AccountID, PaymentModeID, PaymentAmount, Description, Active)
VALUES (
    '2025-09-03 09:58:47',
    (SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = 'M3-INV33954' AND CustomerID = 2084),
    @AccountID,
    @UPIModeID,
    5503.0,
    'UPI Payment for M3-INV33954',
    1
);

-- =====================================================
-- Step 7: Update Account Balance with final balance
-- =====================================================

UPDATE ACCOUNTSMASTER 
SET BalanceAmount = 2784.0,  -- Final balance from last invoice
    LastUpdatedDate = NOW()
WHERE CustomerID = 2084;

-- =====================================================
-- Step 8: Verification Queries
-- =====================================================
-- Uncomment to verify the inserted data:

-- Check all invoices for CustomerID 2084
-- SELECT * FROM Invoices WHERE CustomerID = 2084 ORDER BY InvoiceDate;

-- Check all payments for this account
-- SELECT p.*, i.InvoiceNumber 
-- FROM PAYMENTS p
-- LEFT JOIN Invoices i ON p.InvoiceID = i.InvoiceID
-- WHERE p.AccountID = @AccountID
-- ORDER BY p.PaymentDate;

-- Check account balance
-- SELECT * FROM ACCOUNTSMASTER WHERE CustomerID = 2084;

-- Count records
-- SELECT 
--     (SELECT COUNT(*) FROM Invoices WHERE CustomerID = 2084) AS InvoiceCount,
--     (SELECT COUNT(*) FROM PAYMENTS WHERE AccountID = @AccountID) AS PaymentCount;

-- =====================================================
-- End of Seed Script
-- =====================================================
