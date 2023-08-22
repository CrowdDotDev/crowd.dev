import LogRocket from 'logrocket';
import config from '@/config';

export function initPendo(user) {
  if (!user) {
    return;
  }
  // This function creates anonymous visitor IDs in Pendo unless you change the visitor id field to use your app's values
  // This function uses the placeholder 'ACCOUNT-UNIQUE-ID' value for account ID unless you change the account id field to use your app's values
  // Call this function in your authentication promise handler or callback when your visitor and account id values are available
  // Please use Strings, Numbers, or Bools for value types.
  window.pendo.initialize({
    visitor: {
      id: user.id, // Required if user is logged in, default creates anonymous ID
      email: user.email, // Recommended if using Pendo Feedback, or NPS Email
      full_name: user.fullName, // Recommended if using Pendo Feedback
      // role:         // Optional

      // You can add any additional visitor level key-values here,
      // as long as it's not one of the above reserved names.
    },

    account: {
      id: this.currentTenant?.id, // Required if using Pendo Feedback, default uses the value 'ACCOUNT-UNIQUE-ID'
      name: this.currentTenant?.name, // Optional
      is_paying: this.currentTenant?.plan !== 'Essential', // Recommended if using Pendo Feedback
      // monthly_value:// Recommended if using Pendo Feedback
      // planLevel:    // Optional
      // planPrice:    // Optional
      // creationDate: // Optional

      // You can add any additional account level key-values here,
      // as long as it's not one of the above reserved names.
    },
  });
}

export default function identify(user) {
  if (!user) {
    return;
  }
  window.analytics.identify(user.id, {
    name: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
  });

  if (config.env === 'production') {
    LogRocket.identify(user.id, {
      name: user.fullName,
      email: user.email,
    });
  }

  initPendo(user);
}
