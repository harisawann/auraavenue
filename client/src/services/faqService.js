import api from './api';

export const faqService = {
  getFAQs: async (productId) => {
    const { data } = await api.get('/faqs', { params: productId ? { productId } : {} });
    return data;
  }
};
