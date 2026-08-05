const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const getHeaders = () => {
  const headers = {
    'User-Agent': 'commit-counter-backend',
    Accept: 'application/vnd.github+json',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
};

const buildGitHubUrl = (owner, repo, since, until) => {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
  url.searchParams.set('per_page', '100');
  if (since) url.searchParams.set('since', since);
  if (until) url.searchParams.set('until', until);
  return url.toString();
};

app.get('/api/repos', async (req, res) => {
  const { owner } = req.query;

  if (!owner) {
    return res.status(400).json({ error: 'owner is required query parameter' });
  }

  try {
    const githubUrl = `https://api.github.com/users/${owner}/repos?per_page=100`;
    const response = await fetch(githubUrl, { headers: getHeaders() });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'GitHub API error' });
    }

    const repos = data.map((item) => ({ name: item.name }));
    res.json({ total: repos.length, repos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.get('/api/commits', async (req, res) => {
  const { owner, repo, since, until } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({ error: 'owner and repo are required query parameters' });
  }

  try {
    const githubUrl = buildGitHubUrl(owner, repo, since, until);
    const response = await fetch(githubUrl, { headers: getHeaders() });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'GitHub API error' });
    }

    const commits = data.map((item) => ({
      sha: item.sha,
      author: item.commit.author.name,
      date: item.commit.author.date,
      message: item.commit.message,
      url: item.html_url,
    }));

    res.json({ total: commits.length, commits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
});

app.get('/api/contributions', async (req, res) => {
  const { owner, repo, since, until } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({ error: 'owner and repo are required query parameters' });
  }

  try {
    const githubUrl = buildGitHubUrl(owner, repo, since, until);
    const response = await fetch(githubUrl, { headers: getHeaders() });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'GitHub API error' });
    }

    const contributions = data.map((item) => ({
      sha: item.sha,
      author: item.commit.author.name,
      date: item.commit.author.date,
      message: item.commit.message,
    }));

    res.json({ total: contributions.length, contributions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
