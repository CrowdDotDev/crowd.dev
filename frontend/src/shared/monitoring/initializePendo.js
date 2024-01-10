export default function initializePendo(user, tenant) {
  if (!user && !tenant) {
    return;
  }

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
      id: tenant.id, // Required if using Pendo Feedback, default uses the value 'ACCOUNT-UNIQUE-ID'
      name: tenant.name, // Optional
      is_paying: tenant.plan !== 'Essential', // Recommended if using Pendo Feedback
      // monthly_value:// Recommended if using Pendo Feedback
      // planLevel:    // Optional
      // planPrice:    // Optional
      // creationDate: // Optional

      // You can add any additional account level key-values here,
      // as long as it's not one of the above reserved names.
    },
  });
}
