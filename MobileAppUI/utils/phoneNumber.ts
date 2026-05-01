export const INDIA_COUNTRY_CODE = "+91";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const sanitizeIndianMobileInput = (value: string): string => {
  let digits = value.replace(/\D/g, "");

  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (digits.length > 10 && digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }

  return digits.slice(0, 10);
};

export const validateIndianMobile = (value: string, required = true): string | null => {
  const digits = sanitizeIndianMobileInput(value);

  if (!digits) {
    return required ? "Phone number is required." : null;
  }

  if (digits.length !== 10) {
    return "Enter a 10-digit mobile number.";
  }

  if (!INDIAN_MOBILE_REGEX.test(digits)) {
    return "Enter a valid Indian mobile number.";
  }

  return null;
};

export const toIndianE164 = (value: string): string => {
  const digits = sanitizeIndianMobileInput(value);
  return digits ? `${INDIA_COUNTRY_CODE}${digits}` : "";
};

export const formatIndianMobileForDisplay = (value: string | null | undefined): string => {
  if (!value) {
    return "Phone not available";
  }

  const digits = sanitizeIndianMobileInput(value);

  if (digits.length === 10) {
    return `${INDIA_COUNTRY_CODE} ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return value;
};