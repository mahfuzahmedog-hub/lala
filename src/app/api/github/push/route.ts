import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token, owner, repo, branch, files, message } = await req.json();

    if (!token || !owner || !repo || !files) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get the current commit SHA of the branch
    const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!branchRes.ok) {
      const error = await branchRes.json();
      return NextResponse.json({ error: `GitHub API error: ${error.message}` }, { status: branchRes.status });
    }

    const branchData = await branchRes.json();
    const baseTreeSha = branchData.commit.commit.tree.sha;

    // 2. Create blobs for each file
    const tree = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        // Remove leading slash for GitHub paths
        const githubPath = path.startsWith('/') ? path.slice(1) : path;
        return {
          path: githubPath,
          mode: '100644',
          type: 'blob',
          content: content as string,
        };
      })
    );

    // 3. Create a new tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree,
      }),
    });

    const newTreeData = await treeRes.json();

    // 4. Create a new commit
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message || 'VibeCode: Cloud sync',
        tree: newTreeData.sha,
        parents: [branchData.commit.sha],
      }),
    });

    const newCommitData = await commitRes.json();

    // 5. Update the branch reference
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
      }),
    });

    if (!refRes.ok) {
      return NextResponse.json({ error: 'Failed to update branch reference' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sha: newCommitData.sha });
  } catch (error: any) {
    console.error('GitHub Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
