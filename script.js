const repo = 'pavry/Cheat-Sheet-for-Data-Analysts';
const branch = 'master';
const apiBase = `https://api.github.com/repos/${repo}/contents/`;
const rawBase = `https://raw.githubusercontent.com/${repo}/${branch}/`;
const excludeFiles = ['README.md', '.gitkeep'];
const excludeDirs = ['Cheat Sheet Viewer'];
const token = '-';

const container = document.getElementById('file-tree');
const loadingEl = document.getElementById('loading');

async function fetchFiles(path = '') {
  const res = await fetch(apiBase + path, {
    headers: token !== '-' ? { Authorization: `token ${token}` } : {}
  });
  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text());
    return [];
  }
  return await res.json();
}

async function buildTree(path = '') {
  const items = await fetchFiles(path);
  if (!items || items.length === 0) return null;

  const files = items.filter(i => i.type === 'file' && !excludeFiles.includes(i.name));
  const dirs = items.filter(i => i.type === 'dir' && !excludeDirs.includes(i.name));

  const folderEl = document.createElement('div');
  folderEl.className = 'folder';

  if (path) {
    const folderName = path.split('/').pop();
    const header = document.createElement('div');
    header.className = 'folder-header';

    const icon = document.createElement('span');
    icon.className = 'folder-icon';
    icon.textContent = '▶';

    header.appendChild(icon);
    header.appendChild(document.createTextNode(`📁 ${folderName}`));
    folderEl.appendChild(header);

    const content = document.createElement('div');
    content.className = 'folder-content';
    folderEl.appendChild(content);

    header.addEventListener('click', () => {
      const isActive = content.classList.toggle('active');
      icon.textContent = isActive ? '▼' : '▶';
    });

    if (files.length) {
      const ul = document.createElement('ul');
      files.forEach(f => {
        const link = `${rawBase}${encodeURIComponent(f.path).replace(/%2F/g, '/')}`;
        const li = document.createElement('li');
        li.innerHTML = `<a href="${link}" download>📥 ${f.name}</a>`;
        ul.appendChild(li);
      });
      content.appendChild(ul);
    }

    for (const d of dirs) {
      const subtree = await buildTree(d.path);
      if (subtree) content.appendChild(subtree);
    }
  } else {
    if (files.length) {
      const ul = document.createElement('ul');
      files.forEach(f => {
        const link = `${rawBase}${encodeURIComponent(f.path).replace(/%2F/g, '/')}`;
        const li = document.createElement('li');
        li.innerHTML = `<a href="${link}" download>📥 ${f.name}</a>`;
        ul.appendChild(li);
      });
      folderEl.appendChild(ul);
    }

    for (const d of dirs) {
      const subtree = await buildTree(d.path);
      if (subtree) folderEl.appendChild(subtree);
    }
  }

  return folderEl;
}

buildTree().then(tree => {
  loadingEl.style.display = 'none';
  container.textContent = '';
  if (tree) container.appendChild(tree);
  else container.textContent = '❌ Nothing found';
}).catch(err => {
  loadingEl.style.display = 'none';
  container.textContent = '❌ Loading error';
  console.error(err);
});

async function fetchLastCommit() {
  const commitsUrl = `https://api.github.com/repos/${repo}/commits?per_page=1`;
  const res = await fetch(commitsUrl, {
    headers: token !== '-' ? { Authorization: `token ${token}` } : {}
  });
  if (!res.ok) return 'Failed to load';

  const commits = await res.json();
  if (commits.length === 0) return 'No commits available';

  const commit = commits[0];
  const login = commit.author?.login || 'unknown';
  const dateObj = new Date(commit.commit.author.date);
  const date = dateObj.toISOString().slice(0, 16).replace('T', ' ');

  return `${login} ${date}`;
}

fetchLastCommit().then(text => {
  const el = document.getElementById('last-commit');
  if (el) el.textContent = text;
});
