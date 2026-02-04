import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const SimpleInvoiceButton = ({ saleData }) => {
  const generateInvoice = () => {
    // 1. إنشاء المستند
    const doc = new jsPDF(); // الحجم الافتراضي A4

    // 2. رسم الهيدر (مثال بسيط)
    doc.setFontSize(20);
    doc.text("LIME COMPUTER TRADING LLC", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text("P.O. Box 9627, Al Sabkha Road, Deira, Dubai, U.A.E", 105, 27, { align: 'center' });
    doc.text("TRN No: 100269160600003", 105, 34, { align: 'center' });

    doc.setFontSize(16);
    doc.text("TAX INVOICE", 105, 45, { align: 'center' });

    // 3. رسم جدول الأصناف (ده أهم جزء)
    const tableColumn = ["S.No", "Description", "Qty", "Rate", "Amount"];
    const tableRows = [];

    // جلب البيانات من الـ props (مثال)
    const items = saleData?.items || [
      { name: "Hp Printer M414W", quantity: 1, price: 435.00 }
    ];
    
    let total = 0;
    items.forEach((item, index) => {
      const amount = item.quantity * item.price;
      total += amount;
      
      const itemData = [
        index + 1,
        item.name,
        item.quantity,
        item.price.toFixed(2),
        amount.toFixed(2)
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 60, // المكان اللي هيبدأ منه الجدول
    });

    // 4. رسم الإجماليات (مثال بسيط جداً)
    // (autoTable بيرجع Y-coordinate لآخر الجدول)
    let finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`INVOICE TOTAL: ${total.toFixed(2)} AED`, 150, finalY + 10);
    
    // 5. (مهم) تحويل المبلغ لحروف (محتاج مكتبة زي 'to-words')
    // const { ToWords } = require('to-words');
    // const toWords = new ToWords({ localeCode: 'en-AE', currency: true });
    // const words = toWords.convert(total);
    // doc.text(words, 14, finalY + 20);

    // 6. فتح الـ PDF في نافذة جديدة
    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <Button 
      onClick={generateInvoice}
      variant="outlined"
      startIcon={<PrintIcon />}
      sx={{ ml: 1 }}
    >
      طباعة فاتورة A4
    </Button>
  );
};

export default SimpleInvoiceButton;