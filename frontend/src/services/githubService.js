// Public GitHub REST API Wrapper with Error & Rate-Limit Guards

const GITHUB_API_BASE = 'https://api.github.com';

export const githubService = {
  // Fetch GitHub Public User Profile
  getUserProfile: async (username) => {
    const cleanUser = username.trim().replace(/^@/, '');
    if (!cleanUser) {
      throw new Error('Please enter a valid GitHub username.');
    }

    try {
      const response = await fetch(`${GITHUB_API_BASE}/users/${cleanUser}`, {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });

      if (response.status === 404) {
        throw new Error(`GitHub user "${cleanUser}" was not found.`);
      }

      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again in a few minutes.');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch GitHub profile (HTTP ${response.status}).`);
      }

      return await response.json();
    } catch (e) {
      if (e.message && e.message.includes('GitHub')) throw e;
      throw new Error('Network error connecting to GitHub API. Please check your internet connection.');
    }
  },

  // Fetch Public Repositories for User
  getUserRepos: async (username) => {
    const cleanUser = username.trim().replace(/^@/, '');
    try {
      const response = await fetch(`${GITHUB_API_BASE}/users/${cleanUser}/repos?sort=updated&per_page=30`, {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (e) {
      console.warn('Failed to fetch repositories:', e);
      return [];
    }
  },

  // Fetch Specific Repository Details
  getRepoDetails: async (owner, repoName) => {
    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repoName}`, {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });

      if (response.status === 404) {
        throw new Error(`Repository "${owner}/${repoName}" was not found or is private.`);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch repository details (HTTP ${response.status}).`);
      }

      return await response.json();
    } catch (e) {
      throw e;
    }
  },

  // Fetch Raw README Content for a Repository
  getRepoReadme: async (owner, repoName) => {
    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repoName}/readme`, {
        headers: { Accept: 'application/vnd.github.v3.raw' }
      });

      if (!response.ok) {
        return null;
      }

      return await response.text();
    } catch (e) {
      console.warn('Failed to fetch README content:', e);
      return null;
    }
  }
};
