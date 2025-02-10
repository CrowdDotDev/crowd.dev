import { CollectionModel } from '../models/collection.model';
import { CollectionsState } from './state';

export default {
  setCollections(this: CollectionsState, collections: CollectionModel[]) {
    this.collections = collections;
  },
  getCollection(this: CollectionsState, id: string) {
    return this.collections.find((c) => c.id === id);
  },
  getCollections(this: CollectionsState) {
    return this.collections;
  },
};
