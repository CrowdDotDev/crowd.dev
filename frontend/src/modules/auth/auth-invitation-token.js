/**
 * Available only in the current session of the browser
 */
export default class AuthInvitationToken {
  static get() {
    return sessionStorage.getItem('invitationToken') || null;
  }

  static set(token) {
    sessionStorage.setItem('invitationToken', token);
  }

  static clear() {
    sessionStorage.removeItem('invitationToken');
  }
}
