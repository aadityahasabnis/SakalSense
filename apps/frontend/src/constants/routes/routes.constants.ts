// =============================================
// Route Helper
// =============================================

export const withId = (base: string, suffix = '') => (id: string) => `${base}/${id}${suffix}`;
