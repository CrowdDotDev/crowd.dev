import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

export default class ProgressBar {
  static start() {
    NProgress.start();
  }

  static done() {
    NProgress.done();
  }
}
