import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class NoteService {
  static create(data, segments) {
    return authAxios
      .post('/note', {
        ...data,
        segments,
      })
      .then((response) => response.data);
  }

  static update(id, data, segments) {
    return authAxios
      .put(`/note/${id}`, {
        ...data,
        segments,
      })
      .then((response) => response.data);
  }

  static destroyAll(ids, segments) {
    const params = {
      ids,
      segments,
    };

    return authAxios
      .delete('/note', {
        params,
        segments,
      })
      .then((response) => response.data);
  }

  static list({
    filter,
    orderBy,
    limit,
    offset,
    segments,
  }) {
    const body = {
      filter,
      orderBy,
      limit,
      offset,
      segments,
    };

    return authAxios
      .post('/note/query', body)
      .then((response) => response.data);
  }
}
