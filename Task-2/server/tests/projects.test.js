const { api, bearer, createUser, createProject, addMember, createTask, missingId } = require('./helpers');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');

describe('Projects', () => {
  let owner;
  let member;
  let outsider;

  beforeEach(async () => {
    owner = await createUser({ name: 'Olivia Owner' });
    member = await createUser({ name: 'Mihir Member' });
    outsider = await createUser({ name: 'Omar Outsider' });
  });

  test('creates a project with the owner as its first member', async () => {
    const res = await api().post('/api/projects').set(bearer(owner.token))
      .send({ name: 'Website relaunch', description: 'Q3', color: '#0ea5e9', status: 'Active', dueDate: '2030-01-31' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Website relaunch', color: '#0ea5e9', status: 'Active', ownerId: owner.user._id });
    expect(res.body.members).toEqual([expect.objectContaining({ _id: owner.user._id, name: 'Olivia Owner' })]);
    expect(res.body.members[0].password).toBeUndefined();
  });

  test('accepts the empty due date the web form sends', async () => {
    const created = await api().post('/api/projects').set(bearer(owner.token)).send({ name: 'No date', dueDate: '' });
    expect(created.status).toBe(201);
    expect(created.body.dueDate).toBeNull();

    const cleared = await api().put(`/api/projects/${created.body._id}`).set(bearer(owner.token)).send({ dueDate: '2030-05-01' });
    expect(new Date(cleared.body.dueDate).getFullYear()).toBe(2030);
  });

  test('validates project data instead of failing with a server error', async () => {
    const post = (body) => api().post('/api/projects').set(bearer(owner.token)).send(body);
    expect((await post({})).status).toBe(400);
    expect((await post({ name: 'x', status: 'Archived' })).status).toBe(400);
    expect((await post({ name: 'x', color: 'red; background:url(x)' })).status).toBe(400);
    expect((await post({ name: 'x', dueDate: 'not a date' })).status).toBe(400);
  });

  test('lists only my projects, with task statistics', async () => {
    const mine = await createProject(owner, { name: 'Mine' });
    await createProject(outsider, { name: 'Theirs' });
    await createTask(owner, mine, { title: 'a', status: 'Done' });
    await createTask(owner, mine, { title: 'b', dueDate: '2000-01-01' }); // overdue
    await createTask(owner, mine, { title: 'c' });

    const res = await api().get('/api/projects').set(bearer(owner.token));
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: 'Mine', taskStats: { done: 1, total: 3, overdue: 1 } });

    const filtered = await api().get('/api/projects?status=Completed').set(bearer(owner.token));
    expect(filtered.body).toHaveLength(0);
  });

  test('only members can open a project; bad and unknown ids are handled', async () => {
    const project = await createProject(owner);

    expect((await api().get(`/api/projects/${project._id}`).set(bearer(owner.token))).status).toBe(200);
    expect((await api().get(`/api/projects/${project._id}`).set(bearer(outsider.token))).status).toBe(403);
    expect((await api().get(`/api/projects/${missingId}`).set(bearer(owner.token))).status).toBe(404);
    expect((await api().get('/api/projects/not-an-id').set(bearer(owner.token))).status).toBe(400);
  });

  test('members can edit a project, outsiders cannot, and only the owner can delete it', async () => {
    const project = await createProject(owner);
    await addMember(owner, project, member);
    const put = (who, body) => api().put(`/api/projects/${project._id}`).set(bearer(who.token)).send(body);

    const edited = await put(member, { status: 'On Hold' });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ status: 'On Hold', name: 'Website relaunch' }); // partial update
    expect((await put(outsider, { name: 'Hijacked' })).status).toBe(403);

    expect((await api().delete(`/api/projects/${project._id}`).set(bearer(member.token))).status).toBe(403);
    expect((await api().delete(`/api/projects/${project._id}`).set(bearer(owner.token))).status).toBe(200);
  });

  test('a client cannot change the owner or the member list through an update', async () => {
    const project = await createProject(owner);
    const res = await api().put(`/api/projects/${project._id}`).set(bearer(owner.token))
      .send({ name: 'Renamed', ownerId: outsider.user._id, members: [outsider.user._id] });

    expect(res.body.name).toBe('Renamed');
    expect(res.body.ownerId).toBe(owner.user._id);
    expect(res.body.members.map((m) => m._id)).toEqual([owner.user._id]);
  });

  test('deleting a project removes its tasks, comments and activity', async () => {
    const project = await createProject(owner);
    const task = await createTask(owner, project);
    await api().post(`/api/tasks/${task._id}/comments`).set(bearer(owner.token)).send({ body: 'hello' });

    await api().delete(`/api/projects/${project._id}`).set(bearer(owner.token));

    expect(await Task.countDocuments({ projectId: project._id })).toBe(0);
    expect(await Comment.countDocuments({ projectId: project._id })).toBe(0);
    expect(await Activity.countDocuments({ projectId: project._id })).toBe(0);
  });

  describe('members', () => {
    let project;
    beforeEach(async () => {
      project = await createProject(owner);
    });

    test('adds a registered user by email and returns the populated project', async () => {
      const res = await addMember(owner, project, member);
      expect(res.status).toBe(200);
      expect(res.body.members.map((m) => m.name)).toEqual(['Olivia Owner', 'Mihir Member']);

      // the new member can now see the project
      expect((await api().get(`/api/projects/${project._id}`).set(bearer(member.token))).status).toBe(200);
    });

    test('rejects unknown emails, duplicates and outsiders', async () => {
      const add = (who, email) => api().post(`/api/projects/${project._id}/members`).set(bearer(who.token)).send({ email });
      await addMember(owner, project, member);

      expect((await add(owner, 'ghost@test.dev')).status).toBe(404);
      expect((await add(owner, member.user.email)).status).toBe(400);
      expect((await add(owner, 'not-an-email')).status).toBe(400);
      expect((await add(outsider, outsider.user.email)).status).toBe(403);
    });

    test('the owner can remove a member, whose tasks become unassigned', async () => {
      await addMember(owner, project, member);
      const task = await createTask(owner, project, { assigneeId: member.user._id });

      const res = await api().delete(`/api/projects/${project._id}/members/${member.user._id}`).set(bearer(owner.token));
      expect(res.status).toBe(200);
      expect(res.body.members.map((m) => m._id)).toEqual([owner.user._id]);

      expect((await Task.findById(task._id)).assigneeId).toBeNull();
      expect((await api().get(`/api/projects/${project._id}`).set(bearer(member.token))).status).toBe(403);
    });

    test('a member can leave; a member cannot remove others; the owner cannot be removed', async () => {
      const second = await createUser();
      await addMember(owner, project, member);
      await addMember(owner, project, second);
      const remove = (who, target) => api().delete(`/api/projects/${project._id}/members/${target.user._id}`).set(bearer(who.token));

      expect((await remove(member, second)).status).toBe(403);
      expect((await remove(member, owner)).status).toBe(400);
      expect((await remove(owner, owner)).status).toBe(400);
      expect((await remove(member, member)).status).toBe(200); // leaves
      expect((await remove(owner, outsider)).status).toBe(404);
    });
  });

  test('project statistics summarise status, priority, overdue work and workload', async () => {
    const project = await createProject(owner);
    await addMember(owner, project, member);
    await createTask(owner, project, { title: 'done', status: 'Done', assigneeId: member.user._id });
    await createTask(owner, project, { title: 'late', priority: 'High', dueDate: '2000-01-01', assigneeId: member.user._id });
    await createTask(owner, project, { title: 'wip', status: 'In Progress', priority: 'Low' });
    await createTask(owner, project, { title: 'todo' });

    const res = await api().get(`/api/projects/${project._id}/stats`).set(bearer(member.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total: 4,
      byStatus: { Todo: 2, 'In Progress': 1, Done: 1 },
      openByPriority: { Low: 1, Medium: 1, High: 1 },
      completion: 25,
      overdue: 1,
      unassigned: 2,
      completedThisWeek: 1,
    });
    expect(res.body.workload[0]).toMatchObject({ user: { name: 'Mihir Member' }, open: 1, done: 1 });
    expect((await api().get(`/api/projects/${project._id}/stats`).set(bearer(outsider.token))).status).toBe(403);
  });

  test('the activity feed records what happened, newest first', async () => {
    const project = await createProject(owner);
    await addMember(owner, project, member);
    const task = await createTask(member, project, { title: 'Write copy' });
    await api().patch(`/api/tasks/${task._id}/move`).set(bearer(member.token)).send({ status: 'Done', order: 0 });

    const res = await api().get(`/api/projects/${project._id}/activity`).set(bearer(owner.token));
    expect(res.body.map((a) => a.type)).toEqual(['task.completed', 'task.created', 'member.added', 'project.created']);
    expect(res.body[0]).toMatchObject({ actorId: { name: 'Mihir Member' }, meta: { title: 'Write copy', from: 'Todo', to: 'Done' } });

    const limited = await api().get(`/api/projects/${project._id}/activity?limit=2`).set(bearer(owner.token));
    expect(limited.body).toHaveLength(2);
  });
});
