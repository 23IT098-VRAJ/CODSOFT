import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import { Avatar, Field, Modal, Spinner } from '../ui';
import api, { errorMessage } from '../../lib/axios';
import { T_EXIT, T_STATE } from '../../lib/motion';

// Who is on the project: invite by email, remove a member (owner), or leave.
export default function MembersModal({ open, onClose, project, onChange }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const isOwner = project.ownerId === user._id;

  const add = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setError('');
    try {
      const { data } = await api.post(`/api/projects/${project._id}/members`, { email });
      onChange(data);
      setEmail('');
      showToast('Member added', 'success');
    } catch (err) {
      setError(errorMessage(err, 'Could not add that person'));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (member) => {
    const self = member._id === user._id;
    setBusyId(member._id);
    try {
      const { data } = await api.delete(`/api/projects/${project._id}/members/${member._id}`);
      if (self) {
        showToast('You left the project', 'success');
        navigate('/dashboard');
        return;
      }
      onChange(data, true); // tasks may have become unassigned
      showToast(`${member.name} was removed`, 'success');
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Members · ${project.members.length}`}>
      <form onSubmit={add} noValidate>
        <Field label="Invite by email" error={error} hint="They need a TaskFlow account already.">
          <div className="flex gap-2">
            <input type="email" className={`input ${error ? 'input-error' : ''}`} placeholder="name@example.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }} />
            <button type="submit" disabled={adding || !email.trim()} className="btn-primary shrink-0">{adding ? <Spinner /> : <UserPlus className="w-4 h-4" />} Add</button>
          </div>
        </Field>
      </form>

      <ul className="mt-5 divide-y divide-line">
        <AnimatePresence initial={false}>
          {project.members.map((mbr) => {
            const owner = mbr._id === project.ownerId;
            const self = mbr._id === user._id;
            return (
              <m.li key={mbr._id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: T_STATE }} exit={{ opacity: 0, transition: T_EXIT }}
                className="flex items-center gap-3 py-2.5">
                <Avatar user={mbr} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{mbr.name}{self && <span className="text-muted font-normal"> (you)</span>}</p>
                  <p className="text-xs text-muted truncate">{mbr.email}</p>
                </div>
                {owner ? <span className="badge bg-sunken text-ink-soft">Owner</span>
                  : (isOwner || self) && (
                    <button onClick={() => remove(mbr)} disabled={busyId === mbr._id} className="btn-ghost !py-1 !px-2.5 !text-xs !text-danger hover:!bg-danger-soft">
                      {busyId === mbr._id && <Spinner className="w-3 h-3" />}{self ? 'Leave' : 'Remove'}
                    </button>
                  )}
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Modal>
  );
}
