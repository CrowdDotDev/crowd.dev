export const onboardingGuides = ({ store, router }) =>
  [
    {
      id: 'integration',
      title: 'Connect your first 2 integrations',
      description:
        'Connect with our built-in integrations to start syncing data from your digital channels.',
      videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      coverImageUrl: 'https://www.shutterstock.com/image-photo/old-brick-black-color-wall-600w-1605128917.jpg',
      actionText: 'Connect integrations',
      action: () => {
        router.push({
          name: 'integration'
        })
      },
      completed: () => {
        console.log(store)
        return false
      },
      display: () => {
        return true
      }
    },
    {
      id: 'enrich',
      title: 'Enrich a member',
      description:
        'Get more insights about members by enriching them with attributes such as emails, seniority, OSS contributions and much more.',
      videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      coverImageUrl: 'https://www.shutterstock.com/image-photo/old-brick-black-color-wall-600w-1605128917.jpg',
      actionText: 'Try member enrichment',
      action: () => {
        router.push({
          name: 'integration'
        })
      },
      completed: () => {
        return true
      },
      display: () => {
        return true
      }
    },
    {
      id: 'report',
      title: 'Look into a report',
      description:
        'Check our specially crafted default reports and dig into the inner workings of your community',
      videoUrl: '',
      coverImageUrl: 'https://www.shutterstock.com/image-photo/old-brick-black-color-wall-600w-1605128917.jpg',
      actionText: 'Explore reports',
      action: () => {
        router.push({
          name: 'integration'
        })
      },
      completed: () => {
        console.log('completed')
        return false
      },
      display: () => {
        return true
      }
    },
    {
      id: 'eagle-eye',
      title: 'Discover content in your niche',
      description:
        'Discover and engage with relevant content across various community platforms in order to gain developers’ mindshare and increase your community awareness',
      videoUrl: '',
      coverImageUrl: 'https://www.shutterstock.com/image-photo/old-brick-black-color-wall-600w-1605128917.jpg',
      actionText: 'Explore Eagle Eye',
      action: () => {
        router.push({
          name: 'integration'
        })
      },
      completed: () => {
        return false
      },
      display: () => {
        return true
      }
    },
    {
      id: 'invite',
      title: 'Invite your colleagues',
      description:
        'Invite colleagues to your crowd.dev workspace by giving full access or read-only permissions',
      videoUrl: '',
      coverImageUrl: 'https://www.shutterstock.com/image-photo/old-brick-black-color-wall-600w-1605128917.jpg',
      actionText: 'Invite colleagues',
      action: () => {
        router.push({
          name: 'integration'
        })
      },
      completed: () => {
        console.log('completed')
        return false
      },
      display: () => {
        return true
      }
    }
  ]
