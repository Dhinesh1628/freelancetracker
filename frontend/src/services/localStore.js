/**
 * Autonomous Local Persistent Store for FreelanceTracker
 * Enables seamless offline and standalone Vercel operation
 * when a remote backend server is not reachable.
 */

const STORAGE_KEYS = {
  USERS: 'flt_users_db',
  PROJECTS: 'flt_projects_db',
  MEMBERS: 'flt_members_db'
};

function readDb(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeDb(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[LocalDB] Write failed for ${key}:`, e);
  }
}

function createSyntheticResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data
  };
}

export function localRegister(name, email, password) {
  const users = readDb(STORAGE_KEYS.USERS);
  const normalizedEmail = email.toLowerCase().trim();

  let user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (user) {
    // Return existing user if already created locally
    const token = `local_jwt_${user._id}_${Date.now()}`;
    return { token, user };
  }

  user = {
    _id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: btoa(password || 'secret'),
    role: 'Admin',
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeDb(STORAGE_KEYS.USERS, users);

  // Initialize starter projects for this new user
  seedStarterProjects(user._id);

  const token = `local_jwt_${user._id}_${Date.now()}`;
  return { token, user };
}

export function localLogin(email, password) {
  const users = readDb(STORAGE_KEYS.USERS);
  const normalizedEmail = email.toLowerCase().trim();

  let user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    // If not found in local db, create a profile automatically to prevent dead ends
    const name = email.split('@')[0] || 'Freelancer';
    return localRegister(name, email, password);
  }

  const token = `local_jwt_${user._id}_${Date.now()}`;
  return { token, user };
}

function seedStarterProjects(userId) {
  const projects = readDb(STORAGE_KEYS.PROJECTS);
  const hasProjects = projects.some(p => p.createdBy === userId || p.user === userId);

  if (!hasProjects) {
    const now = Date.now();
    const starter = [
      {
        _id: `prj_${now}_1`,
        name: 'SaaS Platform Redesign',
        client: 'Acme Technologies',
        status: 'In Progress',
        budget: 8500,
        paidAmount: 4250,
        deadline: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Complete UI/UX overhaul and design system implementation for enterprise dashboard.',
        members: [{ userId: userId, role: 'Admin' }],
        createdBy: userId,
        createdAt: new Date().toISOString()
      },
      {
        _id: `prj_${now}_2`,
        name: 'Payment Gateway Integration',
        client: 'Starlight E-commerce',
        status: 'Completed',
        budget: 4200,
        paidAmount: 4200,
        deadline: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Stripe Connect and automated invoicing system with webhook reconciliation.',
        members: [{ userId: userId, role: 'Admin' }],
        createdBy: userId,
        createdAt: new Date().toISOString()
      },
      {
        _id: `prj_${now}_3`,
        name: 'Mobile App Architecture Audit',
        client: 'Veloce Mobility',
        status: 'Pending',
        budget: 3200,
        paidAmount: 0,
        deadline: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Security review and offline caching layer optimization for mobile client.',
        members: [{ userId: userId, role: 'Admin' }],
        createdBy: userId,
        createdAt: new Date().toISOString()
      }
    ];

    writeDb(STORAGE_KEYS.PROJECTS, [...projects, ...starter]);
  }
}

export function handleLocalStoreDispatch(path, options = {}, currentUser = null) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const userId = currentUser?._id || 'usr_default';

  // 1. Projects collection: GET /projects, POST /projects
  if (path === '/projects') {
    const projects = readDb(STORAGE_KEYS.PROJECTS);

    if (method === 'GET') {
      const userProjects = projects.filter(p => p.createdBy === userId || p.user === userId || !p.createdBy);
      if (userProjects.length === 0) {
        seedStarterProjects(userId);
        return createSyntheticResponse(readDb(STORAGE_KEYS.PROJECTS));
      }
      return createSyntheticResponse(userProjects);
    }

    if (method === 'POST') {
      const newProj = {
        _id: `prj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: body.name || 'Untitled Project',
        client: body.client || 'General Client',
        status: body.status || 'Pending',
        budget: Number(body.budget) || 0,
        paidAmount: Number(body.paidAmount) || 0,
        deadline: body.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: body.description || '',
        members: [{ userId: userId, role: 'Admin' }],
        createdBy: userId,
        createdAt: new Date().toISOString()
      };

      projects.unshift(newProj);
      writeDb(STORAGE_KEYS.PROJECTS, projects);
      return createSyntheticResponse(newProj, 201);
    }
  }

  // 2. Project single item: GET /projects/:id, PUT /projects/:id, DELETE /projects/:id
  const projectItemMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectItemMatch) {
    const projectId = projectItemMatch[1];
    const projects = readDb(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p._id === projectId);

    if (method === 'GET') {
      const item = projects[index];
      if (!item) return createSyntheticResponse({ error: 'Project not found' }, 404);
      return createSyntheticResponse(item);
    }

    if (method === 'PUT') {
      if (index === -1) return createSyntheticResponse({ error: 'Project not found' }, 404);
      const updated = {
        ...projects[index],
        ...body,
        _id: projectId
      };
      projects[index] = updated;
      writeDb(STORAGE_KEYS.PROJECTS, projects);
      return createSyntheticResponse(updated);
    }

    if (method === 'DELETE') {
      if (index === -1) return createSyntheticResponse({ error: 'Project not found' }, 404);
      projects.splice(index, 1);
      writeDb(STORAGE_KEYS.PROJECTS, projects);
      return createSyntheticResponse({ success: true, message: 'Project deleted' });
    }
  }

  // 3. Project Members: /projects/:id/members
  const membersMatch = path.match(/^\/projects\/([^/]+)\/members(?:\/([^/]+))?$/);
  if (membersMatch) {
    const projectId = membersMatch[1];
    const memberId = membersMatch[2];
    const projects = readDb(STORAGE_KEYS.PROJECTS);
    const proj = projects.find(p => p._id === projectId);

    if (!proj) return createSyntheticResponse({ error: 'Project not found' }, 404);
    if (!proj.members) proj.members = [];

    if (method === 'GET') {
      return createSyntheticResponse(proj.members);
    }

    if (method === 'POST') {
      const newMember = {
        userId: {
          _id: `usr_${Date.now()}`,
          name: body.email?.split('@')[0] || 'Team Member',
          email: body.email || 'member@example.com'
        },
        role: body.role || 'Member'
      };
      proj.members.push(newMember);
      writeDb(STORAGE_KEYS.PROJECTS, projects);
      return createSyntheticResponse(newMember, 201);
    }

    if (method === 'DELETE') {
      proj.members = proj.members.filter(m => {
        const mId = m.userId?._id || m.userId || m._id;
        return mId !== memberId;
      });
      writeDb(STORAGE_KEYS.PROJECTS, projects);
      return createSyntheticResponse({ success: true });
    }
  }

  // 4. User Profile: GET /auth/me, PUT /auth/me
  if (path === '/auth/me' || path === '/auth/profile') {
    const users = readDb(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u._id === userId);

    if (method === 'GET') {
      const u = users[userIndex] || currentUser || { _id: userId, name: 'Freelancer', email: 'freelancer@example.com' };
      return createSyntheticResponse(u);
    }

    if (method === 'PUT') {
      const updated = {
        ...(users[userIndex] || currentUser || {}),
        ...body,
        _id: userId
      };
      if (userIndex !== -1) users[userIndex] = updated;
      else users.push(updated);
      writeDb(STORAGE_KEYS.USERS, users);
      return createSyntheticResponse(updated);
    }
  }

  return createSyntheticResponse({ error: 'Endpoint not supported in offline store' }, 404);
}
