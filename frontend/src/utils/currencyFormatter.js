import { useTranslation } from 'react-i18next';

/**
 * دالة لتنسيق العملة الإماراتية بشكل صحيح
 * @param {number} amount - المبلغ المراد تنسيقه
 * @param {string} language - اللغة المحددة (ar أو en)
 * @param {boolean} showSymbol - إظهار رمز العملة أم لا
 * @returns {string} المبلغ منسق بالعملة الإماراتية
 */
export const formatUAECurrency = (amount, language = 'ar', showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return language === 'ar' ? '0.00 د.إ' : 'AED 0.00';
  }

  const formattedAmount = parseFloat(amount).toFixed(2);
  
  if (language === 'ar') {
    // تنسيق عربي: المبلغ + رمز العملة
    return showSymbol ? `${formattedAmount} د.إ` : formattedAmount;
  } else {
    // تنسيق إنجليزي: رمز العملة + المبلغ
    return showSymbol ? `AED ${formattedAmount}` : formattedAmount;
  }
};

/**
 * مكون React Hook لتنسيق العملة مع الترجمة
 */
export const useCurrencyFormatter = () => {
  const { i18n } = useTranslation();
  
  const formatCurrency = (amount, showSymbol = true) => {
    return formatUAECurrency(amount, i18n.language, showSymbol);
  };

  const getCurrencySymbol = () => {
    return i18n.language === 'ar' ? 'د.إ' : 'AED';
  };

  const getCurrencyName = () => {
    return i18n.language === 'ar' ? 'درهم إماراتي' : 'UAE Dirham';
  };

  return {
    formatCurrency,
    getCurrencySymbol,
    getCurrencyName
  };
};

/**
 * دالة لتحويل الأرقام إلى العربية
 * @param {string} number - الرقم المراد تحويله
 * @returns {string} الرقم بالأرقام العربية
 */
export const toArabicNumbers = (number) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return number.toString().replace(/[0-9]/g, (digit) => arabicNumbers[digit]);
};

/**
 * دالة شاملة لتنسيق العملة مع خيارات متقدمة
 * @param {number} amount - المبلغ
 * @param {object} options - خيارات التنسيق
 * @returns {string} المبلغ منسق
 */
export const formatCurrencyAdvanced = (amount, options = {}) => {
  const {
    language = 'ar',
    showSymbol = true,
    useArabicNumbers = false,
    showCurrencyName = false,
    precision = 2
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return language === 'ar' ? '0.00 د.إ' : 'AED 0.00';
  }

  let formattedAmount = parseFloat(amount).toFixed(precision);
  
  if (useArabicNumbers && language === 'ar') {
    formattedAmount = toArabicNumbers(formattedAmount);
  }

  if (language === 'ar') {
    let result = formattedAmount;
    if (showSymbol) result += ' د.إ';
    if (showCurrencyName) result += ' (درهم إماراتي)';
    return result;
  } else {
    let result = showSymbol ? `AED ${formattedAmount}` : formattedAmount;
    if (showCurrencyName) result += ' (UAE Dirham)';
    return result;
  }
};