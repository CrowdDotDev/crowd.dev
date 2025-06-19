import axios from 'axios'

type OrganizationInfo = {
  logoUrl: string;
  github: string;
  website: string | null;
  twitter: string | null;
};

export const getGithubOrganization = async ({ organizationName, token }: { organizationName: string, token: string }): Promise<OrganizationInfo> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  try {

    const { data } = await axios.get(`https://api.github.com/orgs/${organizationName}`, { headers });

    return {
      logoUrl: data.avatar_url,
      github: data.html_url,
      website: data.blog || null,
      twitter: data.twitter_username || null,
    };
  } catch (err) {
    console.error(`Failed to fetch organization data:`, err.response?.data || err.message);
    return {
      logoUrl: '',
      github: '',
      website: null,
      twitter: null,
    };
  }
}

export const getOrganizationTopics = async ({
  organizationName,
  repos,
  token,
}: {
  organizationName: string;
  repos: { name: string }[];
  token: string;
}): Promise<string[]> => {

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.mercy-preview+json',
  };

  const topicSet = new Set<string>();

  const topicPromises = repos.map(async (repo) => {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${organizationName}/${repo.name}/topics`,
        { headers }
      );

      res.data.names.forEach((topic: string) => topicSet.add(topic));
    } catch (err) {
      console.error(`Failed to fetch topics for ${repo.name}:`, err.response?.data || err.message);
    }
  });

  await Promise.all(topicPromises);

  return Array.from(topicSet);
};