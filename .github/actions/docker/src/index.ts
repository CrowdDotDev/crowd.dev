import { IS_POST } from './constants';

setImmediate(async () => {
  if (!IS_POST) {
    // execute main action
  } else {
    // execute cleanup action
  }
});
