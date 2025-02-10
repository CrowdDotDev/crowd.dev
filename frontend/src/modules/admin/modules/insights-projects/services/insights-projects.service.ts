import authAxios from '@/shared/axios/auth-axios';

export class InsightsProjectsService {
  static async list(query: any) {
    // const customData = {
    //   rows: [
    //     {
    //       id: '1',
    //       name: 'Project 1',
    //       logoUrl: 'https://via.placeholder.com/150',
    //       collections: [
    //         {
    //           id: '1',
    //           name: 'Collection 1',
    //         },
    //         {
    //           id: '2',
    //           name: 'Collection 2',
    //         },
    //         {
    //           id: '3',
    //           name: 'Collection 3',
    //         },
    //       ],
    //       organization: {
    //         name: 'Organization 1',
    //         logoUrl: 'https://via.placeholder.com/150',
    //       },
    //       starred: false,
    //     },
    //     {
    //       id: '2',
    //       name: 'Project 2',
    //       logoUrl: 'https://via.placeholder.com/150',
    //       collections: [
    //         {
    //           id: '1',
    //           name: 'Collection 1',
    //         },
    //       ],
    //       organization: {
    //         name: 'Organization 2',
    //         logoUrl: 'https://via.placeholder.com/150',
    //       },
    //       starred: false,
    //     },
    //   ],
    //   total: 24,
    //   offset: 0,
    //   limit: 0,
    // };
    // return customData;
    const response = await authAxios.post(
      '/collections/insights-projects/query',
      query,
    );
    return response.data;
  }

  static async delete(collectionId: string) {
    const response = await authAxios.delete(
      `/collections/insights-projects/${collectionId}`,
    );

    return response.data;
  }
}
