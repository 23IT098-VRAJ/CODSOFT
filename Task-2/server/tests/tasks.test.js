const { api, bearer, createUser, createProject, addMember, createTask, column, missingId } = require('./helpers');
const Task = require('../models/Task');

describe('Tasks', () => {
  let owner;
  let member;
  let outsider;
  let project;

  beforeEach(async () => {
    owner = await createUser({ name: 'Olivia Owner' });
    member = await createUser({ name: 'Mihir Member' });
    outsider = await createUser({ name: 'Omar Outsider' });
    project = await createProject(owner);
    await addMember(owner, project, member);
  });

  const move = (id, body, who = owner) => api().patch(`/api/tasks/${id}/move`).set(bearer(who.token)).send(body);
  const update = (id, body, who = owner) => api().put(`/api/tasks/${id}`).set(bearer(who.token)).send(body);

  test('creates a task at the bottom of its column, with defaults', async () => {
    const first = await createTask(owner, project, { title: 'First' });
    const second = await createTask(member, project, { title: 'Second' });

    expect(first).toMatchObject({ title: 'First', status: 'Todo', priority: 'Medium', order: 0, assigneeId: null });
    expect(second.order).toBe(1);
    expect(await column(owner, project, 'Todo')).toEqual(['First', 'Second']);
  });

  test('validates task data', async () => {
    const post = (body) => api().post('/api/tasks').set(bearer(owner.token)).send({ projectId: project._id, ...body });

    expect((await post({})).status).toBe(400); // no title
    expect((await post({ title: 'x', status: 'Blocked' })).status).toBe(400);
    expect((await post({ title: 'x', priority: 'Urgent' })).status).toBe(400);
    expect((await post({ title: 'x', projectId: 'nope' })).status).toBe(400);
    expect((await post({ title: 'x', projectId: missingId })).status).toBe(404);
  });

  test('outsiders cannot read, create, edit, move or delete tasks', async () => {
    const task = await createTask(owner, project);
    const as = bearer(outsider.token);

    expect((await api().get(`/api/tasks/${project._id}`).set(as)).status).toBe(403);
    expect((await api().post('/api/tasks').set(as).send({ title: 'x', projectId: project._id })).status).toBe(403);
    expect((await update(task._id, { title: 'Hijacked' }, outsider)).status).toBe(403);
    expect((await move(task._id, { status: 'Done', order: 0 }, outsider)).status).toBe(403);
    expect((await api().delete(`/api/tasks/${task._id}`).set(as)).status).toBe(403);
    expect((await Task.findById(task._id)).title).toBe('A task');
  });

  test('a task can only be assigned to a member of the project', async () => {
    const task = await createTask(owner, project);

    const bad = await update(task._id, { assigneeId: outsider.user._id });
    expect(bad.status).toBe(400);

    const ok = await update(task._id, { assigneeId: member.user._id });
    expect(ok.body.assigneeId).toMatchObject({ _id: member.user._id, name: 'Mihir Member' });

    const bad2 = await api().post('/api/tasks').set(bearer(owner.token)).send({ title: 'x', projectId: project._id, assigneeId: outsider.user._id });
    expect(bad2.status).toBe(400);
  });

  test('saves the task form exactly as the web client sends it', async () => {
    const task = await createTask(owner, project, { assigneeId: member.user._id, dueDate: '2030-01-01' });

    // TaskModal sends every field, with null for "no assignee" / "no date".
    const res = await update(task._id, {
      title: 'Renamed', description: 'More detail', status: 'Todo', priority: 'High', assigneeId: null, dueDate: null,
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'Renamed', description: 'More detail', priority: 'High', assigneeId: null, dueDate: null, order: 0 });
  });

  describe('moving tasks on the board', () => {
    let a; let b; let c;
    beforeEach(async () => {
      a = await createTask(owner, project, { title: 'A' });
      b = await createTask(owner, project, { title: 'B' });
      c = await createTask(owner, project, { title: 'C' });
    });

    test('reordering inside a column shifts the other tasks', async () => {
      await move(c._id, { status: 'Todo', order: 0 }); // drag C to the top
      expect(await column(owner, project, 'Todo')).toEqual(['C', 'A', 'B']);

      await move(c._id, { status: 'Todo', order: 2 }); // and back to the bottom
      expect(await column(owner, project, 'Todo')).toEqual(['A', 'B', 'C']);

      const orders = (await Task.find({ projectId: project._id }).sort('order')).map((t) => t.order);
      expect(orders).toEqual([0, 1, 2]); // no gaps, no duplicates
    });

    test('moving to another column inserts at the drop position and closes the gap behind', async () => {
      await createTask(owner, project, { title: 'X', status: 'In Progress' });
      await createTask(owner, project, { title: 'Y', status: 'In Progress' });

      const res = await move(a._id, { status: 'In Progress', order: 1 }); // drop A between X and Y
      expect(res.body).toMatchObject({ status: 'In Progress', order: 1 });

      expect(await column(owner, project, 'In Progress')).toEqual(['X', 'A', 'Y']);
      expect(await column(owner, project, 'Todo')).toEqual(['B', 'C']);
      const todo = await Task.find({ projectId: project._id, status: 'Todo' }).sort('order');
      expect(todo.map((t) => t.order)).toEqual([0, 1]);
    });

    test('a position past the end is clamped, and a bad position is rejected', async () => {
      await move(a._id, { status: 'Done', order: 99 });
      expect((await Task.findById(a._id)).order).toBe(0);

      expect((await move(b._id, { status: 'Done', order: -1 })).status).toBe(400);
      expect((await move(b._id, { status: 'Nowhere' })).status).toBe(400);
    });

    test('completion time is stamped on entering Done and cleared on leaving it', async () => {
      await move(a._id, { status: 'Done', order: 0 });
      expect((await Task.findById(a._id)).completedAt).toBeInstanceOf(Date);

      await move(a._id, { status: 'Todo', order: 0 });
      expect((await Task.findById(a._id)).completedAt).toBeNull();
    });

    test('changing status from the task form moves the task to the end of the new column', async () => {
      await createTask(owner, project, { title: 'X', status: 'Done' });
      const res = await update(a._id, { status: 'Done' });

      expect(res.body).toMatchObject({ status: 'Done', order: 1 });
      expect(await column(owner, project, 'Done')).toEqual(['X', 'A']);
      expect(await column(owner, project, 'Todo')).toEqual(['B', 'C']);
    });

    test('deleting a task closes the gap it leaves', async () => {
      await api().delete(`/api/tasks/${a._id}`).set(bearer(owner.token));
      const rest = await Task.find({ projectId: project._id }).sort('order');
      expect(rest.map((t) => [t.title, t.order])).toEqual([['B', 0], ['C', 1]]);
    });
  });

  test('filters a project’s tasks', async () => {
    await createTask(owner, project, { title: 'Design homepage', priority: 'High', assigneeId: member.user._id });
    await createTask(owner, project, { title: 'Fix login bug', status: 'In Progress', dueDate: '2000-01-01' });
    await createTask(owner, project, { title: 'Old and done', status: 'Done', dueDate: '2000-01-01' });
    const list = async (query) => (await api().get(`/api/tasks/${project._id}?${query}`).set(bearer(member.token))).body.map((t) => t.title);

    expect(await list('status=In%20Progress')).toEqual(['Fix login bug']);
    expect(await list('priority=High')).toEqual(['Design homepage']);
    expect(await list('assignee=me')).toEqual(['Design homepage']);
    expect((await list('assignee=none')).sort()).toEqual(['Fix login bug', 'Old and done']);
    expect(await list('overdue=true')).toEqual(['Fix login bug']); // finished tasks are never overdue
    expect(await list('q=LOGIN')).toEqual(['Fix login bug']);
    expect((await api().get(`/api/tasks/${project._id}?status=Nope`).set(bearer(member.token))).status).toBe(400);
  });

  test('"my tasks" spans projects and stops at projects I have left', async () => {
    const other = await createProject(member, { name: 'Side project' });
    await createTask(owner, project, { title: 'In shared project', assigneeId: member.user._id, dueDate: '2030-01-01' });
    await createTask(member, other, { title: 'In my project', assigneeId: member.user._id });
    await createTask(owner, project, { title: 'Not mine' });

    const res = await api().get('/api/tasks/mine').set(bearer(member.token));
    expect(res.body.map((t) => t.title)).toEqual(['In shared project', 'In my project']); // dated first
    expect(res.body[0].projectId).toMatchObject({ name: 'Website relaunch' });

    await api().delete(`/api/projects/${project._id}/members/${member.user._id}`).set(bearer(member.token));
    const after = await api().get('/api/tasks/mine').set(bearer(member.token));
    expect(after.body.map((t) => t.title)).toEqual(['In my project']);
  });

  describe('comments', () => {
    let task;
    beforeEach(async () => {
      task = await createTask(owner, project);
    });
    const comment = (who, body) => api().post(`/api/tasks/${task._id}/comments`).set(bearer(who.token)).send({ body });

    test('members can discuss a task; outsiders cannot', async () => {
      expect((await comment(owner, 'Can you take this?')).status).toBe(201);
      expect((await comment(member, 'On it.')).body).toMatchObject({ body: 'On it.', authorId: { name: 'Mihir Member' } });
      expect((await comment(outsider, 'spam')).status).toBe(403);
      expect((await comment(member, '   ')).status).toBe(400);

      const list = await api().get(`/api/tasks/${task._id}/comments`).set(bearer(member.token));
      expect(list.body.map((c) => c.body)).toEqual(['Can you take this?', 'On it.']);
    });

    test('a comment can be deleted by its author or the project owner only', async () => {
      const second = await createUser();
      await addMember(owner, project, second);
      const mine = (await comment(member, 'mine')).body;
      const del = (who, id) => api().delete(`/api/tasks/${task._id}/comments/${id}`).set(bearer(who.token));

      expect((await del(second, mine._id)).status).toBe(403);
      expect((await del(member, mine._id)).status).toBe(200);

      const another = (await comment(member, 'another')).body;
      expect((await del(owner, another._id)).status).toBe(200); // owner moderates
      expect((await del(owner, missingId)).status).toBe(404);
    });
  });

  test('the dashboard summarises my work across projects', async () => {
    await createTask(owner, project, { title: 'late', assigneeId: member.user._id, dueDate: '2000-01-01' });
    await createTask(owner, project, { title: 'soon', assigneeId: member.user._id, dueDate: new Date(Date.now() + 2 * 86400000).toISOString() });
    await createTask(owner, project, { title: 'done', assigneeId: member.user._id, status: 'Done' });
    await createTask(owner, project, { title: 'someone else’s' });

    const res = await api().get('/api/dashboard').set(bearer(member.token));
    expect(res.status).toBe(200);
    expect(res.body.projects).toMatchObject({ total: 1, byStatus: { Active: 1, Completed: 0, 'On Hold': 0 } });
    expect(res.body.myTasks).toEqual({ byStatus: { Todo: 2, 'In Progress': 0, Done: 1 }, open: 2, overdue: 1 });
    expect(res.body.dueSoon.map((t) => t.title)).toEqual(['soon']);
    expect(res.body.recentActivity.length).toBeGreaterThan(0);

    const empty = await api().get('/api/dashboard').set(bearer(outsider.token));
    expect(empty.body.projects.total).toBe(0);
    expect(empty.body.recentActivity).toEqual([]);
  });
});
