// 
import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToWords } from 'to-words';
import { Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import logo from '../../assets/logo/logo-nasmat-jamal.svg'; // Import the logo
import * as arabicReshaper from 'arabic-reshaper'; // --- مُعدل ---: الاستيراد الصحيح لمكتبة تشكيل العربية

const A4InvoiceGenerator = ({ saleData, companyInfo }) => {

  // --- جديد ---: دالة لتحميل الخط من مجلد public وتحويله لـ Base64 مع تحقق صارم
  const loadFontAsBase64 = async (url) => {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Font fetch failed: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    // تحقق بسيط من النوع عند الإمكان
    const type = blob.type || '';
    if (type && !(type.includes('font') || type.includes('application/octet-stream'))) {
      // في بعض سير العمل قد يكون النوع فارغاً، لذا لا نفشل إلا إذا كان النوع غير مناسب صراحةً
      console.warn('Unexpected font MIME type:', type);
    }
    const reader = new FileReader();
    const base64data = await new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result || '';
        const commaIndex = String(result).indexOf(',');
        if (commaIndex === -1) {
          return reject(new Error('Invalid DataURL format for font'));
        }
        resolve(String(result).slice(commaIndex + 1));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return base64data;
  };

  // --- جديد ---: دالة مساعدة لاختيار دالة reshape المتاحة (تدعم default أو named export)
  const getArabicReshapeFn = () => {
    try {
      if (arabicReshaper && typeof arabicReshaper.reshape === 'function') {
        return arabicReshaper.reshape;
      }
      if (arabicReshaper && typeof arabicReshaper.default === 'function') {
        return arabicReshaper.default;
      }
    } catch (_) {
      // تجاهل أي أخطاء وصول للوحدات المجمعة
    }
    return null;
  };

  // Helper: load image URL and convert to PNG data URL
  const loadImageAsDataURL = (url) => new Promise((resolve, reject) => {
    // ... (الكود الخاص بك كما هو، لا تغيير)
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = url;
    } catch (err) {
      reject(err);
    }
  });

  // إعداد تحويل الأرقام إلى كلمات (إنجليزي)
  const toWords = new ToWords({
    // ... (الكود الخاص بك كما هو)
  });

  // دالة تحويل الأرقام إلى كلمات بالعربية
  const numberToArabicWords = (num) => {
    // --- مُعدل ---: تصحيح الأخطاء الإملائية ("ثلاة" بدلاً من "ثلاة")
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    // ... (باقي الكود الخاص بك كما هو)
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    
    if (num === 0) return 'صفر';
    
    let result = '';
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    // تحويل الجزء الصحيح
    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      result += ones[thousands] + ' ألف ';
    }
    
    const remainder = integerPart % 1000;
    if (remainder >= 100) {
      result += hundreds[Math.floor(remainder / 100)] + ' ';
    }
    
    const lastTwo = remainder % 100;
    if (lastTwo >= 20) {
      result += tens[Math.floor(lastTwo / 10)] + ' ';
      if (lastTwo % 10 > 0) {
        result += ones[lastTwo % 10] + ' ';
      }
    } else if (lastTwo >= 10) {
      result += teens[lastTwo - 10] + ' ';
    } else if (lastTwo > 0) {
      result += ones[lastTwo] + ' ';
    }
    
    result += 'درهم';
    
    // إضافة الفلوس إذا وجدت
    if (decimalPart > 0) {
      result += ' و ';
      if (decimalPart >= 20) {
        result += tens[Math.floor(decimalPart / 10)] + ' ';
        if (decimalPart % 10 > 0) {
          result += ones[decimalPart % 10] + ' ';
        }
      } else if (decimalPart >= 10) {
        result += teens[decimalPart - 10] + ' ';
      } else {
        result += ones[decimalPart] + ' ';
      }
      result += 'فلس';
    }
    
    return result.trim();
  };


  const generateInvoice = async () => {
    try {
      // إنشاء مستند PDF جديد
      const doc = new jsPDF('p', 'mm', 'a4');

      // --- جديد ---: تحميل الخط العربي وتضمينه في الـ PDF
      // تأكد من وضع ملف Amiri-Regular.ttf في مجلد public/fonts
      let amiriFontBase64;
      let amiriReady = false;
      try {
        amiriFontBase64 = await loadFontAsBase64('/fonts/Amiri-Regular.ttf');
        if (!amiriFontBase64 || amiriFontBase64.length < 1000) {
          throw new Error('Loaded font data is too small or empty');
        }
        doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        amiriReady = true;
      } catch (e) {
        console.error('خطأ في تحميل/تضمين الخط العربي:', e);
        // لا نعرض تنبيه مزعج للمستخدم، نكتفي بالسقوط اللطيف دون العربية
      }
      // --- نهاية الكود الجديد ---
      
      // رسم الإطار الخارجي
      doc.setLineWidth(0.2);
      doc.rect(5, 5, 200, 287); // إطار حول الصفحة بالكامل

      // === الهيدر ===
      // الشعار على اليسار
      const logoDataUrl = await loadImageAsDataURL(logo);
      doc.addImage(logoDataUrl, 'PNG', 15, 15, 30, 30);

      // اسم الشركة (الإنجليزية)
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('NASMAT JAMAL', 50, 25);

      // --- جديد ---: إضافة اسم الشركة بالعربي
      if (amiriReady) {
        const reshapeFn = getArabicReshapeFn();
        if (reshapeFn) {
          const arabicTitle = 'نسمات جمال'; // اسم الشركة بالعربي
          const reshapedTitle = reshapeFn(arabicTitle);
          doc.setFont('Amiri'); // استخدام الخط العربي
          doc.setFontSize(14);
          // الطباعة من اليمين (نقطة X هي الهامش الأيمن)
          doc.text(reshapedTitle, 195, 25, { align: 'right' });
        }
      }
      // --- نهاية الكود الجديد ---

      // تفاصيل المتجر (ديناميكية حسب المتاح)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let headerY = 35;
      const addHeaderLine = (text, dy = 7) => {
        // ... (الكود الخاص بك كما هو)
      };

      const addressLine = companyInfo?.address || "Dubai-Al sabkha, Dubai, UAE"; // --- مُعدل ---: إضافة قيمة افتراضية
      addHeaderLine(addressLine);

      if (companyInfo?.trn) {
        addHeaderLine(`TRN No: ${companyInfo.trn}`, 5);
      }

      const contactParts = [
        companyInfo?.phone ? `Tel: ${companyInfo.phone}` : "Tel: 0502497632", // --- مُعدل ---
        companyInfo?.email ? `Email: ${companyInfo.email}` : "Email: mahi213213@gmail.com", // --- مُعدل ---
      ].filter(Boolean);
      const contactLine = contactParts.length ? contactParts.join(' | ') : undefined;
      addHeaderLine(contactLine, 5);

      // عنوان الفاتورة
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      headerY += 11;
      doc.text('TAX INVOICE', 105, headerY, { align: 'center' });

      // خط فاصل تحت العنوان
      doc.setDrawColor(200);
      doc.setLineWidth(0.3);
      doc.line(10, headerY + 3, 200, headerY + 3);

      // === بيانات الفاتورة الأساسية ===
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const invoiceNo = saleData?.invoiceNumber || 'INV-00001';
      const invoiceDate = saleData?.date || new Date().toLocaleDateString();
      const customerName = (saleData?.customer && (saleData.customer.name || saleData.customer.fullName)) || 'Walk-in Customer';
      const customerContact = saleData?.customer?.phone || saleData?.customer?.email || '';

      let infoY = headerY + 10;
      doc.text(`Invoice No: ${invoiceNo}`, 10, infoY);
      doc.text(`Date: ${invoiceDate}`, 10, infoY + 5);
      doc.text(`Customer: ${customerName}`, 10, infoY + 10);
      if (customerContact) {
        doc.text(`Contact: ${customerContact}`, 10, infoY + 15);
      }

      // جهة اليمين: بيانات المتجر إن وجدت
      const rightInfoX = 120;
      doc.text(`Store: NASMAT JAMAL`, rightInfoX, infoY);
      if (companyInfo?.trn) doc.text(`TRN: ${companyInfo.trn}`, rightInfoX, infoY + 5);
      if (companyInfo?.phone) doc.text(`Tel: ${companyInfo.phone}`, rightInfoX, infoY + 10);
      if (companyInfo?.email) doc.text(`Email: ${companyInfo.email}`, rightInfoX, infoY + 15);

      // === جدول الأصناف ===
      const items = Array.isArray(saleData?.items) ? saleData.items : [];
      const tableRows = items.map((item, idx) => {
        const name = item.name || item.productName || item.description || 'Item';
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || item.rate || 0);
        const amount = qty * price;
        return [idx + 1, String(name), qty, price.toFixed(2), amount.toFixed(2)];
      });

      if (tableRows.length === 0) {
        tableRows.push(['-', 'No items', '-', '-', '-']);
      }

      // استخدم دالة autoTable مباشرة لضمان التوافق مع الإصدار الحالي
      autoTable(doc, {
        head: [["S.No", "Description", "Qty", "Rate", "Amount"]],
        body: tableRows,
        startY: infoY + 25,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 14 },
          1: { cellWidth: 90 },
          2: { halign: 'right', cellWidth: 18 },
          3: { halign: 'right', cellWidth: 30 },
          4: { halign: 'right', cellWidth: 30 },
        },
      });

      // === المبلغ بالحروف ===
      const totalsY = ((doc.lastAutoTable && doc.lastAutoTable.finalY) || 150) + 10; // --- مُعدل ---: قيمة افتراضية لـ finalY
      const wordsY = totalsY + 35;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Amount in Words:', 10, wordsY);

      // === الإجماليات ===
      const computedSubtotal = items.length
        ? items.reduce((acc, item) => acc + Number(item.quantity || 1) * Number(item.price || 0), 0)
        : 0;
      const subtotal = Number(saleData?.subtotal ?? computedSubtotal);
      const discount = Number(saleData?.discount ?? 0);
      const taxPercent = 0.05; // 5%
      const vatAmount = Number(saleData?.tax ?? (subtotal - discount) * taxPercent);
      const invoiceTotal = Number(saleData?.total ?? (subtotal - discount + vatAmount));

      // عرض صندوق الإجماليات على يمين الصفحة
      let totalsBoxY = ((doc.lastAutoTable && doc.lastAutoTable.finalY) || infoY + 25) + 6;
      const boxX = 120;
      doc.setDrawColor(25, 118, 210);
      doc.setLineWidth(0.4);
      doc.rect(boxX, totalsBoxY, 80, 32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Summary', boxX + 40, totalsBoxY + 6, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Subtotal: ${subtotal.toFixed(2)}`, boxX + 4, totalsBoxY + 12);
      doc.text(`Discount: ${discount.toFixed(2)}`, boxX + 4, totalsBoxY + 17);
      doc.text(`VAT (5%): ${vatAmount.toFixed(2)}`, boxX + 4, totalsBoxY + 22);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ${invoiceTotal.toFixed(2)}`, boxX + 4, totalsBoxY + 27);
      
      // تحويل المبلغ إلى كلمات
      const amountInWords = toWords.convert(invoiceTotal);
      const arabicWords = numberToArabicWords(invoiceTotal);
      
      // عرض المبلغ بالكلمات باللغة الإنجليزية
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`English: ${amountInWords}`, 10, wordsY + 7);
      
      // --- جديد ---: عرض المبلغ بالكلمات بالعربية
      if (amiriReady) {
        const reshapeFn = getArabicReshapeFn();
        if (reshapeFn) {
          const reshapedArabicWords = reshapeFn(arabicWords);
          doc.setFont('Amiri'); // استخدام الخط العربي
          doc.setFontSize(10);
          // الطباعة من اليمين
          doc.text(reshapedArabicWords, 200, wordsY + 7, { align: 'right' });
        }
      }
      // --- نهاية الكود الجديد ---
      
      // === التذييل ===
      // ... (الكود الخاص بك كما هو)
      const footerY = 250;
      
      // ... (باقي كود التوقيع والملاحظات)
      
      // فتح الـ PDF في نافذة جديدة
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // تنظيف الذاكرة
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('حدث خطأ أثناء إنشاء الفاتورة. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<PrintIcon />}
      onClick={generateInvoice}
      sx={{
        // ... (الـ sx الخاص بك كما هو)
      }}
    >
      طباعة فاتورة A4
    </Button>
  );
};

export default A4InvoiceGenerator;