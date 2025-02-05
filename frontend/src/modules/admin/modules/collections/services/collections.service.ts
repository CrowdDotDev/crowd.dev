import authAxios from '@/shared/axios/auth-axios';

const customData = {
  id: '1',
  name: 'Collection 1',
  description: 'Description 1',
  isLF: true,
  projects: [
    {
      id: '1',
      name: 'Project 1',
      description: 'Description 1',
    },
    {
      id: '2',
      name: 'Project 2',
      description: 'Description 2',
    },
  ],
};
export class CollectionsService {
  static async list(query: any) {
    return {
      rows: [customData],
      count: 1,
    };
    const response = await authAxios.get(
      '/collection/query',
      {
        params: query,
      },
    );

    return response.data;
  }
}
