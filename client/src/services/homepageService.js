import api from './api';

export const homepageService = {
  getSections: async () => {
    const { data } = await api.get('/homepage-sections');
    return data;
  }
};
