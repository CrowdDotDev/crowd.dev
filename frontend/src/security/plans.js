/**
 * List of Plans
 */
class Plans {
  static get values() {
    return {
      essential: 'Essential',
      growth: 'Growth',
      enterprise: 'Enterprise',
      ['eagle-eye']: 'Eagle Eye'
    }
  }

  static get communityValues() {
    return {
      community: 'Community',
      custom: 'Custom'
    }
  }
}

export default Plans
