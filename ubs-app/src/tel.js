export function regValidatePhone(phone) {
    if (!phone) return false;

    const cleanPhone = phone?.replace(/\D/g, '');
    const phonePattern = /^(55)?(\d{10,11})$/;
    return phonePattern.test(cleanPhone);
}


export function formatPhone(phone) {
    if (!phone || typeof phone !== 'string') return '';

    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('55')) {
        cleaned = cleaned.replace('55', '');
    }

    if (cleaned.length < 10 || cleaned.length > 11) {
        return '';
    }

    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);

    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`.trim();
    }

    return '';
}

export function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 13 && cleaned.startsWith('55')) {
        return `${cleaned}@c.us`;
    }

    if ((cleaned.length === 11 || cleaned.length === 12) && cleaned.startsWith('55')) {
        return `${cleaned}@c.us`;
    }

    if (cleaned.length === 11) {
        return `55${cleaned}@c.us`;
    }

    if (cleaned.length === 10) {
        return `55${cleaned}@c.us`;
    }

    return '';
}
